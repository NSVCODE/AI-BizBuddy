"""
WhatsApp simulation router.
Simulates incoming WhatsApp messages and missed call auto-follow-ups.
"""

import uuid
from fastapi import APIRouter
from app.models.schemas import WhatsAppMessage, MissedCallRequest, ChatResponse
from app.services.ai_service import process_message, _get_active_business
from app.services.lead_service import get_or_create_lead_for_missed_call
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

# In-memory store for simulated WhatsApp conversations (keyed by phone)
_wa_sessions: dict[str, str] = {}


def _get_session(phone: str) -> str:
    if phone not in _wa_sessions:
        _wa_sessions[phone] = f"wa_{phone.replace('+', '').replace(' ', '')}_{uuid.uuid4().hex[:8]}"
    return _wa_sessions[phone]


def _get_returning_customer_context(phone: str) -> str | None:
    """
    If this phone number belongs to a known lead with a name,
    return a system context string so the AI greets them by name.
    """
    try:
        db = get_supabase()
        lead_res = db.table("leads").select("name, inquiry_type").eq("phone", phone).limit(1).execute()
        if not lead_res.data:
            return None
        lead = lead_res.data[0]
        name = lead.get("name")
        if not name:
            return None

        # Check for past bookings
        bk_res = (
            db.table("bookings")
            .select("date, time, party_size, status")
            .eq("phone", phone)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        booking_note = ""
        if bk_res.data:
            b = bk_res.data[0]
            booking_note = (
                f" Their most recent booking was for {b['party_size']} guests "
                f"on {b['date']} at {b['time']} (status: {b['status']})."
            )

        return (
            f"[RETURNING CUSTOMER: This person's name is {name}. "
            f"They have contacted us before.{booking_note} "
            f"Greet them warmly by name at the start of your reply, "
            f"e.g. 'Welcome back, {name}!' — then help them as usual.]"
        )
    except Exception:
        return None


@router.post("/simulate", response_model=ChatResponse)
async def simulate_whatsapp_message(msg: WhatsAppMessage):
    """
    Simulate an incoming WhatsApp message.
    Returns AI response as if it came through WhatsApp Business API.
    """
    is_new_session = msg.phone not in _wa_sessions
    session_id = msg.session_id or _get_session(msg.phone)
    message = msg.message
    if is_new_session:
        ctx = _get_returning_customer_context(msg.phone)
        if ctx:
            message = f"{ctx}\n\n{msg.message}"
    reply = process_message(session_id, message, channel="whatsapp", business_id="static")
    return ChatResponse(session_id=session_id, reply=reply, channel="whatsapp")


@router.post("/missed-call")
async def handle_missed_call(req: MissedCallRequest):
    """
    Simulate a missed call — creates a lead and returns the automated follow-up WhatsApp message.
    """
    # Create a lead for this missed call
    lead = get_or_create_lead_for_missed_call(req.phone, req.caller_name)

    # Generate automated follow-up message via AI
    session_id = _get_session(req.phone)
    greeting_name = req.caller_name or "there"
    biz = _get_active_business()
    biz_name = biz.get("name", "us") if biz else "us"
    trigger_message = (
        f"[SYSTEM: This customer just called {biz_name} but the call was missed. "
        f"Their name is {greeting_name}. Send them a warm, friendly WhatsApp follow-up message "
        f"acknowledging the missed call, apologising briefly, and offering to help them with "
        f"anything. Keep it short and friendly.]"
    )
    reply = process_message(session_id, trigger_message, channel="whatsapp", business_id="static")

    return {
        "lead_id": lead.get("id"),
        "phone": req.phone,
        "follow_up_message": reply,
        "session_id": session_id,
    }


@router.post("/incoming")
async def incoming_whatsapp_message(msg: WhatsAppMessage):
    """
    Receives a real incoming WhatsApp message from the whatsapp-service Node.js bridge.
    Processes it with Claude and returns the reply.
    """
    is_new_session = msg.phone not in _wa_sessions
    session_id = msg.session_id or _get_session(msg.phone)
    message = msg.message
    if is_new_session:
        ctx = _get_returning_customer_context(msg.phone)
        if ctx:
            message = f"{ctx}\n\n{msg.message}"
    reply = process_message(session_id, message, channel="whatsapp", business_id="static")
    return ChatResponse(session_id=session_id, reply=reply, channel="whatsapp")


@router.get("/sessions")
async def list_wa_sessions():
    """List active WhatsApp simulation sessions."""
    return {"sessions": list(_wa_sessions.keys())}
