"""
AI Service — Claude-powered conversation engine for LatteLune.
Handles multi-turn conversations with tool calling for bookings and lead capture.
"""

import os
import json
from typing import Optional
import anthropic
from dotenv import load_dotenv

from app.config.restaurant import RESTAURANT_CONFIG
from app.db.supabase_client import get_supabase
from app.services.booking_service import check_availability, create_booking, get_upcoming_slots
from app.services.lead_service import capture_lead

load_dotenv()

_anthropic_client: anthropic.Anthropic | None = None


def get_anthropic_client() -> anthropic.Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY must be set in .env")
        _anthropic_client = anthropic.Anthropic(api_key=api_key)
    return _anthropic_client


# ── System Prompt ─────────────────────────────────────────────────────────────

def _get_active_business() -> dict | None:
    """Fetch the most recently registered business from Supabase."""
    try:
        db = get_supabase()
        result = db.table("businesses").select("*").order("created_at", desc=True).limit(1).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        import sys
        print(f"[BizBuddy] WARNING: _get_active_business() failed: {e}", file=sys.stderr)
        return None


def _get_custom_faqs(business_id: str | None) -> list[dict]:
    """Fetch custom FAQs from Supabase."""
    if not business_id:
        return []
    try:
        db = get_supabase()
        result = (
            db.table("faqs")
            .select("question, answer")
            .eq("business_id", business_id)
            .eq("is_active", True)
            .execute()
        )
        return result.data or []
    except Exception:
        return []


TYPE_PERSONAS = {
    "restaurant": "You are a warm, friendly AI assistant for {name}, a restaurant/café. Help customers with table reservations, menu questions, opening hours, and general inquiries. Keep responses concise and welcoming.",
    "salon": "You are a friendly AI assistant for {name}, a salon/spa. Help customers book appointments, learn about services, check availability, and get pricing info. Be warm, professional, and helpful.",
    "clinic": "You are a professional AI assistant for {name}, a healthcare clinic. Help patients book consultations, learn about services, and get general information. Be empathetic, clear, and professional.",
    "retail": "You are a helpful AI assistant for {name}, a retail store. Help customers find products, get pricing, place enquiries, and learn about the store. Be friendly and informative.",
    "service": "You are a helpful AI assistant for {name}, a service provider. Help customers book services, get quotes, and learn about available services. Be professional and efficient.",
    "other": "You are a helpful AI assistant for {name}. Help customers with enquiries, bookings, and any information they need. Be friendly and professional.",
}


def build_system_prompt() -> str:
    cfg = RESTAURANT_CONFIG
    business = _get_active_business()

    # Use real business data if available, else fall back to LatteLune config
    biz_name = business.get("name", cfg["name"]) if business else cfg["name"]
    biz_type = business.get("type", "restaurant") if business else "restaurant"
    biz_location = business.get("location", cfg["location"]) if business else cfg["location"]
    biz_phone = business.get("phone", cfg["phone"]) if business else cfg["phone"]
    biz_email = business.get("email", cfg.get("email", "")) if business else cfg.get("email", "")
    biz_desc = business.get("description", cfg["description"]) if business else cfg["description"]
    biz_id = business.get("id") if business else None

    persona_template = TYPE_PERSONAS.get(biz_type, TYPE_PERSONAS["other"])
    persona_text = persona_template.format(name=biz_name)

    # Custom FAQs from DB
    custom_faqs = _get_custom_faqs(biz_id)

    # For restaurants, include menu; for others use description only
    extra_info = ""
    if biz_type == "restaurant":
        menu_text = ""
        for category, items in cfg["menu"].items():
            menu_text += f"\n**{category}:**\n"
            for item in items:
                menu_text += f"  - {item['name']} — ₹{item['price']}: {item['description']}\n"
        hours_text = "\n".join(f"  {day}: {hrs}" for day, hrs in cfg["hours"].items())
        extra_info = f"\n## Menu\n{menu_text}\n\n## Opening Hours\n{hours_text}"

    # FAQs (custom from DB first, then static for restaurant fallback)
    faq_list = custom_faqs if custom_faqs else (cfg["faqs"] if biz_type == "restaurant" else [])
    faq_text = "\n".join(f"  Q: {f['question']}\n  A: {f['answer']}" for f in faq_list)

    return f"""
{persona_text}

## About {biz_name}
{biz_desc}
📍 {biz_location}
📞 {biz_phone}{f' | 📧 {biz_email}' if biz_email else ''}
{extra_info}
{"## FAQs" + chr(10) + faq_text if faq_text else ""}

## Booking / Appointment Policy
- Collect: customer name, phone number, preferred date, preferred time, and number of guests/people
- Ask for ALL details in ONE message — do not ask one by one
- Use check_availability then create_booking once you have all details
- Confirm with a clear summary

## How to handle conversations
1. Answer general questions using the information above.
2. For bookings/appointments: ask for ALL details in a single message, then book.
3. For lead capture: use capture_lead once you have name + phone.
4. Keep responses warm, concise, and friendly.
""".strip()


