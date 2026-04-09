"""
WhatsApp simulation router.
Simulates incoming WhatsApp messages and missed call auto-follow-ups.
"""

import uuid
from fastapi import APIRouter
from app.models.schemas import WhatsAppMessage, MissedCallRequest, ChatResponse
from app.services.ai_service import process_message
from app.services.lead_service import get_or_create_lead_for_missed_call

router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

# In-memory store for simulated WhatsApp conversations (keyed by phone)
_wa_sessions: dict[str, str] = {}


def _get_session(phone: str) -> str:
    if phone not in _wa_sessions:
        _wa_sessions[phone] = f"wa_{phone.replace('+', '').replace(' ', '')}_{uuid.uuid4().hex[:8]}"
    return _wa_sessions[phone]


@router.post("/simulate", response_model=ChatResponse)
async def simulate_whatsapp_message(msg: WhatsAppMessage):
    """
    Simulate an incoming WhatsApp message.
    Returns AI response as if it came through WhatsApp Business API.
    """
    session_id = msg.session_id or _get_session(msg.phone)
    reply = process_message(session_id, msg.message, channel="whatsapp")
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
    trigger_message = (
        f"[SYSTEM: This customer just called LatteLune but the call was missed. "
        f"Their name is {greeting_name}. Send them a warm, friendly WhatsApp follow-up message "
        f"acknowledging the missed call, apologising briefly, and offering to help them with "
        f"anything — like a reservation, menu info, or any question they have. Keep it short and friendly.]"
    )
    reply = process_message(session_id, trigger_message, channel="whatsapp")

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
    session_id = msg.session_id or _get_session(msg.phone)
    reply = process_message(session_id, msg.message, channel="whatsapp")
    return ChatResponse(session_id=session_id, reply=reply, channel="whatsapp")


@router.get("/sessions")
async def list_wa_sessions():
    """List active WhatsApp simulation sessions."""
    return {"sessions": list(_wa_sessions.keys())}
