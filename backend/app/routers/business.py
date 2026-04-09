from fastapi import APIRouter
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/api/business", tags=["business"])


@router.get("/profile")
async def get_business_profile():
    """
    Returns the active business profile for the customer-facing page.
    Fetches the most recently created business (single-tenant demo).
    """
    db = get_supabase()
    result = (
        db.table("businesses")
        .select("name, type, location, phone, email, description")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    return result.data[0]
