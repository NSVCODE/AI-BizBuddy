from fastapi import APIRouter, HTTPException
from app.models.schemas import BookingCreate, BookingUpdate, BookingOut
from app.db.supabase_client import get_supabase
from app.services.booking_service import create_booking

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.get("", response_model=list[BookingOut])
async def list_bookings(business_id: str | None = None):
    db = get_supabase()
    query = db.table("bookings").select("*").order("date").order("time")
    if business_id:
        query = query.eq("business_id", business_id)
    result = query.execute()
    return result.data or []


@router.post("", response_model=BookingOut)
async def new_booking(booking: BookingCreate):
    result = create_booking(
        customer_name=booking.customer_name,
        phone=booking.phone,
        booking_date=booking.date,
        booking_time=booking.time,
        party_size=booking.party_size,
        special_requests=booking.special_requests,
        lead_id=booking.lead_id,
    )
    return result["booking"]


@router.patch("/{booking_id}/status", response_model=BookingOut)
async def update_booking_status(booking_id: str, update: BookingUpdate):
    db = get_supabase()
    data = update.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = db.table("bookings").update(data).eq("id", booking_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Booking not found")
    return result.data[0]


@router.delete("/{booking_id}")
async def cancel_booking(booking_id: str):
    db = get_supabase()
    db.table("bookings").update({"status": "cancelled"}).eq("id", booking_id).execute()
    return {"status": "cancelled"}
