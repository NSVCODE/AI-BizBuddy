import React, { useState } from 'react'
import { updateLead } from '../../services/api'

const STATUS = {
  new:       { label: 'New',       cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  contacted: { label: 'Contacted', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  converted: { label: 'Converted', cls: 'bg-green-500/15 text-green-400 border-green-500/20' },
  lost:      { label: 'Lost',      cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
}

const SOURCE = {
  web_chat:    'Web Chat',
  whatsapp:    'WhatsApp',
  missed_call: 'Missed Call',
}

export default function LeadsTable({ leads, loading, onRefresh }) {
  const [updating, setUpdating] = useState(null)

  const handleStatus = async (id, status) => {
    setUpdating(id)
    try { await updateLead(id, { status }); onRefresh?.() }
    finally { setUpdating(null) }
  }

  if (loading) return <div className="py-10 text-center text-sm text-slate-600">Loading...</div>
  if (!leads?.length) return <div className="py-10 text-center text-sm text-slate-600">No leads yet.</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[.07]">
            {['Name', 'Phone', 'Source', 'Type', 'Status', 'Notes', 'Date'].map(h => (
              <th key={h} className="th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => {
            const s = STATUS[lead.status] || STATUS.new
            return (
              <tr key={lead.id} className="tr">
                <td className="td font-medium text-white">
                  {lead.name || <span className="text-slate-600 italic">Unknown</span>}
                </td>
                <td className="td font-mono text-xs">{lead.phone || '—'}</td>
                <td className="td">
                  <span className="badge bg-white/[.07] text-slate-400 border border-white/[.08]">
                    {SOURCE[lead.source] || lead.source || '—'}
                  </span>
                </td>
                <td className="td capitalize text-slate-400">{lead.inquiry_type || '—'}</td>
                <td className="td">
                  <select
                    value={lead.status}
                    onChange={e => handleStatus(lead.id, e.target.value)}
                    disabled={updating === lead.id}
                    className={`badge border cursor-pointer bg-transparent outline-none ${s.cls}`}
                  >
                    {Object.entries(STATUS).map(([v, st]) => (
                      <option key={v} value={v} className="bg-[#0D1526] text-white">{st.label}</option>
                    ))}
                  </select>
                </td>
                <td className="td max-w-[180px]">
                  <span className="block truncate text-slate-500">{lead.notes || '—'}</span>
                </td>
                <td className="td text-xs text-slate-600 whitespace-nowrap">
                  {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
