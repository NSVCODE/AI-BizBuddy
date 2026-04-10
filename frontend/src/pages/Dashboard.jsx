import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StatsBar from '../components/Dashboard/StatsBar'
import LeadsTable from '../components/Dashboard/LeadsTable'
import BookingsTable from '../components/Dashboard/BookingsTable'
import ConversationsPanel from '../components/Dashboard/ConversationsPanel'
import WhatsAppConnect from '../components/WhatsAppConnect/WhatsAppConnect'
import AnalyticsPanel from '../components/Dashboard/AnalyticsPanel'
import { getAnalytics, getLeads, getBookings, getConversations, getFAQs, createFAQ, updateFAQ, deleteFAQ } from '../services/api'

const NAV = [
  { id: 'overview',       label: 'Overview',       icon: GridIcon },
  { id: 'whatsapp',       label: 'WhatsApp',        icon: MessageIcon },
  { id: 'instagram',      label: 'Instagram',       icon: InstagramIcon },
  { id: 'leads',          label: 'Leads',           icon: UsersIcon },
  { id: 'bookings',       label: 'Bookings',        icon: CalendarIcon },
  { id: 'conversations',  label: 'Conversations',   icon: ChatIcon },
  { id: 'faqs',           label: 'FAQs',            icon: FAQIcon },
  { id: 'analytics',     label: 'Analytics',       icon: AnalyticsIcon },
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
  const [igStatus, setIgStatus] = useState('offline')
  const [businessId, setBusinessId] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, l, b, c] = await Promise.all([getAnalytics(), getLeads(businessId), getBookings(businessId), getConversations()])
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
  }, [businessId])

  // Poll WhatsApp status
  const fetchWaStatus = useCallback(async () => {
    try {
      const res = await fetch('/wa-api/status')
      if (!res.ok) { setWaStatus('offline'); return }
      const data = await res.json()
      setWaStatus(data.status)
    } catch { setWaStatus('offline') }
  }, [])

  // Poll Instagram status
  const fetchIgStatus = useCallback(async () => {
    try {
      const res = await fetch('/ig-api/status')
      if (!res.ok) { setIgStatus('offline'); return }
      const data = await res.json()
      setIgStatus(data.status)
    } catch { setIgStatus('offline') }
  }, [])

  // Fetch the business belonging to the current logged-in user
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/business/profile?user_id=${user.id}`)
        .then(r => r.json())
        .then(data => { if (data?.id) setBusinessId(data.id) })
        .catch(() => {})
    }
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll, businessId])
  useEffect(() => {
    const iv = setInterval(fetchAll, 30000)
    return () => clearInterval(iv)
  }, [fetchAll])
  useEffect(() => {
    fetchWaStatus()
    const iv = setInterval(fetchWaStatus, 3000)
    return () => clearInterval(iv)
  }, [fetchWaStatus])

  useEffect(() => {
    fetchIgStatus()
    const iv = setInterval(fetchIgStatus, 5000)
    return () => clearInterval(iv)
  }, [fetchIgStatus])

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
    instagram: 'Instagram',
    leads: 'Leads',
    bookings: 'Bookings',
    conversations: 'Conversations',
    faqs: 'Custom FAQs',
    analytics: 'Analytics',
  }

  return (
    <div className="flex h-screen bg-[#080C18] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-white/[.07] bg-[#080C18]">
        {/* Brand */}
        <div className="h-16 px-4 border-b border-white/[.07] flex items-center gap-2.5 shrink-0">
          <img src="/favicon.png" alt="BizBuddy" className="h-9 w-9 shrink-0" />
          <span className="font-bold text-2xl tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#2563EB' }}>BizBuddy</span>
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
                {item.id === 'instagram' && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    igStatus === 'connected' ? 'bg-green-400' :
                    igStatus === 'error' ? 'bg-red-500' :
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
        <header className="h-16 shrink-0 px-8 border-b border-white/[.07] flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-lg tracking-tight">{pageTitle[active]}</h1>
          </div>
          <div className="flex items-center gap-2">
            {businessId && (
              <a
                href={`/?id=${businessId}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg border border-white/[.07] hover:bg-white/[.05]"
              >
                View Customer Page ↗
              </a>
            )}
            <button
              onClick={fetchAll}
              className="text-xs text-slate-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/[.07] hover:bg-white/[.05]"
            >
              Refresh
            </button>
          </div>
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

          {active === 'instagram' && (
            <div className="fade-in max-w-md">
              <InstagramConnect igStatus={igStatus} />
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

          {active === 'faqs' && (
            <div className="fade-in max-w-2xl">
              <FAQManager businessId={businessId} />
            </div>
          )}

          {active === 'analytics' && (
            <div className="fade-in">
              <AnalyticsPanel />
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
function InstagramIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
    </svg>
  )
}
function FAQIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}
function AnalyticsIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  )
}

