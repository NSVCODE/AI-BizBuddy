import React, { useState } from 'react'
import { updateBookingStatus, cancelBooking } from '../../services/api'

const STATUS = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  confirmed: { label: 'Confirmed', cls: 'bg-green-500/15 text-green-400 border-green-500/20' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
  completed: { label: 'Completed', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
}

export default function BookingsTable({ bookings, loading, onRefresh }) {
  const [updating, setUpdating] = useState(null)

  const handleConfirm = async (id) => {
    setUpdating(id)
    try { await updateBookingStatus(id, 'confirmed'); onRefresh?.() }
    finally { setUpdating(null) }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    setUpdating(id)
    try { await cancelBooking(id); onRefresh?.() }
    finally { setUpdating(null) }
  }

  if (loading) return <div className="py-10 text-center text-sm text-slate-600">Loading...</div>
  if (!bookings?.length) return <div className="py-10 text-center text-sm text-slate-600">No bookings yet.</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[.07]">
            {['Guest', 'Phone', 'Date & Time', 'Guests', 'Status', 'Requests', 'Actions'].map(h => (
              <th key={h} className="th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => {
            const st = STATUS[b.status] || STATUS.pending
            const isToday = b.date === new Date().toISOString().slice(0, 10)
            return (
              <tr key={b.id} className="tr">
                <td className="td font-medium text-white">
                  {isToday && (
                    <span className="badge bg-blue-600/20 text-blue-400 border border-blue-500/20 mr-2">Today</span>
                  )}
                  {b.customer_name}
                </td>
                <td className="td font-mono text-xs">{b.phone}</td>
                <td className="td whitespace-nowrap">
                  <div className="text-white text-sm font-medium">
                    {new Date(b.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-blue-400 text-xs">{b.time?.slice(0, 5)}</div>
                </td>
                <td className="td text-center">
                  <span className="text-white font-semibold">{b.party_size}</span>
                  <div className="text-slate-600 text-xs">guests</div>
                </td>
                <td className="td">
                  <span className={`badge border ${st.cls}`}>{st.label}</span>
                </td>
                <td className="td max-w-[160px]">
                  <span className="block truncate text-slate-500">{b.special_requests || '—'}</span>
                </td>
                <td className="td">
                  <div className="flex gap-2">
                    {b.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(b.id)}
                        disabled={updating === b.id}
                        className="text-xs px-3 py-1 rounded-md bg-green-600/20 text-green-400 border border-green-500/20 hover:bg-green-600/30 transition-colors font-medium"
                      >
                        Confirm
                      </button>
                    )}
                    {b.status !== 'cancelled' && b.status !== 'completed' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={updating === b.id}
                        className="text-xs px-3 py-1 rounded-md bg-red-600/20 text-red-400 border border-red-500/20 hover:bg-red-600/30 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
