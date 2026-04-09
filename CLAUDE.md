# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: LatteLune AI BizBuddy

AI-powered multi-channel business assistant for LatteLune café (hackathon MVP). Stack: React (Vite) + FastAPI + Supabase + Claude Haiku API.

**GitHub:** https://github.com/NSVCODE/AI-BizBuddy

## Commands

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build
```

### Git & GitHub
```bash
# gh CLI path must be set explicitly in bash on this machine:
export PATH="$PATH:/c/Program Files/GitHub CLI"

git add <files>
git commit -m "feat: ..."
git push
```
Always commit and push after meaningful changes. Use conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`.

### Environment Setup
1. Copy `.env.example` → `backend/.env` and fill in: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`
2. `frontend/.env` only needs `VITE_API_BASE_URL=http://localhost:8000`
3. Run `backend/supabase_schema.sql` in Supabase SQL Editor (includes seed demo data)

## Architecture

### Backend (`backend/app/`)
- `config/restaurant.py` — **Single source of truth** for all LatteLune knowledge: menu, hours, FAQs, AI persona, booking slot config. Edit this to change any café context.
- `services/ai_service.py` — Core AI brain. Claude `claude-haiku-4-5-20251001` with tool calling. `process_message(session_id, message, channel)` runs an agentic loop until `stop_reason == "end_turn"`, enabling multi-step tool use per turn. Loads/saves conversation history from Supabase per session.
- `services/booking_service.py` — Availability checks (max 3 bookings per slot), booking creation.
- `services/lead_service.py` — Lead upsert deduped by phone number.
- `routers/whatsapp.py` — WhatsApp simulation: `POST /api/whatsapp/simulate` and `POST /api/whatsapp/missed-call`. Sessions stored in-memory (resets on restart — by design for demo).
- `routers/analytics.py` — Aggregates live stats from Supabase for the dashboard.
- `db/supabase_client.py` — Singleton Supabase client (lazy-initialized from env vars).
- `models/schemas.py` — All Pydantic request/response models.

### Frontend (`frontend/src/`)
- `pages/Home.jsx` — LatteLune landing page with embedded `ChatWidget`.
- `pages/Dashboard.jsx` — Admin panel: StatsBar + tabbed (Overview/Leads/Bookings/Conversations) + WhatsApp simulator sidebar. Auto-refreshes every 30s.
- `components/ChatWidget/` — `ChatBubble` (floating ☕ button) + `ChatWindow` (slide-up panel, quick replies, typing indicator). Session ID is UUID-generated per browser visit.
- `components/WhatsAppSim/WhatsAppPanel.jsx` — Simulates WhatsApp conversations per phone number; "Simulate Missed Call" triggers `POST /api/whatsapp/missed-call` and renders the auto follow-up.
- `services/api.js` — All Axios API calls. Reads `VITE_API_BASE_URL` from env.

### Database (Supabase PostgreSQL)
Tables: `conversations`, `messages`, `leads`, `bookings`. Full schema + seed data in `backend/supabase_schema.sql`.

## Key Design Decisions
- **`create_booking` also calls `capture_lead`**: every booking automatically creates/updates a lead record.
- **Lead dedup**: `lead_service.py` upserts by phone — same customer across web/WhatsApp stays one lead.
- **Vite proxy**: `vite.config.js` proxies `/api/*` → `localhost:8000`, so all frontend API calls use relative paths.
- **No Tailwind/UI library**: all styling is inline React styles using CSS variables defined in `index.css`. Color palette: `--blue #5B8DB8`, `--beige #F5E6D3`, `--yellow #F9C74F`, `--brown #6B4226`.
