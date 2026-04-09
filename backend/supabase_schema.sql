-- ============================================================
-- LatteLune AI BizBuddy — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Conversations ────────────────────────────────────────────
create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  channel     text not null,        -- 'web_chat' | 'whatsapp'
  session_id  text not null unique,
  created_at  timestamptz default now()
);

-- ── Messages ─────────────────────────────────────────────────
create table if not exists messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid references conversations(id) on delete cascade,
  role             text not null,   -- 'user' | 'assistant'
  content          text not null,
  created_at       timestamptz default now()
);

-- ── Leads ────────────────────────────────────────────────────
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  phone         text,
  email         text,
  source        text not null default 'web_chat',  -- 'web_chat' | 'whatsapp' | 'missed_call'
  status        text not null default 'new',        -- 'new' | 'contacted' | 'converted' | 'lost'
  notes         text,
  inquiry_type  text,
  created_at    timestamptz default now()
);

-- ── Bookings ─────────────────────────────────────────────────
create table if not exists bookings (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid references leads(id) on delete set null,
  customer_name     text not null,
  phone             text not null,
  date              date not null,
  time              time not null,
  party_size        int not null,
  status            text not null default 'pending',  -- 'pending' | 'confirmed' | 'cancelled' | 'completed'
  special_requests  text,
  created_at        timestamptz default now()
);

-- ── FAQs ─────────────────────────────────────────────────────
create table if not exists faqs (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  question    text not null,
  answer      text not null,
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

alter table faqs enable row level security;
create policy "Public can read active faqs" on faqs for select using (true);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_leads_source on leads(source);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_bookings_date on bookings(date);
create index if not exists idx_bookings_status on bookings(status);

-- ── Seed Demo Data ───────────────────────────────────────────
-- Demo leads
insert into leads (name, phone, email, source, status, notes, inquiry_type) values
  ('Priya Sharma',   '+91 98765 11111', 'priya@email.com',  'web_chat',    'new',       'Interested in weekend brunch',       'reservation'),
  ('Arjun Mehta',    '+91 98765 22222', null,               'whatsapp',    'contacted', 'Asked about vegan options',          'faq'),
  ('Sneha Nair',     '+91 98765 33333', 'sneha@email.com',  'web_chat',    'converted', 'Booked for birthday',                'event'),
  ('Rohit Verma',    '+91 98765 44444', null,               'missed_call', 'new',       'Missed call — sent WhatsApp follow-up', 'unknown'),
  ('Kavitha Reddy',  '+91 98765 55555', 'kavitha@mail.com', 'web_chat',    'new',       'Asked about private event space',    'event'),
  ('Aditya Kumar',   '+91 98765 66666', null,               'whatsapp',    'new',       'Wants to know about loyalty program', 'faq')
on conflict do nothing;

-- Demo bookings (linked to Sneha — converted lead)
insert into bookings (customer_name, phone, date, time, party_size, status, special_requests)
values
  ('Sneha Nair',   '+91 98765 33333', current_date + 1, '18:00', 6, 'confirmed', 'Birthday celebration, please arrange a candle'),
  ('Priya Sharma', '+91 98765 11111', current_date + 2, '12:00', 2, 'pending',   'Window seat preferred'),
  ('Vikram Singh', '+91 98765 77777', current_date,     '19:30', 4, 'confirmed', 'Vegan menu options needed')
on conflict do nothing;
