import React, { useState } from 'react'
import { getMessages } from '../../services/api'

export default function ConversationsPanel({ conversations, loading }) {
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [msgLoading, setMsgLoading] = useState(false)

  const handleSelect = async (conv) => {
    if (selected?.id === conv.id) { setSelected(null); return }
    setSelected(conv)
    setMsgLoading(true)
    try { setMessages(await getMessages(conv.session_id)) }
    catch { setMessages([]) }
    finally { setMsgLoading(false) }
  }

  if (loading) return <div className="py-10 text-center text-sm text-slate-600">Loading...</div>
  if (!conversations?.length) return <div className="py-10 text-center text-sm text-slate-600">No conversations yet.</div>

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* List */}
      <div className="w-72 shrink-0 flex flex-col gap-1 overflow-y-auto">
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => handleSelect(conv)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
              selected?.id === conv.id
                ? 'bg-blue-600/15 border-blue-500/25 text-white'
                : 'glass hover:bg-white/[.06] text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold capitalize">
                {conv.channel === 'whatsapp' ? 'WhatsApp' : 'Web Chat'}
              </span>
              <span className="text-xs text-slate-600">
                {new Date(conv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div className="text-xs text-slate-500 truncate">
              {conv.last_message || 'No messages'}
            </div>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 glass overflow-y-auto p-4">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-600">
            Select a conversation to view messages
          </div>
        ) : msgLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-600">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-600">No messages found.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600/80 text-white rounded-br-sm'
                    : 'bg-white/[.07] text-slate-300 rounded-bl-sm'
                }`}>
                  {msg.content}
                  <div className="text-xs opacity-50 mt-1 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
