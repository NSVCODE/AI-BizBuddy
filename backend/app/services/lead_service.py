"""
Lead service — capture and manage customer leads.
"""

from typing import Optional
from app.db.supabase_client import get_supabase


def capture_lead(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    source: str = "web_chat",
    inquiry_type: Optional[str] = None,
    notes: Optional[str] = None,
    status: str = "new",
) -> dict:
    """
    Upsert a lead. If same phone exists, update; otherwise insert.
    Returns the lead record.
    """
    db = get_supabase()

    record = {
        "name": name,
        "phone": phone,
        "email": email,
        "source": source,
        "status": status,
        "inquiry_type": inquiry_type,
        "notes": notes,
    }
    # Remove None values for cleaner upsert
    record = {k: v for k, v in record.items() if v is not None}

    # Check if phone already exists
    if phone:
        existing = (
            db.table("leads")
            .select("id")
            .eq("phone", phone)
            .limit(1)
            .execute()
        )
        if existing.data:
            lead_id = existing.data[0]["id"]
            update_data = {k: v for k, v in record.items() if k not in ("source",)}
            db.table("leads").update(update_data).eq("id", lead_id).execute()
            result = db.table("leads").select("*").eq("id", lead_id).execute()
            return result.data[0] if result.data else {"id": lead_id, **record}

    result = db.table("leads").insert(record).execute()
    return result.data[0] if result.data else record


def get_or_create_lead_for_missed_call(phone: str, caller_name: Optional[str] = None) -> dict:
    """Create or retrieve a lead for a missed call."""
    return capture_lead(
        name=caller_name,
        phone=phone,
        source="missed_call",
        inquiry_type="missed_call",
        notes="Missed call received — automated WhatsApp follow-up sent",
    )