// ── FAQ Manager ────────────────────────────────────────────────
function FAQManager({ businessId }) {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editQ, setEditQ] = useState('')
  const [editA, setEditA] = useState('')

  const load = async () => {
    try {
      const data = await getFAQs(businessId)
      setFaqs(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [businessId])

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) return
    setSaving(true)
    try {
      await createFAQ(question.trim(), answer.trim(), businessId)
      setQuestion(''); setAnswer('')
      await load()
    } catch (err) {
      console.error('FAQ create error:', err)
      alert('Failed to save FAQ: ' + (err?.response?.data?.detail || err.message || 'Unknown error'))
    }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    await deleteFAQ(id)
    setFaqs(f => f.filter(x => x.id !== id))
  }

  const startEdit = (faq) => {
    setEditId(faq.id); setEditQ(faq.question); setEditA(faq.answer)
  }

  const handleSaveEdit = async () => {
    await updateFAQ(editId, { question: editQ, answer: editA })
    setEditId(null)
    await load()
  }

  const handleToggle = async (faq) => {
    await updateFAQ(faq.id, { is_active: !faq.is_active })
    await load()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass p-5 flex flex-col gap-4">
        <h2 className="text-white font-semibold text-sm">Add New FAQ</h2>
        <p className="text-slate-500 text-xs -mt-2">These appear in the AI's knowledge base and on your customer page.</p>
        <input
          className="input-dark"
          placeholder="Question — e.g. Do you offer student discounts?"
          value={question}
          onChange={e => setQuestion(e.target.value)}
        />
        <textarea
          className="input-dark"
          placeholder="Answer"
          rows={3}
          style={{ resize: 'vertical' }}
          value={answer}
          onChange={e => setAnswer(e.target.value)}
        />
        <button
          className="btn-primary"
          onClick={handleAdd}
          disabled={saving || !question.trim() || !answer.trim()}
          style={{ width: 'auto', alignSelf: 'flex-start', padding: '0.5rem 1.25rem' }}
        >
          {saving ? 'Saving…' : 'Add FAQ'}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-slate-500 text-sm">Loading…</p>}
        {!loading && faqs.length === 0 && (
          <p className="text-slate-500 text-sm">No custom FAQs yet. Add one above.</p>
        )}
        {faqs.map(faq => (
          <div key={faq.id} className="glass p-4 flex flex-col gap-2">
            {editId === faq.id ? (
              <>
                <input
                  className="input-dark text-xs"
                  value={editQ}
                  onChange={e => setEditQ(e.target.value)}
                />
                <textarea
                  className="input-dark text-xs"
                  rows={3}
                  style={{ resize: 'vertical' }}
                  value={editA}
                  onChange={e => setEditA(e.target.value)}
                />
                <div className="flex gap-2 mt-1">
                  <button className="btn-primary text-xs" style={{ width: 'auto', padding: '0.35rem 1rem' }} onClick={handleSaveEdit}>Save</button>
                  <button className="btn-ghost text-xs" style={{ width: 'auto', padding: '0.35rem 1rem' }} onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-white text-sm font-medium leading-snug">{faq.question}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      title={faq.is_active ? 'Disable' : 'Enable'}
                      onClick={() => handleToggle(faq)}
                      className={`w-2 h-2 rounded-full transition-colors ${faq.is_active ? 'bg-green-400' : 'bg-slate-600'}`}
                      style={{ padding: '6px', boxSizing: 'content-box' }}
                    />
                    <button onClick={() => startEdit(faq)} className="text-slate-500 hover:text-white transition-colors text-xs">Edit</button>
                    <button onClick={() => handleDelete(faq.id)} className="text-slate-500 hover:text-red-400 transition-colors text-xs">Delete</button>
                  </div>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{faq.answer}</p>
                {!faq.is_active && <span className="text-xs text-slate-600 italic">Disabled — hidden from AI and customers</span>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Instagram Connect Panel ────────────────────────────────────
function InstagramConnect({ igStatus }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [feedback, setFeedback] = useState('')

  const statusConfigs = {
    connected:   { color: 'bg-green-400',  label: 'Connected' },
    connecting:  { color: 'bg-yellow-400', label: 'Connecting…' },
    error:       { color: 'bg-red-500',    label: 'Login failed' },
    no_credentials: { color: 'bg-yellow-400', label: 'Not configured' },
    offline:     { color: 'bg-slate-600',  label: 'Service offline' },
  }
  const c = statusConfigs[igStatus] || statusConfigs.offline

  const handleConnect = async () => {
    if (!username.trim() || !password.trim()) return
    setConnecting(true)
    setFeedback('')
    try {
      await fetch('/ig-api/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      setFeedback('Connecting — this may take a few seconds…')
      setPassword('')
    } catch {
      setFeedback('Could not reach Instagram service. Is it running?')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    await fetch('/ig-api/disconnect', { method: 'POST' }).catch(() => {})
  }

  return (
    <div className="glass p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-base">Instagram DM Integration</h2>
          <p className="text-slate-500 text-xs mt-0.5">Auto-reply to Instagram direct messages</p>
        </div>
        <div className="flex items-center gap-2 bg-white/[.05] border border-white/[.08] rounded-full px-3 py-1">
          <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
          <span className="text-xs text-slate-400 font-medium">{c.label}</span>
        </div>
      </div>

      <div className="border-t border-white/[.07]" />

      {igStatus === 'connected' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
            <p className="text-green-400 text-sm font-semibold">Connected — DMs are being handled by AI</p>
          </div>
          <p className="text-slate-500 text-xs">All incoming Instagram DMs are automatically replied to by your AI assistant.</p>
          <button onClick={handleDisconnect} className="btn-ghost text-xs" style={{ width: 'auto', alignSelf: 'flex-start', padding: '0.4rem 1rem' }}>
            Disconnect
          </button>
        </div>
      )}

      {igStatus === 'offline' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 text-xs text-yellow-400">
          Instagram service is not running. Start it first:<br />
          <span className="font-mono mt-1 block">cd instagram-service &amp;&amp; npm start</span>
        </div>
      )}

      {(igStatus === 'no_credentials' || igStatus === 'error' || igStatus === 'disconnected') && (
        <div className="flex flex-col gap-4">
          {igStatus === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-xs text-red-400">
              Login failed — double-check your username and password.
            </div>
          )}
          <p className="text-slate-400 text-sm">Enter your Instagram business account credentials:</p>
          <input
            className="input-dark"
            placeholder="Instagram username (without @)"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            className="input-dark"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {feedback && <p className="text-xs text-slate-400">{feedback}</p>}
          <button
            className="btn-primary"
            onClick={handleConnect}
            disabled={connecting || !username.trim() || !password.trim()}
            style={{ width: 'auto', alignSelf: 'flex-start', padding: '0.5rem 1.25rem' }}
          >
            {connecting ? 'Connecting…' : 'Connect Instagram'}
          </button>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 text-xs text-yellow-400">
            Use a dedicated business Instagram account — not your personal one.
          </div>
        </div>
      )}
    </div>
  )
}
