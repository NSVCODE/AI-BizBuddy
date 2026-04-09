import React, { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../../services/api'
import { v4 as uuidv4 } from 'uuid'

const CHAT_CONFIGS = {
  restaurant: {
    emoji: '🍽️',
    aiName: 'Assistant',
    quickReplies: ['Book a table', 'See the menu', 'Opening hours', 'Do you have WiFi?'],
    greeting: (name) => `Hi there! I'm the AI assistant for ${name}. I can help with reservations, menu questions, or anything else. How can I help you today?`,
  },
  salon: {
    emoji: '✂️',
    aiName: 'Assistant',
    quickReplies: ['Book an appointment', 'Our services', 'Opening hours', 'Pricing'],
    greeting: (name) => `Hi there! I'm the AI assistant for ${name}. I can help you book an appointment, tell you about our services, or answer any questions. How can I help?`,
  },
  clinic: {
    emoji: '🩺',
    aiName: 'Assistant',
    quickReplies: ['Book a consultation', 'Our services', 'Opening hours', 'Contact us'],
    greeting: (name) => `Hi! I'm the AI assistant for ${name}. I can help you book a consultation or answer any questions. How can I help?`,
  },
  retail: {
    emoji: '🛍️',
    aiName: 'Assistant',
    quickReplies: ['Browse products', 'Opening hours', 'Contact us', 'Returns policy'],
    greeting: (name) => `Hi! I'm the AI assistant for ${name}. I can help you find products or answer any questions. How can I help?`,
  },
  service: {
    emoji: '🔧',
    aiName: 'Assistant',
    quickReplies: ['Book a service', 'Get a quote', 'Our services', 'Contact us'],
    greeting: (name) => `Hi! I'm the AI assistant for ${name}. I can help you book a service or get a quote. How can I help?`,
  },
  other: {
    emoji: '💬',
    aiName: 'Assistant',
    quickReplies: ['Get in touch', 'Our services', 'Opening hours', 'Contact us'],
    greeting: (name) => `Hi! I'm the AI assistant for ${name}. How can I help you today?`,
  },
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '4px', padding: '12px 16px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: '8px', height: '8px',
          background: 'var(--blue-light)',
          borderRadius: '50%',
          display: 'inline-block',
          animation: `bounce-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  const renderContent = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g)
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)
  }

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '10px', animation: 'fadeInUp 0.25s ease-out' }}>
      {!isUser && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', marginRight: '8px', flexShrink: 0, alignSelf: 'flex-end',
        }}>
          {msg.emoji || '💬'}
        </div>
      )}
      <div style={{
        maxWidth: '75%', padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)' : 'white',
        color: isUser ? 'white' : 'var(--gray-800)',
        fontSize: '14px', lineHeight: '1.55', boxShadow: 'var(--shadow-sm)', whiteSpace: 'pre-wrap',
      }}>
        {renderContent(msg.content)}
        <div style={{ fontSize: '10px', color: isUser ? 'rgba(255,255,255,0.6)' : 'var(--gray-400)', marginTop: '4px', textAlign: 'right' }}>
          {msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

export default function ChatWindow({ onNewMessage }) {
  const [business, setBusiness] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `web_${uuidv4().slice(0, 12)}`)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    const user = params.get('user')
    const query = id ? `?id=${id}` : user ? `?user_id=${user}` : ''
    fetch(`/api/business/profile${query}`)
      .then(r => r.json())
      .then(data => {
        setBusiness(data)
        const cfg = CHAT_CONFIGS[data?.type] || CHAT_CONFIGS.other
        setMessages([{
          id: 'init',
          role: 'assistant',
          content: cfg.greeting(data?.name || 'us'),
          emoji: cfg.emoji,
          time: new Date(),
        }])
      })
      .catch(() => {
        setMessages([{
          id: 'init',
          role: 'assistant',
          content: "Hi! I'm your AI assistant. How can I help you today?",
          emoji: '💬',
          time: new Date(),
        }])
      })
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isLoading])
  useEffect(() => { inputRef.current?.focus() }, [])

  const cfg = CHAT_CONFIGS[business?.type] || CHAT_CONFIGS.other

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim()
    if (!text || isLoading) return

    const userMsg = { id: uuidv4(), role: 'user', content: text, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const data = await sendMessage(sessionId, text, 'web_chat')
      const aiMsg = { id: uuidv4(), role: 'assistant', content: data.reply, emoji: cfg.emoji, time: new Date() }
      setMessages(prev => [...prev, aiMsg])
      onNewMessage?.()
    } catch {
      setMessages(prev => [...prev, {
        id: uuidv4(), role: 'assistant',
        content: "Sorry, I'm having a moment — please try again in a second.",
        emoji: cfg.emoji, time: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div style={{
      position: 'fixed', bottom: '108px', right: '28px',
      width: '380px', height: '560px',
      background: 'var(--off-white)', borderRadius: '24px',
      boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', zIndex: 9998,
      animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      border: '1px solid var(--beige-dark)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)',
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
        }}>
          {cfg.emoji}
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: '600', fontSize: '16px', fontFamily: 'var(--font-display)' }}>
            {business?.name || 'AI Assistant'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6EE7B7', display: 'inline-block' }} />
            AI Assistant · Always here to help
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
            }}>{cfg.emoji}</div>
            <div style={{ background: 'white', borderRadius: '18px 18px 18px 4px', boxShadow: 'var(--shadow-sm)' }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {messages.length <= 1 && (
        <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--beige)' }}>
          {cfg.quickReplies.map(q => (
            <button key={q} onClick={() => handleSend(q)} style={{
              padding: '5px 12px', borderRadius: '20px', background: 'var(--beige)',
              color: 'var(--brown)', fontSize: '12px', fontWeight: '500',
              border: '1px solid var(--beige-dark)', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
            onMouseOver={e => e.target.style.background = 'var(--yellow)'}
            onMouseOut={e => e.target.style.background = 'var(--beige)'}
            >{q}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--beige)', display: 'flex', gap: '8px', background: 'white', flexShrink: 0 }}>
        <textarea
          ref={inputRef} value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: '20px',
            border: '1.5px solid var(--beige-dark)', background: 'var(--off-white)',
            color: 'var(--gray-800)', fontSize: '14px', resize: 'none',
            lineHeight: '1.4', maxHeight: '80px', overflow: 'auto', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--beige-dark)'}
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: input.trim() && !isLoading ? 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)' : 'var(--gray-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', flexShrink: 0, alignSelf: 'flex-end', border: 'none', cursor: 'pointer',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