# ── Tool Definitions ──────────────────────────────────────────────────────────

TOOLS = [
    {
        "name": "check_availability",
        "description": "Check if a table is available at LatteLune for a given date, time, and party size.",
        "input_schema": {
            "type": "object",
            "properties": {
                "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
                "time": {"type": "string", "description": "Time in HH:MM format (24-hour), e.g. '18:00'"},
                "party_size": {"type": "integer", "description": "Number of guests"},
            },
            "required": ["date", "time", "party_size"],
        },
    },
    {
        "name": "create_booking",
        "description": "Create a confirmed table booking at LatteLune. Call this after confirming availability and collecting all required details.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_name": {"type": "string", "description": "Full name of the customer"},
                "phone": {"type": "string", "description": "Customer's phone number"},
                "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
                "time": {"type": "string", "description": "Time in HH:MM format"},
                "party_size": {"type": "integer", "description": "Number of guests"},
                "special_requests": {"type": "string", "description": "Any special requests or notes (optional)"},
            },
            "required": ["customer_name", "phone", "date", "time", "party_size"],
        },
    },
    {
        "name": "capture_lead",
        "description": "Save customer contact details as a lead. Use for catering inquiries, event bookings, general interest, or when a customer shares their contact info.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Customer's name"},
                "phone": {"type": "string", "description": "Customer's phone number"},
                "email": {"type": "string", "description": "Customer's email (optional)"},
                "inquiry_type": {"type": "string", "description": "Type of inquiry: 'reservation', 'event', 'catering', 'faq', 'general'"},
                "notes": {"type": "string", "description": "Brief notes about the customer's inquiry"},
            },
            "required": ["phone"],
        },
    },
    {
        "name": "get_available_slots",
        "description": "Get all available time slots for a specific date at LatteLune.",
        "input_schema": {
            "type": "object",
            "properties": {
                "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
            },
            "required": ["date"],
        },
    },
    {
        "name": "get_menu",
        "description": "Get the LatteLune menu, optionally filtered by category.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Optional category filter: 'Coffee & Espresso', 'Non-Coffee Drinks', 'Food', 'Cakes & Desserts'",
                },
            },
        },
    },
]


# ── Tool Execution ────────────────────────────────────────────────────────────

