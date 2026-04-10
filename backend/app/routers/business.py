from fastapi import APIRouter
from app.db.supabase_client import get_supabase
from datetime import date, timedelta

router = APIRouter(prefix="/api/business", tags=["business"])


@router.get("/debug")
async def debug_businesses():
    """Temporary debug: see what's in the businesses table."""
    try:
        db = get_supabase()
        result = db.table("businesses").select("id, name, type, created_at").order("created_at", desc=True).execute()
        return {"count": len(result.data or []), "rows": result.data}
    except Exception as e:
        return {"error": str(e)}


@router.get("/profile")
async def get_business_profile(id: str | None = None, user_id: str | None = None):
    """
    Returns the active business profile for the customer-facing page.
    Priority: ?id= > ?user_id= > most recently created.
    """
    db = get_supabase()
    query = db.table("businesses").select("id, name, type, location, phone, email, description")

    if id:
        query = query.eq("id", id)
    elif user_id:
        query = query.eq("user_id", user_id)
    else:
        query = query.order("created_at", desc=True).limit(1)

    result = query.execute()
    if not result.data:
        return None
    return result.data[0]


# ── Demo seed data by business type ──────────────────────────────────────────

_DEMO_LEADS = {
    "restaurant": [
        {"name": "Priya Sharma",  "phone": "9876511101", "source": "web_chat",    "status": "new",       "inquiry_type": "reservation", "notes": "Interested in weekend brunch for 4"},
        {"name": "Arjun Mehta",   "phone": "9876511102", "source": "whatsapp",    "status": "contacted", "inquiry_type": "faq",         "notes": "Asked about vegan options"},
        {"name": "Sneha Nair",    "phone": "9876511103", "source": "web_chat",    "status": "converted", "inquiry_type": "event",       "notes": "Booked for birthday dinner"},
        {"name": "Rohit Verma",   "phone": "9876511104", "source": "missed_call", "status": "new",       "inquiry_type": "call back",   "notes": "Missed call — follow-up sent"},
        {"name": "Kavitha Reddy", "phone": "9876511105", "source": "web_chat",    "status": "new",       "inquiry_type": "event",       "notes": "Enquired about private dining space"},
    ],
    "salon": [
        {"name": "Ananya Rao",    "phone": "9876522101", "source": "web_chat",    "status": "new",       "inquiry_type": "hair spa",        "notes": "Wants a hair spa and trim"},
        {"name": "Meera Pillai",  "phone": "9876522102", "source": "whatsapp",    "status": "converted", "inquiry_type": "keratin treatment","notes": "Booked keratin treatment"},
        {"name": "Divya Menon",   "phone": "9876522103", "source": "whatsapp",    "status": "contacted", "inquiry_type": "balayage",         "notes": "Asked about balayage pricing"},
        {"name": "Sana Sheikh",   "phone": "9876522104", "source": "missed_call", "status": "new",       "inquiry_type": "call back",        "notes": "Missed call — follow-up sent"},
        {"name": "Lakshmi Iyer",  "phone": "9876522105", "source": "web_chat",    "status": "new",       "inquiry_type": "bridal package",   "notes": "Looking for a bridal package"},
    ],
    "clinic": [
        {"name": "Rajan Patel",   "phone": "9876533101", "source": "web_chat",    "status": "new",       "inquiry_type": "general checkup",    "notes": "General checkup enquiry"},
        {"name": "Suma Rao",      "phone": "9876533102", "source": "whatsapp",    "status": "converted", "inquiry_type": "dermatology",         "notes": "Booked dermatology consultation"},
        {"name": "Kiran Shetty",  "phone": "9876533103", "source": "web_chat",    "status": "contacted", "inquiry_type": "lab tests",           "notes": "Asked about lab tests"},
        {"name": "Pooja Nambiar", "phone": "9876533104", "source": "missed_call", "status": "new",       "inquiry_type": "call back",           "notes": "Missed call — follow-up sent"},
    ],
    "retail": [
        {"name": "Vishal Kumar",  "phone": "9876544101", "source": "web_chat",    "status": "new",       "inquiry_type": "stock enquiry",       "notes": "Asked about stock availability"},
        {"name": "Nithya Suresh", "phone": "9876544102", "source": "whatsapp",    "status": "converted", "inquiry_type": "order",               "notes": "Placed an order for 3 items"},
        {"name": "Arun Babu",     "phone": "9876544103", "source": "whatsapp",    "status": "contacted", "inquiry_type": "returns policy",      "notes": "Asked about return policy"},
        {"name": "Geetha Pillai", "phone": "9876544104", "source": "missed_call", "status": "new",       "inquiry_type": "call back",           "notes": "Missed call — follow-up sent"},
        {"name": "Rahul Nair",    "phone": "9876544105", "source": "web_chat",    "status": "new",       "inquiry_type": "custom order",        "notes": "Looking for custom orders"},
    ],
    "service": [
        {"name": "Deepak Reddy",  "phone": "9876555101", "source": "web_chat",    "status": "new",       "inquiry_type": "AC repair",           "notes": "AC repair request"},
        {"name": "Sunita Rao",    "phone": "9876555102", "source": "whatsapp",    "status": "converted", "inquiry_type": "plumbing",            "notes": "Plumbing service booked"},
        {"name": "Ramesh Babu",   "phone": "9876555103", "source": "web_chat",    "status": "contacted", "inquiry_type": "pricing enquiry",     "notes": "Asked about service charges"},
        {"name": "Lalitha Menon", "phone": "9876555104", "source": "missed_call", "status": "new",       "inquiry_type": "call back",           "notes": "Missed call — follow-up sent"},
    ],
}

