from fastapi import APIRouter
from app.models.schemas import (
    AnalyticsSummary, AnalyticsDetailed,
    PeakHour, QueryType, ConversionStats, SentimentBreakdown,
)
from app.db.supabase_client import get_supabase
from app.services.ai_service import _get_active_business
from datetime import date
from collections import Counter

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary():
    db = get_supabase()
    today = date.today().isoformat()

    leads_result = db.table("leads").select("id, source, status, created_at").execute()
    all_leads = leads_result.data or []

    bookings_result = db.table("bookings").select("id, status, date").execute()
    all_bookings = bookings_result.data or []

    convs_result = db.table("conversations").select("id").execute()
    total_convs = len(convs_result.data or [])

    new_today = sum(1 for l in all_leads if l["created_at"][:10] == today)
    bookings_today = sum(1 for b in all_bookings if b["date"] == today)

    biz = _get_active_business()
    biz_id = biz.get("id") if biz else None

    return AnalyticsSummary(
        business_id=biz_id,
        total_leads=len(all_leads),
        new_leads_today=new_today,
        bookings_today=bookings_today,
        total_bookings=len(all_bookings),
        active_conversations=total_convs,
        web_chat_leads=sum(1 for l in all_leads if l["source"] == "web_chat"),
        whatsapp_leads=sum(1 for l in all_leads if l["source"] == "whatsapp"),
        missed_call_leads=sum(1 for l in all_leads if l["source"] == "missed_call"),
        confirmed_bookings=sum(1 for b in all_bookings if b["status"] == "confirmed"),
        pending_bookings=sum(1 for b in all_bookings if b["status"] == "pending"),
    )


@router.get("/detailed", response_model=AnalyticsDetailed)
async def get_detailed():
    db = get_supabase()

    leads = db.table("leads").select("status, inquiry_type, source").execute().data or []
    bookings = db.table("bookings").select("id").execute().data or []
    messages = db.table("messages").select("role, content, created_at").execute().data or []
    conversations = db.table("conversations").select("id").execute().data or []

    total_customers = len(leads)
    total_bookings = len(bookings)
    total_convs = len(conversations)
    messages_handled = sum(1 for m in messages if m["role"] == "assistant")

    # Conversion rate: leads that became bookings (converted status)
    converted = sum(1 for l in leads if l["status"] == "converted")
    conversion_rate = round(converted / total_customers * 100, 1) if total_customers else 0.0

    # Inquiries → bookings
    inq_rate = round(total_bookings / total_customers * 100, 1) if total_customers else 0.0

    # Chats → purchases (bookings / conversations)
    chat_rate = round(total_bookings / total_convs * 100, 1) if total_convs else 0.0

    # Peak hours: user messages grouped by hour
    hour_counts: Counter = Counter()
    for m in messages:
        if m["role"] == "user" and m.get("created_at"):
            try:
                hour = int(m["created_at"][11:13])
                hour_counts[hour] += 1
            except (ValueError, IndexError):
                pass
    peak_hours = [PeakHour(hour=h, count=hour_counts.get(h, 0)) for h in range(24)]

    # Top queries from inquiry_type
    query_counts: Counter = Counter(
        l["inquiry_type"] for l in leads if l.get("inquiry_type")
    )
    top_queries = [QueryType(type=t, count=c) for t, c in query_counts.most_common(5)]

    # Frequent questions: unique user messages containing "?" from all channels,
    # ordered by recency — these are real questions customers asked via chat/WhatsApp/Instagram
    QUESTION_WORDS = ("what", "when", "how", "do you", "can you", "is there", "are you", "where", "why", "which")
    seen_questions: set = set()
    frequent_questions: list[str] = []
    for m in sorted(messages, key=lambda x: x.get("created_at") or "", reverse=True):
        if m.get("role") != "user":
            continue
        content = (m.get("content") or "").strip()
        if len(content) < 10 or len(content) > 300:
            continue
        cl = content.lower()
        is_question = "?" in content or any(cl.startswith(w) for w in QUESTION_WORDS)
        if not is_question:
            continue
        key = cl.rstrip("?").strip()
        if key in seen_questions:
            continue
        seen_questions.add(key)
        frequent_questions.append(content)
        if len(frequent_questions) >= 8:
            break

    # Sentiment proxy from lead status
    sentiment = SentimentBreakdown(
        positive=sum(1 for l in leads if l["status"] == "converted"),
        neutral=sum(1 for l in leads if l["status"] in ("new", "contacted")),
        negative=sum(1 for l in leads if l["status"] == "lost"),
    )

    # AI suggestions
    suggestions: list[str] = []

    if hour_counts:
        peak_hour = max(hour_counts, key=hour_counts.get)
        if 17 <= peak_hour <= 21:
            suggestions.append(
                f"Peak queries at {peak_hour}:00–{peak_hour + 2}:00 — consider extending your hours or ensuring staff availability during this window"
            )
        elif 8 <= peak_hour <= 11:
            suggestions.append(
                f"Peak queries in the morning ({peak_hour}:00) — make sure your team is available early in the day"
            )
        else:
            suggestions.append(
                f"Highest traffic is at {peak_hour}:00 — ensure your AI assistant or team is responsive then"
            )

    if total_customers >= 5:
        if conversion_rate < 20:
            suggestions.append(
                "Conversion rate is below 20% — review your booking flow, pricing, or availability to reduce drop-offs"
            )
        elif conversion_rate >= 50:
            suggestions.append(
                "Strong conversion rate! Your AI assistant is effectively turning inquiries into bookings"
            )

    missed_call_leads = sum(1 for l in leads if l.get("source") == "missed_call")
    if missed_call_leads > 0:
        suggestions.append(
            f"{missed_call_leads} lead(s) came from missed calls — follow up with them promptly to recover potential customers"
        )

    if top_queries and top_queries[0].type in ("faq", "general"):
        suggestions.append(
            "Many inquiries are general questions — add more custom FAQs to your dashboard to improve AI response speed"
        )

    if not suggestions:
        suggestions.append(
            "Looking good! Keep monitoring your analytics as more conversations come in"
        )

    return AnalyticsDetailed(
        total_customers=total_customers,
        messages_handled=messages_handled,
        conversion_rate=conversion_rate,
        inquiries_to_bookings=ConversionStats(inquiries=total_customers, bookings=total_bookings, rate=inq_rate),
        chats_to_purchases=ConversionStats(inquiries=total_convs, bookings=total_bookings, rate=chat_rate),
        peak_hours=peak_hours,
        top_queries=top_queries,
        frequent_questions=frequent_questions,
        ai_suggestions=suggestions,
        sentiment=sentiment,
    )