def execute_tool(tool_name: str, tool_input: dict, channel: str = "web_chat") -> str:
    try:
        if tool_name == "check_availability":
            result = check_availability(
                tool_input["date"], tool_input["time"], tool_input["party_size"]
            )
            return json.dumps(result)

        elif tool_name == "create_booking":
            result = create_booking(
                customer_name=tool_input["customer_name"],
                phone=tool_input["phone"],
                booking_date=tool_input["date"],
                booking_time=tool_input["time"],
                party_size=tool_input["party_size"],
                special_requests=tool_input.get("special_requests"),
            )
            # Also capture as a lead
            capture_lead(
                name=tool_input["customer_name"],
                phone=tool_input["phone"],
                source=channel,
                inquiry_type="reservation",
                notes=f"Booked table for {tool_input['party_size']} on {tool_input['date']} at {tool_input['time']}",
            )
            return json.dumps({"confirmation": result["confirmation_message"], "booking_id": result["booking"].get("id")})

        elif tool_name == "capture_lead":
            result = capture_lead(
                name=tool_input.get("name"),
                phone=tool_input.get("phone"),
                email=tool_input.get("email"),
                source=channel,
                inquiry_type=tool_input.get("inquiry_type"),
                notes=tool_input.get("notes"),
            )
            return json.dumps({"status": "saved", "lead_id": result.get("id")})

        elif tool_name == "get_available_slots":
            slots = get_upcoming_slots(tool_input["date"])
            return json.dumps({"date": tool_input["date"], "available_slots": slots})

        elif tool_name == "get_menu":
            menu = RESTAURANT_CONFIG["menu"]
            category = tool_input.get("category")
            if category and category in menu:
                return json.dumps({category: menu[category]})
            return json.dumps(menu)

        else:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})

    except Exception as e:
        return json.dumps({"error": str(e)})


# ── Conversation History ───────────────────────────────────────────────────────

def get_or_create_conversation(session_id: str, channel: str) -> str:
    """Return conversation ID for session, creating if needed."""
    db = get_supabase()
    result = (
        db.table("conversations")
        .select("id")
        .eq("session_id", session_id)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]["id"]

    insert = db.table("conversations").insert({"channel": channel, "session_id": session_id}).execute()
    return insert.data[0]["id"]


def load_message_history(conversation_id: str) -> list[dict]:
    """Load past messages for a conversation (last 20 turns)."""
    db = get_supabase()
    result = (
        db.table("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .limit(40)
        .execute()
    )
    return result.data or []


def save_messages(conversation_id: str, messages: list[dict]) -> None:
    """Persist a batch of new messages."""
    db = get_supabase()
    records = [
        {"conversation_id": conversation_id, "role": m["role"], "content": m["content"]}
        for m in messages
    ]
    if records:
        db.table("messages").insert(records).execute()


# ── Main Entry Point ──────────────────────────────────────────────────────────

def process_message(session_id: str, user_message: str, channel: str = "web_chat") -> str:
    """
    Process a user message and return the AI's response.
    Handles multi-turn history and Claude tool calling.
    """
    client = get_anthropic_client()
    conversation_id = get_or_create_conversation(session_id, channel)
    history = load_message_history(conversation_id)

    # Build messages list for Claude
    messages = list(history)  # copy
    messages.append({"role": "user", "content": user_message})

    new_messages = [{"role": "user", "content": user_message}]
    final_reply = ""

    # Agentic loop — keep going while Claude wants to use tools
    while True:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=build_system_prompt(),
            tools=TOOLS,
            messages=messages,
        )

        # Collect text and tool use blocks
        assistant_content = response.content
        text_parts = [b.text for b in assistant_content if b.type == "text"]
        tool_use_blocks = [b for b in assistant_content if b.type == "tool_use"]

        # Append assistant turn
        messages.append({"role": "assistant", "content": assistant_content})

        if response.stop_reason == "end_turn" or not tool_use_blocks:
            final_reply = " ".join(text_parts) if text_parts else "I'm here to help! Is there anything else you'd like to know about LatteLune?"
            # Save assistant message
            new_messages.append({"role": "assistant", "content": final_reply})
            break

        # Execute tools and collect results
        tool_results = []
        for tool_block in tool_use_blocks:
            tool_result = execute_tool(tool_block.name, tool_block.input, channel)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_block.id,
                "content": tool_result,
            })

        # Add tool results as a user turn
        messages.append({"role": "user", "content": tool_results})

    # Persist new messages to DB
    save_messages(conversation_id, new_messages)
    return final_reply
