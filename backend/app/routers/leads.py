from fastapi import APIRouter, HTTPException
from app.models.schemas import LeadCreate, LeadUpdate, LeadOut
from app.db.supabase_client import get_supabase
from app.services.lead_service import capture_lead

router = APIRouter(prefix="/api/leads", tags=["leads"])


@router.get("", response_model=list[LeadOut])
async def list_leads(business_id: str | None = None):
    db = get_supabase()
    query = db.table("leads").select("*").order("created_at", desc=True)
    if business_id:
        query = query.eq("business_id", business_id)
    result = query.execute()
    return result.data or []


@router.post("", response_model=LeadOut)
async def create_lead(lead: LeadCreate):
    result = capture_lead(
        name=lead.name,
        phone=lead.phone,
        email=lead.email,
        source=lead.source,
        inquiry_type=lead.inquiry_type,
        notes=lead.notes,
    )
    return result


@router.patch("/{lead_id}", response_model=LeadOut)
async def update_lead(lead_id: str, update: LeadUpdate):
    db = get_supabase()
    data = update.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = db.table("leads").update(data).eq("id", lead_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    return result.data[0]


@router.delete("/{lead_id}")
async def delete_lead(lead_id: str):
    db = get_supabase()
    db.table("leads").delete().eq("id", lead_id).execute()
    return {"status": "deleted"}
