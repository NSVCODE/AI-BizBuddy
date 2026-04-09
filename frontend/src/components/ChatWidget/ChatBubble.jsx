import React, { useState, useEffect } from 'react'

const TYPE_EMOJI = {
  restaurant: '🍽️',
  salon: '✂️',
  clinic: '🩺',
  retail: '🛍️',
  service: '🔧',
  other: '💬',
}

export default function ChatBubble({ onClick, isOpen, unreadCount }) {
  const [emoji, setEmoji] = useState('💬')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    const user = params.get('user')
    const query = id ? `?id=${id}` : user ? `?user_id=${user}` : ''
    fetch(`/api/business/profile${query}`)
      .then(r => r.json())
      .then(data => setEmoji(TYPE_EMOJI[data?.type] || '💬'))
      .catch(() => {})
  }, [])

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed', bottom: '28px', right: '28px',
        width: '64px', height: '64px', borderRadius: '50%',
        background: isOpen ? 'var(--brown)' : 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)',
        boxShadow: '0 4px 20px rgba(37,99,235,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: isOpen ? 'scale(0.92)' : 'scale(1)',
        border: 'none', cursor: 'pointer',
      }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {!isOpen && unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: '-4px', right: '-4px',
          background: 'var(--yellow)', color: 'var(--brown)',
          borderRadius: '50%', width: '22px', height: '22px',
          fontSize: '11px', fontWeight: '700',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid white',
        }}>
          {unreadCount}
        </span>
      )}
      {isOpen ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <span style={{ fontSize: '28px', lineHeight: 1 }}>{emoji}</span>
      )}
    </button>
  )
}
