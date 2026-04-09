import React from 'react'

const STATS = [
  { key: 'total_leads',           label: 'Total Leads',      sub: d => `+${d?.new_leads_today ?? 0} today` },
  { key: 'bookings_today',        label: 'Bookings Today',   sub: d => `${d?.total_bookings ?? 0} total` },
  { key: 'active_conversations',  label: 'Conversations',    sub: () => 'active sessions' },
  { key: 'confirmed_bookings',    label: 'Confirmed',        sub: d => `${d?.pending_bookings ?? 0} pending` },
  { key: 'whatsapp_leads',        label: 'WhatsApp Leads',   sub: d => `${d?.missed_call_leads ?? 0} missed calls` },
]

export default function StatsBar({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="glass h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      {STATS.map(({ key, label, sub }) => (
        <div key={key} className="glass p-5">
          <div className="text-3xl font-bold text-white tabular-nums leading-none mb-2">
            {stats?.[key] ?? '—'}
          </div>
          <div className="text-sm text-slate-400 font-medium mb-0.5">{label}</div>
          <div className="text-xs text-slate-600">{sub(stats)}</div>
        </div>
      ))}
    </div>
  )
}
