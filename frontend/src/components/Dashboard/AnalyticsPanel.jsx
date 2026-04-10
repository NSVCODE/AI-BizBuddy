import React, { useEffect, useState } from 'react'
import { getAnalyticsDetailed } from '../../services/api'

export default function AnalyticsPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalyticsDetailed()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-500 text-sm">Loading analytics…</p>
  if (!data) return <p className="text-slate-500 text-sm">Failed to load analytics.</p>

  const maxPeak = Math.max(...data.peak_hours.map(h => h.count), 1)
  const sentimentTotal = data.sentiment.positive + data.sentiment.neutral + data.sentiment.negative || 1

  // SVG donut chart values (circumference = 2π × 36 ≈ 226)
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
        <KPICard label="Total Customers" value={data.total_customers} icon="👥" />
        <KPICard label="Messages Handled" value={data.messages_handled} icon="💬" />
        <KPICard label="Conversion Rate" value={`${data.conversion_rate}%`} icon="📈" accent />
        <KPICard label="Confirmed Bookings" value={data.inquiries_to_bookings.bookings} icon="📅" />
      </div>

      {/* ── Conversion Insights ───────────────────────────── */}
      <div className="glass p-5 flex flex-col gap-4">
        <h2 className="text-white font-semibold text-sm">📈 Conversion Insights</h2>
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
          <h2 className="text-white font-semibold text-sm">⏰ Peak Hours</h2>
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
                  {/* Tooltip */}
                  {count > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                      {hourLabel(hour)}: {count}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {/* X-axis labels: every 6 hours */}
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
          <h2 className="text-white font-semibold text-sm">😊 Customer Sentiment</h2>
          <p className="text-slate-500 text-xs -mt-1">Based on lead conversion status</p>
          <div className="flex items-center gap-6 mt-2">
            <svg width={100} height={100} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              {/* Positive (green) */}
              <circle
                cx="50" cy="50" r="36" fill="none"
                stroke="#22c55e" strokeWidth="16"
                strokeDasharray={`${posAngle} ${C}`}
                strokeDashoffset="0"
                transform="rotate(-90 50 50)"
              />
              {/* Neutral (slate) */}
              <circle
                cx="50" cy="50" r="36" fill="none"
                stroke="#64748b" strokeWidth="16"
                strokeDasharray={`${neuAngle} ${C}`}
                strokeDashoffset={`${-posAngle}`}
                transform="rotate(-90 50 50)"
              />
              {/* Negative (red) */}
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

        {/* ── Top Queries ───────────────────────────────────── */}
        <div className="glass p-5 flex flex-col gap-3">
          <h2 className="text-white font-semibold text-sm">🔍 Top Query Types</h2>
          {data.top_queries.length === 0 ? (
            <p className="text-slate-500 text-xs">No query data yet.</p>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              {data.top_queries.map(({ type, count }, i) => {
                const maxCount = data.top_queries[0].count
                const pct = Math.round((count / maxCount) * 100)
                return (
                  <div key={type} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 capitalize">{type.replace('_', ' ')}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[.06] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: i === 0 ? '#2563eb' : 'rgba(255,255,255,0.2)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── AI Suggestions ────────────────────────────────── */}
        <div className="glass p-5 flex flex-col gap-3">
          <h2 className="text-white font-semibold text-sm">🤖 AI Suggestions</h2>
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

function KPICard({ label, value, icon, accent }) {
  return (
    <div className={`glass p-4 flex flex-col gap-1 ${accent ? 'border-blue-500/30' : ''}`}
      style={accent ? { borderColor: 'rgba(37,99,235,0.3)' } : {}}>
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs">{label}</span>
        <span className="text-base">{icon}</span>
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
