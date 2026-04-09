const { IgApiClient } = require('instagram-private-api')
const axios = require('axios')
const express = require('express')
require('dotenv').config()

const app = express()
app.use(express.json())

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'
const PORT = process.env.IG_PORT || 3002
const IG_USERNAME = process.env.IG_USERNAME
const IG_PASSWORD = process.env.IG_PASSWORD

const ig = new IgApiClient()
const processedMessages = new Set()
let status = 'disconnected'
let connectedUsername = null

async function startInstagram() {
  if (!IG_USERNAME || !IG_PASSWORD) {
    console.log('[BizBuddy-IG] No IG_USERNAME/IG_PASSWORD set in .env — service idle')
    status = 'no_credentials'
    return
  }

  try {
    ig.state.generateDevice(IG_USERNAME)
    await ig.account.login(IG_USERNAME, IG_PASSWORD)
    connectedUsername = IG_USERNAME
    status = 'connected'
    console.log(`[BizBuddy-IG] Connected as @${IG_USERNAME}`)

    // Seed already-seen messages so we don't reply to old DMs on startup
    await seedExistingMessages()

    // Poll inbox every 6 seconds
    setInterval(pollInbox, 6000)
  } catch (err) {
    status = 'error'
    console.error('[BizBuddy-IG] Login failed:', err.message)
  }
}

async function seedExistingMessages() {
  try {
    const feed = ig.feed.directInbox()
    const threads = await feed.items()
    for (const thread of threads) {
      if (thread.items?.[0]) {
        processedMessages.add(thread.items[0].item_id)
      }
    }
    console.log(`[BizBuddy-IG] Seeded ${processedMessages.size} existing messages`)
  } catch (err) {
    console.error('[BizBuddy-IG] Seed error:', err.message)
  }
}

async function pollInbox() {
  try {
    const feed = ig.feed.directInbox()
    const threads = await feed.items()

    for (const thread of threads) {
      const latestItem = thread.items?.[0]
      if (!latestItem) continue
      if (processedMessages.has(latestItem.item_id)) continue

      // Only reply to text messages from others (not our own messages)
      const isOwnMessage = String(latestItem.user_id) === String(thread.viewer_id)
      if (isOwnMessage) {
        processedMessages.add(latestItem.item_id)
        continue
      }

      // Only handle text messages for now
      if (latestItem.item_type !== 'text') {
        processedMessages.add(latestItem.item_id)
        continue
      }

      processedMessages.add(latestItem.item_id)

      const messageText = latestItem.text || ''
      const senderId = String(latestItem.user_id)
      const threadId = thread.thread_id
      const senderUsername = thread.users?.[0]?.username || senderId

      console.log(`[BizBuddy-IG] DM from @${senderUsername}: ${messageText}`)

      try {
        // Send to FastAPI for AI reply (reuses WhatsApp incoming endpoint)
        const response = await axios.post(`${FASTAPI_URL}/api/whatsapp/incoming`, {
          phone: `ig_${senderId}`,
          message: messageText,
          session_id: `ig_${threadId}`,
        })

        const reply = response.data.reply
        const threadEntity = ig.entity.directThread(threadId)
        await threadEntity.broadcastText(reply)
        console.log(`[BizBuddy-IG] Reply sent to @${senderUsername}`)
      } catch (replyErr) {
        console.error(`[BizBuddy-IG] Failed to reply to @${senderUsername}:`, replyErr.message)
      }
    }
  } catch (err) {
    if (err.message?.includes('login_required')) {
      status = 'disconnected'
      console.error('[BizBuddy-IG] Session expired — restart service to reconnect')
    } else {
      console.error('[BizBuddy-IG] Poll error:', err.message)
    }
  }
}

// ── API Endpoints ─────────────────────────────────────────────────────────────

app.get('/status', (req, res) => {
  res.json({ status, username: connectedUsername })
})

app.listen(PORT, () => {
  console.log(`[BizBuddy-IG] Instagram service running on http://localhost:${PORT}`)
  startInstagram()
})
