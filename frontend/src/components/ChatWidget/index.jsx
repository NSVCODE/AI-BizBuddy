import React, { useState } from 'react'
import ChatBubble from './ChatBubble'
import ChatWindow from './ChatWindow'

export default function ChatWidget({ businessId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [unread, setUnread] = useState(1) // start with 1 to draw attention

  const handleOpen = () => {
    setIsOpen(true)
    setUnread(0)
  }

  return (
    <>
      {isOpen && <ChatWindow onNewMessage={() => {}} businessId={businessId} />}
      <ChatBubble
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        isOpen={isOpen}
        unreadCount={unread}
      />
    </>
  )
}