_DEMO_BOOKINGS = {
    "restaurant": [
        {"customer_name": "Sneha Nair",    "phone": "9876511103", "time": "18:00", "party_size": 4, "status": "confirmed", "special_requests": "Birthday — please arrange a candle", "days_offset": 1},
        {"customer_name": "Priya Sharma",  "phone": "9876511101", "time": "12:00", "party_size": 2, "status": "pending",   "special_requests": "Window seat preferred",               "days_offset": 2},
        {"customer_name": "Vikram Singh",  "phone": "9876511106", "time": "19:30", "party_size": 6, "status": "confirmed", "special_requests": "Vegan menu needed",                   "days_offset": 0},
    ],
    "salon": [
        {"customer_name": "Meera Pillai",  "phone": "9876522102", "time": "10:00", "party_size": 1, "status": "confirmed", "special_requests": "Keratin treatment + blowout",         "days_offset": 1},
        {"customer_name": "Ananya Rao",    "phone": "9876522101", "time": "14:00", "party_size": 1, "status": "pending",   "special_requests": "Hair spa and trim",                   "days_offset": 2},
        {"customer_name": "Divya Menon",   "phone": "9876522103", "time": "11:30", "party_size": 1, "status": "confirmed", "special_requests": "Balayage highlights",                 "days_offset": 3},
    ],
    "clinic": [
        {"customer_name": "Suma Rao",      "phone": "9876533102", "time": "09:00", "party_size": 1, "status": "confirmed", "special_requests": "Dermatology consultation",            "days_offset": 1},
        {"customer_name": "Kiran Shetty",  "phone": "9876533103", "time": "11:00", "party_size": 1, "status": "pending",   "special_requests": "General checkup",                    "days_offset": 2},
    ],
    "retail": [
        {"customer_name": "Nithya Suresh", "phone": "9876544102", "time": "11:00", "party_size": 1, "status": "confirmed", "special_requests": "Personal shopping session",           "days_offset": 1},
        {"customer_name": "Rahul Nair",    "phone": "9876544105", "time": "15:00", "party_size": 1, "status": "pending",   "special_requests": "Custom order consultation",           "days_offset": 3},
    ],
    "service": [
        {"customer_name": "Sunita Rao",    "phone": "9876555102", "time": "10:00", "party_size": 1, "status": "confirmed", "special_requests": "Plumbing — kitchen sink leak",        "days_offset": 0},
        {"customer_name": "Deepak Reddy",  "phone": "9876555101", "time": "14:00", "party_size": 1, "status": "pending",   "special_requests": "AC not cooling",                     "days_offset": 1},
    ],
}


@router.post("/seed-demo")
async def seed_demo_data(payload: dict):
    """
    Seed type-appropriate demo leads and bookings for a newly created business.
    Called once from the onboarding flow. Pass force=true to re-seed.
    """
    business_id = payload.get("business_id")
    biz_type = payload.get("type", "other")
    force = payload.get("force", False)
    if not business_id:
        return {"status": "skipped", "reason": "no business_id"}

    db = get_supabase()

    # Skip if data already exists (unless forced)
    if not force:
        existing = db.table("leads").select("id").eq("business_id", business_id).limit(1).execute()
        if existing.data:
            return {"status": "skipped", "reason": "already seeded"}

    # Force: wipe existing demo data for this business first
    if force:
        db.table("bookings").delete().eq("business_id", business_id).execute()
        db.table("leads").delete().eq("business_id", business_id).execute()

    leads_data = _DEMO_LEADS.get(biz_type, _DEMO_LEADS["restaurant"])
    bookings_data = _DEMO_BOOKINGS.get(biz_type, _DEMO_BOOKINGS["restaurant"])

    # Insert leads
    lead_records = [{**l, "business_id": business_id} for l in leads_data]
    db.table("leads").insert(lead_records).execute()

    # Insert bookings
    today = date.today()
    booking_records = [
        {
            "customer_name": b["customer_name"],
            "phone": b["phone"],
            "date": (today + timedelta(days=b["days_offset"])).isoformat(),
            "time": b["time"],
            "party_size": b["party_size"],
            "status": b["status"],
            "special_requests": b.get("special_requests"),
            "business_id": business_id,
        }
        for b in bookings_data
    ]
    db.table("bookings").insert(booking_records).execute()

    return {"status": "seeded", "leads": len(lead_records), "bookings": len(booking_records)}
