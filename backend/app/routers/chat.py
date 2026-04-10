from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse, ConversationOut, MessageOut
from app.services.ai_service import process_message
from app.db.supabase_client import get_supabase
from datetime import datetime

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a message and get an AI response."""
    try:
        reply = process_message(req.session_id, req.message, req.channel, req.business_id)
        return ChatResponse(session_id=req.session_id, reply=reply, channel=req.channel)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations():
    """List all conversations with their last message."""
    db = get_supabase()
    convs = db.table("conversations").select("*").order("created_at", desc=True).limit(50).execute()

    result = []
    for conv in (convs.data or []):
        # Get last message
        last = (
            db.table("messages")
            .select("content")
            .eq("conversation_id", conv["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        last_msg = last.data[0]["content"] if last.data else None
        result.append(ConversationOut(
            id=conv["id"],
            channel=conv["channel"],
            session_id=conv["session_id"],
            created_at=conv["created_at"],
            last_message=last_msg,
        ))
    return result


@router.get("/conversations/{session_id}/messages", response_model=list[MessageOut])
async def get_messages(session_id: str):
    """Get all messages for a conversation."""
    db = get_supabase()
    conv = (
        db.table("conversations")
        .select("id")
        .eq("session_id", session_id)
        .limit(1)
        .execute()
    )
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = (
        db.table("messages")
        .select("*")
        .eq("conversation_id", conv.data[0]["id"])
        .order("created_at")
        .execute()
    )
    return [MessageOut(**m) for m in (msgs.data or [])]
