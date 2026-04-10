import React, { useEffect, useState } from 'react'
import { getAnalyticsDetailed, createFAQ } from '../../services/api'

export default function AnalyticsPanel({ businessId, onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addingFAQ, setAddingFAQ] = useState(null) // question string being added

  useEffect(() => {
    getAnalyticsDetailed()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleAddFAQ = async (question) => {
    if (!businessId) return
    setAddingFAQ(question)
    try {
      await createFAQ(question, '(Add your answer here)', businessId)
      onNavigate('faqs')
    } catch (err) {
      console.error('FAQ create error:', err)
    } finally {
      setAddingFAQ(null)
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading analytics…</p>
  if (!data) return <p className="text-slate-500 text-sm">Failed to load analytics.</p>

  const maxPeak = Math.max(...data.peak_hours.map(h => h.count), 1)
  const sentimentTotal = data.sentiment.positive + data.sentiment.neutral + data.sentiment.negative || 1

  const C = 226
  const posAngle = (data.sentiment.positive / sentimentTotal) * C
  const neuAngle = (data.sentiment.neutral / sentimentTotal) * C
  const negAngle = (data.sentiment.negative / sentimentTotal) * C

  const hourLabel = (h) => {
    if (h === 0) return '12a'
    if (h === 12) return '12p'
    return h < 12 ? `${h}a` : `${h - 12}p`
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Total Customers" value={data.total_customers} icon={<UsersIcon />} />
        <KPICard label="Messages Handled" value={data.messages_handled} icon={<MessageIcon />} />
        <KPICard label="Conversion Rate" value={`${data.conversion_rate}%`} icon={<TrendingUpIcon />} accent />
        <KPICard label="Confirmed Bookings" value={data.inquiries_to_bookings.bookings} icon={<CalendarIcon />} />
      </div>

      {/* ── Conversion Insights ───────────────────────────── */}
      <div className="glass p-5 flex flex-col gap-4">
        <SectionHeader icon={<TrendingUpIcon size={14} />} title="Conversion Insights" />
        <div className="grid grid-cols-2 gap-4">
          <ConversionCard
            label="Inquiries → Bookings"
            from={data.inquiries_to_bookings.inquiries}
            to={data.inquiries_to_bookings.bookings}
            rate={data.inquiries_to_bookings.rate}
            fromLabel="Total Leads"
            toLabel="Bookings Made"
          />
          <ConversionCard
            label="Chats → Purchases"
            from={data.chats_to_purchases.inquiries}
            to={data.chats_to_purchases.bookings}
            rate={data.chats_to_purchases.rate}
            fromLabel="Conversations"
            toLabel="Bookings Made"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* ── Peak Hours Bar Chart ──────────────────────────── */}
        <div className="glass p-5 flex flex-col gap-3">
          <SectionHeader icon={<ClockIcon size={14} />} title="Peak Hours" />
          <p className="text-slate-500 text-xs -mt-1">Customer message volume by hour of day</p>
          <div className="flex items-end gap-px h-28 mt-2">
            {data.peak_hours.map(({ hour, count }) => {
              const heightPct = maxPeak > 0 ? (count / maxPeak) * 100 : 0
              const isEvening = hour >= 17 && hour <= 21
              return (
                <div
                  key={hour}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                  style={{ height: '100%' }}
                >
                  <div
                    style={{
                      height: `${Math.max(heightPct, 4)}%`,
                      background: isEvening ? '#2563eb' : 'rgba(255,255,255,0.1)',
                      borderRadius: '2px 2px 0 0',
                      width: '100%',
                      transition: 'height 0.3s',
                    }}
                  />
                  {count > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                      {hourLabel(hour)}: {count}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-sm bg-blue-600" />
            <span className="text-xs text-slate-500">Evening peak (5–9 PM)</span>
          </div>
        </div>

        {/* ── Sentiment Donut ───────────────────────────────── */}
        <div className="glass p-5 flex flex-col gap-3">
          <SectionHeader icon={<SmileIcon size={14} />} title="Customer Sentiment" />
          <p className="text-slate-500 text-xs -mt-1">Based on lead conversion status</p>
          <div className="flex items-center gap-6 mt-2">
            <svg width={100} height={100} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              <circle
                cx="50" cy="50" r="36" fill="none"
                stroke="#22c55e" strokeWidth="16"
                strokeDasharray={`${posAngle} ${C}`}
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
              />
              <circle
                cx="50" cy="50" r="36" fill="none"
                stroke="#64748b" strokeWidth="16"
                strokeDasharray={`${neuAngle} ${C}`}
                strokeDashoffset={`${-posAngle}`}
                transform="rotate(-90 50 50)"
              />
              <circle
                cx="50" cy="50" r="36" fill="none"
                stroke="#ef4444" strokeWidth="16"
                strokeDasharray={`${negAngle} ${C}`}
                strokeDashoffset={`${-(posAngle + neuAngle)}`}
                transform="rotate(-90 50 50)"
              />
              <text x="50" y="54" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">
                {Math.round((data.sentiment.positive / sentimentTotal) * 100)}%
              </text>
            </svg>
            <div className="flex flex-col gap-2">
              <SentimentLegend color="#22c55e" label="Positive" count={data.sentiment.positive} />
              <SentimentLegend color="#64748b" label="Neutral" count={data.sentiment.neutral} />
              <SentimentLegend color="#ef4444" label="Negative" count={data.sentiment.negative} />
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* ── Frequently Asked ──────────────────────────────── */}
        <div className="glass p-5 flex flex-col gap-3">
          <SectionHeader icon={<MessageCircleIcon size={14} />} title="Frequently Asked" />
          <p className="text-slate-500 text-xs -mt-1">Real questions from customers — add them as FAQs to save AI credits</p>
          {data.frequent_questions.length === 0 ? (
            <p className="text-slate-500 text-xs mt-1">No question data yet. Questions from WhatsApp and Instagram will appear here.</p>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              {data.frequent_questions.map((q, i) => (
                <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-white/[.05] last:border-0">
                  <p className="text-slate-300 text-xs leading-relaxed flex-1">{q}</p>
                  <button
                    onClick={() => handleAddFAQ(q)}
                    disabled={addingFAQ === q}
                    className="shrink-0 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 rounded px-2 py-0.5 transition-colors disabled:opacity-50"
                  >
                    {addingFAQ === q ? '…' : '+ FAQ'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── AI Suggestions ────────────────────────────────── */}
        <div className="glass p-5 flex flex-col gap-3">
          <SectionHeader icon={<SparkleIcon size={14} />} title="AI Suggestions" />
          <div className="flex flex-col gap-3 mt-1">
            {data.ai_suggestions.map((suggestion, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <p className="text-slate-300 text-xs leading-relaxed">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <h2 className="text-white font-semibold text-sm">{title}</h2>
    </div>
  )
}

function KPICard({ label, value, icon, accent }) {
  return (
    <div
      className="glass p-4 flex flex-col gap-1"
      style={accent ? { borderColor: 'rgba(37,99,235,0.3)' } : {}}
    >
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs">{label}</span>
        <span className={accent ? 'text-blue-400' : 'text-slate-400'}>{icon}</span>
      </div>
      <span className={`text-2xl font-bold ${accent ? 'text-blue-400' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function ConversionCard({ label, from, to, rate, fromLabel, toLabel }) {
  return (
    <div className="bg-white/[.03] border border-white/[.06] rounded-xl p-4 flex flex-col gap-3">
      <p className="text-slate-400 text-xs font-medium">{label}</p>
      <div className="flex items-center gap-3">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{from}</div>
          <div className="text-xs text-slate-600 mt-0.5">{fromLabel}</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full h-0.5 bg-gradient-to-r from-slate-600 via-blue-500 to-slate-600 rounded" />
          <span className="text-blue-400 text-xs font-semibold">{rate}%</span>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-400">{to}</div>
          <div className="text-xs text-slate-600 mt-0.5">{toLabel}</div>
        </div>
      </div>
    </div>
  )
}

function SentimentLegend({ color, label, count }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs text-slate-600 ml-auto">{count}</span>
    </div>
  )
}

// ── Inline SVG Icons ───────────────────────────────────────────

function UsersIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function MessageIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function TrendingUpIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  )
}

function CalendarIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function ClockIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function SmileIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function MessageCircleIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  )
}

function SparkleIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  )
}
