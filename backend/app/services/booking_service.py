"""
Booking service — availability checks and booking creation/retrieval.
"""

from datetime import date, datetime, timedelta
from typing import Optional
from app.db.supabase_client import get_supabase
from app.config.restaurant import RESTAURANT_CONFIG


def check_availability(booking_date: str, booking_time: str, party_size: int) -> dict:
    """
    Check if a slot is available.
    Returns dict with 'available' bool and 'message'.
    """
    cfg = RESTAURANT_CONFIG["booking_slots"]
    max_party = cfg["max_party_size"]

    if party_size > max_party:
        return {
            "available": False,
            "message": f"Sorry, we can accommodate a maximum of {max_party} guests per booking. For larger groups, please contact us directly.",
        }

    # Parse date
    try:
        parsed_date = datetime.strptime(booking_date, "%Y-%m-%d").date()
    except ValueError:
        return {"available": False, "message": "Invalid date format. Please use YYYY-MM-DD."}

    if parsed_date < date.today():
        return {"available": False, "message": "That date has already passed. Please choose a future date."}

    max_date = date.today() + timedelta(weeks=2)
    if parsed_date > max_date:
        return {
            "available": False,
            "message": f"Sorry, we only accept bookings up to 2 weeks in advance. The latest available date is {max_date.strftime('%A, %B %d')}.",
        }

    # Validate time is in allowed slots
    if booking_time not in cfg["slot_times"]:
        slots_str = ", ".join(cfg["slot_times"])
        return {
            "available": False,
            "message": f"That time slot isn't available. Our booking slots are: {slots_str}",
        }

    # Check existing bookings at that slot
    try:
        db = get_supabase()
        result = (
            db.table("bookings")
            .select("id, party_size, status")
            .eq("date", booking_date)
            .eq("time", booking_time)
            .neq("status", "cancelled")
            .execute()
        )
        existing = result.data or []
        # Simple capacity: max 2 simultaneous bookings per slot
        if len(existing) >= 2:
            # Suggest nearby slots
            all_slots = cfg["slot_times"]
            idx = all_slots.index(booking_time)
            nearby = []
            if idx > 0:
                nearby.append(all_slots[idx - 1])
            if idx < len(all_slots) - 1:
                nearby.append(all_slots[idx + 1])
            nearby_str = " or ".join(nearby) if nearby else "another time"
            return {
                "available": False,
                "message": f"That slot is fully booked. You might try {nearby_str} on the same day.",
            }
    except Exception:
        # If DB check fails, still allow booking (graceful degradation)
        pass

    return {
        "available": True,
        "message": f"Great news! {booking_date} at {booking_time} is available for {party_size} guest(s).",
    }


def create_booking(
    customer_name: str,
    phone: str,
    booking_date: str,
    booking_time: str,
    party_size: int,
    special_requests: Optional[str] = None,
    lead_id: Optional[str] = None,
    business_id: Optional[str] = None,
    business_name: Optional[str] = None,
    business_location: Optional[str] = None,
) -> dict:
    """
    Create a booking in Supabase.
    Returns the created booking record.
    """
    db = get_supabase()

    record = {
        "customer_name": customer_name,
        "phone": phone,
        "date": booking_date,
        "time": booking_time,
        "party_size": party_size,
        "status": "confirmed",
        "special_requests": special_requests,
        "lead_id": lead_id,
    }
    if business_id:
        record["business_id"] = business_id

    result = db.table("bookings").insert(record).execute()
    booking = result.data[0] if result.data else record

    # Format confirmation message
    day_name = datetime.strptime(booking_date, "%Y-%m-%d").strftime("%A, %B %d")
    loc_line = f"📍 {business_name or RESTAURANT_CONFIG['name']}, {business_location or RESTAURANT_CONFIG['location']}\n"
    confirmation = (
        f"Booking confirmed! ✨\n"
        f"📅 {day_name} at {booking_time}\n"
        f"👥 {party_size} guest(s)\n"
        + loc_line
        + f"📞 {phone}\n"
        + (f"📝 Notes: {special_requests}\n" if special_requests else "")
        + f"\nWe can't wait to see you! If you need to make any changes, feel free to message us here."
    )

    return {"booking": booking, "confirmation_message": confirmation}


def get_upcoming_slots(booking_date: str) -> list[str]:
    """Return available time slots for a given date."""
    cfg = RESTAURANT_CONFIG["booking_slots"]
    all_slots = cfg["slot_times"]

    try:
        db = get_supabase()
        result = (
            db.table("bookings")
            .select("time")
            .eq("date", booking_date)
            .neq("status", "cancelled")
            .execute()
        )
        booked_times = {}
        for row in (result.data or []):
            t = row["time"][:5]  # "HH:MM"
            booked_times[t] = booked_times.get(t, 0) + 1

        available = [s for s in all_slots if booked_times.get(s, 0) < 2]
        return available
    except Exception:
        return all_slots
