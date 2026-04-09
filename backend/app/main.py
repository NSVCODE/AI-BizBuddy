from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, leads, bookings, whatsapp, analytics, business, faqs

app = FastAPI(
    title="LatteLune AI BizBuddy API",
    description="AI-powered multi-channel assistant for LatteLune café",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(leads.router)
app.include_router(bookings.router)
app.include_router(whatsapp.router)
app.include_router(analytics.router)
app.include_router(business.router)
app.include_router(faqs.router)


@app.get("/")
async def root():
    return {
        "service": "LatteLune AI BizBuddy",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
