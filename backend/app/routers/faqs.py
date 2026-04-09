from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/api/faqs", tags=["faqs"])


class FAQCreate(BaseModel):
    question: str
    answer: str


class FAQUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None
    is_active: bool | None = None


def _get_business_id() -> str | None:
    """Get the most recently created business ID."""
    db = get_supabase()
    result = db.table("businesses").select("id").order("created_at", desc=True).limit(1).execute()
    return result.data[0]["id"] if result.data else None


@router.get("")
async def list_faqs():
    """List all FAQs for the active business."""
    business_id = _get_business_id()
    if not business_id:
        return []
    db = get_supabase()
    result = (
        db.table("faqs")
        .select("*")
        .eq("business_id", business_id)
        .order("created_at")
        .execute()
    )
    return result.data or []


@router.post("")
async def create_faq(body: FAQCreate):
    """Create a new FAQ entry."""
    business_id = _get_business_id()
    if not business_id:
        raise HTTPException(status_code=404, detail="No business found")
    db = get_supabase()
    result = db.table("faqs").insert({
        "business_id": business_id,
        "question": body.question,
        "answer": body.answer,
        "is_active": True,
    }).execute()
    return result.data[0]


@router.put("/{faq_id}")
async def update_faq(faq_id: str, body: FAQUpdate):
    """Update a FAQ entry."""
    db = get_supabase()
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = db.table("faqs").update(updates).eq("id", faq_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return result.data[0]


@router.delete("/{faq_id}")
async def delete_faq(faq_id: str):
    """Delete a FAQ entry."""
    db = get_supabase()
    db.table("faqs").delete().eq("id", faq_id).execute()
    return {"success": True}
