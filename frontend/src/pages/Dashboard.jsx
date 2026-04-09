import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StatsBar from '../components/Dashboard/StatsBar'
import LeadsTable from '../components/Dashboard/LeadsTable'
import BookingsTable from '../components/Dashboard/BookingsTable'
import ConversationsPanel from '../components/Dashboard/ConversationsPanel'
import WhatsAppConnect from '../components/WhatsAppConnect/WhatsAppConnect'
import { getAnalytics, getLeads, getBookings, getConversations } from '../services/api'

const NAV = [
  { id: 'overview',       label: 'Overview',       icon: GridIcon },
  { id: 'whatsapp',       label: 'WhatsApp',        icon: MessageIcon },
  { id: 'leads',          label: 'Leads',           icon: UsersIcon },
  { id: 'bookings',       label: 'Bookings',        icon: CalendarIcon },
  { id: 'conversations',  label: 'Conversations',   icon: ChatIcon },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [active, setActive] = useState('overview')
  const [stats, setStats] = useState(null)
  const [leads, setLeads] = useState([])
  const [bookings, setBookings] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [waStatus, setWaStatus] = useState('offline')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, l, b, c] = await Promise.all([getAnalytics(), getLeads(), getBookings(), getConversations()])
      setStats(s); setLeads(l)
      // Dedup: per (phone, date, time), keep highest-status entry
      const statusRank = { confirmed: 3, pending: 2, cancelled: 1, completed: 0 }
      const bookingMap = new Map()
      for (const bk of b) {
        const key = `${bk.phone}|${bk.date}|${bk.time}`
        const existing = bookingMap.get(key)
        if (!existing || (statusRank[bk.status] ?? 0) > (statusRank[existing.status] ?? 0)) {
          bookingMap.set(key, bk)
        }
      }
      setBookings([...bookingMap.values()])
      setConversations(c.filter(conv => conv.channel === 'whatsapp'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll WhatsApp status
  const fetchWaStatus = useCallback(async () => {
    try {
      const res = await fetch('/wa-api/status')
      if (!res.ok) { setWaStatus('offline'); return }
      const data = await res.json()
      setWaStatus(data.status)
    } catch { setWaStatus('offline') }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => {
    const iv = setInterval(fetchAll, 30000)
    return () => clearInterval(iv)
  }, [fetchAll])
  useEffect(() => {
    fetchWaStatus()
    const iv = setInterval(fetchWaStatus, 3000)
    return () => clearInterval(iv)
  }, [fetchWaStatus])

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const counts = {
    leads: leads.length,
    bookings: bookings.length,
    conversations: conversations.length,
  }

  const pageTitle = {
    overview: 'Overview',
    whatsapp: 'WhatsApp',
    leads: 'Leads',
    bookings: 'Bookings',
    conversations: 'Conversations',
  }

  return (
    <div className="flex h-screen bg-[#080C18] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-white/[.07] bg-[#080C18]">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-white/[.07]">
          <img src="/BizBuddy_Logo.png" alt="BizBuddy" className="h-16 w-auto" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {NAV.map(item => {
            const Icon = item.icon
            const isActive = active === item.id
            const count = counts[item.id]
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`nav-item ${isActive ? 'nav-active' : 'nav-default'}`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'whatsapp' && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    waStatus === 'connected' ? 'bg-green-400' :
                    waStatus === 'qr' || waStatus === 'connecting' ? 'bg-yellow-400' :
                    'bg-slate-600'
                  }`} />
                )}
                {count !== undefined && count > 0 && item.id !== 'whatsapp' && (
                  <span className="text-xs bg-white/[.08] text-slate-400 px-1.5 py-0.5 rounded-md shrink-0">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/[.07]">
          <div className="px-3 py-2 mb-1">
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
          <button onClick={handleSignOut} className="nav-item nav-default text-slate-500">
            <SignOutIcon size={15} className="shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 px-8 py-4 border-b border-white/[.07] flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-lg tracking-tight">{pageTitle[active]}</h1>
          </div>
          <button
            onClick={fetchAll}
            className="text-xs text-slate-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/[.07] hover:bg-white/[.05]"
          >
            Refresh
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {active === 'overview' && (
            <div className="fade-in flex flex-col gap-6">
              <StatsBar stats={stats} loading={loading} />
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <SectionHeader title="Today's Bookings" count={bookings.filter(b => b.date === new Date().toISOString().slice(0,10)).length} />
                  <div className="glass overflow-hidden mt-3">
                    <BookingsTable
                      bookings={bookings.filter(b => b.date === new Date().toISOString().slice(0,10))}
                      loading={loading} onRefresh={fetchAll}
                    />
                  </div>
                </div>
                <div>
                  <SectionHeader title="Recent Leads" count={leads.slice(0,5).length} />
                  <div className="glass overflow-hidden mt-3">
                    <LeadsTable leads={leads.slice(0,5)} loading={loading} onRefresh={fetchAll} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'whatsapp' && (
            <div className="fade-in max-w-md">
              <WhatsAppConnect />
            </div>
          )}

          {active === 'leads' && (
            <div className="fade-in">
              <div className="glass overflow-hidden">
                <LeadsTable leads={leads} loading={loading} onRefresh={fetchAll} />
              </div>
            </div>
          )}

          {active === 'bookings' && (
            <div className="fade-in">
              <div className="glass overflow-hidden">
                <BookingsTable bookings={bookings} loading={loading} onRefresh={fetchAll} />
              </div>
            </div>
          )}

          {active === 'conversations' && (
            <div className="fade-in">
              <ConversationsPanel conversations={conversations} loading={loading} />
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-white">{title}</span>
      {count > 0 && <span className="text-xs text-slate-500 bg-white/[.06] px-1.5 py-0.5 rounded">{count}</span>}
    </div>
  )
}

// ── Inline SVG Icons ──────────────────────────────────────────
function GridIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}
function MessageIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function UsersIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function CalendarIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function ChatIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function SignOutIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}
