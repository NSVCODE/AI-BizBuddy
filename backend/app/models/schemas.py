from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime
from uuid import UUID


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str
    channel: str = "web_chat"  # "web_chat" | "whatsapp"
    customer_phone: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    channel: str


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: str  # "user" | "assistant"
    content: str
    created_at: datetime


class ConversationOut(BaseModel):
    id: str
    channel: str
    session_id: str
    created_at: datetime
    last_message: Optional[str] = None


# ── Leads ─────────────────────────────────────────────────────────────────────

class LeadCreate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    source: str = "web_chat"  # "web_chat" | "whatsapp" | "missed_call"
    notes: Optional[str] = None
    inquiry_type: Optional[str] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None  # "new" | "contacted" | "converted" | "lost"
    notes: Optional[str] = None


class LeadOut(BaseModel):
    id: str
    name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    source: str
    status: str
    notes: Optional[str]
    inquiry_type: Optional[str]
    created_at: datetime


# ── Bookings ──────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    customer_name: str
    phone: str
    date: str          # "YYYY-MM-DD"
    time: str          # "HH:MM"
    party_size: int
    special_requests: Optional[str] = None
    lead_id: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[str] = None  # "pending" | "confirmed" | "cancelled" | "completed"
    special_requests: Optional[str] = None


class BookingOut(BaseModel):
    id: str
    customer_name: str
    phone: str
    date: str
    time: str
    party_size: int
    status: str
    special_requests: Optional[str]
    lead_id: Optional[str]
    created_at: datetime


# ── WhatsApp Simulation ───────────────────────────────────────────────────────

class WhatsAppMessage(BaseModel):
    phone: str
    message: str
    session_id: Optional[str] = None  # auto-generated if not provided


class MissedCallRequest(BaseModel):
    phone: str
    caller_name: Optional[str] = None


# ── Analytics ─────────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    business_id: Optional[str] = None
    total_leads: int
    new_leads_today: int
    bookings_today: int
    total_bookings: int
    active_conversations: int
    web_chat_leads: int
    whatsapp_leads: int
    missed_call_leads: int
    confirmed_bookings: int
    pending_bookings: int


class PeakHour(BaseModel):
    hour: int
    count: int


class QueryType(BaseModel):
    type: str
    count: int


class ConversionStats(BaseModel):
    inquiries: int
    bookings: int
    rate: float


class SentimentBreakdown(BaseModel):
    positive: int
    neutral: int
    negative: int


class AnalyticsDetailed(BaseModel):
    total_customers: int
    messages_handled: int
    conversion_rate: float
    inquiries_to_bookings: ConversionStats
    chats_to_purchases: ConversionStats
    peak_hours: List[PeakHour]
    top_queries: List[QueryType]
    frequent_questions: List[str]
    ai_suggestions: List[str]
    sentiment: SentimentBreakdown
