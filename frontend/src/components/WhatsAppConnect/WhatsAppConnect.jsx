import React, { useState, useEffect } from 'react'

export default function WhatsAppConnect() {
  const [status, setStatus] = useState('loading')
  const [qr, setQr] = useState(null)
  const [number, setNumber] = useState(null)
  const [error, setError] = useState(null)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/wa-api/status')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStatus(data.status); setQr(data.qr); setNumber(data.number); setError(null)
    } catch {
      setStatus('offline')
      setError('Start the WhatsApp service to connect.')
    }
  }

  useEffect(() => {
    fetchStatus()
    const iv = setInterval(fetchStatus, 2500)
    return () => clearInterval(iv)
  }, [])

  const handleDisconnect = async () => {
    try { await fetch('/wa-api/disconnect', { method: 'POST' }) }
    catch { /* ignore */ }
  }

  return (
    <div className="glass p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-base">WhatsApp Integration</h2>
          <p className="text-slate-500 text-xs mt-0.5">Connect your number to BizBuddy</p>
        </div>
        <StatusDot status={status} />
      </div>

      <div className="border-t border-white/[.07]" />

      {/* Body */}
      {status === 'loading' && (
        <p className="text-slate-600 text-sm text-center py-4">Checking connection...</p>
      )}

      {(status === 'offline' || status === 'disconnected') && (
        <div className="flex flex-col gap-4">
          <p className="text-slate-400 text-sm">
            {status === 'offline'
              ? 'The WhatsApp service is not running. Start it in a new terminal:'
              : 'Not connected. Start the WhatsApp service:'}
          </p>
          <div className="bg-black/40 border border-white/[.08] rounded-lg px-4 py-3 font-mono text-xs text-green-400 leading-loose">
            cd whatsapp-service<br />
            npm install<br />
            npm start
          </div>
          <button onClick={fetchStatus} className="btn-ghost text-center">Check Again</button>
        </div>
      )}

      {status === 'qr' && qr && (
        <div className="flex flex-col items-center gap-4">
          <div>
            <p className="text-white text-sm font-medium text-center mb-1">Scan with WhatsApp</p>
            <p className="text-slate-500 text-xs text-center">
              Open WhatsApp → Linked Devices → Link a Device
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl">
            <img src={qr} alt="WhatsApp QR Code" className="w-52 h-52 block" />
          </div>
          <p className="text-slate-600 text-xs text-center">QR refreshes automatically</p>
        </div>
      )}

      {status === 'connecting' && (
        <div className="text-center py-6">
          <p className="text-white text-sm font-medium mb-1">Connecting...</p>
          <p className="text-slate-500 text-xs">Authenticating with WhatsApp</p>
        </div>
      )}

      {status === 'connected' && number && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
            <div>
              <p className="text-green-400 text-sm font-semibold">Connected</p>
              <p className="text-slate-400 text-xs">+{number}</p>
            </div>
          </div>
          <p className="text-slate-500 text-xs">
            All incoming WhatsApp messages are being handled by your AI assistant automatically.
          </p>
          <button
            onClick={handleDisconnect}
            className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 rounded-lg py-2 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

function StatusDot({ status }) {
  const configs = {
    connected:   { color: 'bg-green-400', label: 'Connected' },
    qr:          { color: 'bg-yellow-400', label: 'Scan QR' },
    connecting:  { color: 'bg-yellow-400', label: 'Connecting' },
    disconnected:{ color: 'bg-slate-600', label: 'Disconnected' },
    offline:     { color: 'bg-red-500', label: 'Offline' },
    loading:     { color: 'bg-slate-600', label: '...' },
  }
  const c = configs[status] || configs.loading
  return (
    <div className="flex items-center gap-2 bg-white/[.05] border border-white/[.08] rounded-full px-3 py-1">
      <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
      <span className="text-xs text-slate-400 font-medium">{c.label}</span>
    </div>
  )
}
