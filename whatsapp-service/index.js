const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode')
const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
app.use(cors())
app.use(express.json())

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'
const PORT = process.env.PORT || 3001

let qrCodeData = null
let status = 'disconnected' // 'qr' | 'connecting' | 'connected' | 'disconnected'
let connectedNumber = null

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
})

client.on('qr', async (qr) => {
  status = 'qr'
  qrCodeData = await qrcode.toDataURL(qr)
  console.log('[BizBuddy] QR code ready — scan with WhatsApp on your phone')
})

client.on('loading_screen', () => {
  status = 'connecting'
  console.log('[BizBuddy] Connecting to WhatsApp...')
})

client.on('authenticated', () => {
  status = 'connecting'
  console.log('[BizBuddy] Authenticated')
})

client.on('ready', () => {
  status = 'connected'
  qrCodeData = null
  connectedNumber = client.info.wid.user
  console.log(`[BizBuddy] WhatsApp connected: +${connectedNumber}`)
})

client.on('disconnected', (reason) => {
  status = 'disconnected'
  connectedNumber = null
  qrCodeData = null
  console.log('[BizBuddy] Disconnected:', reason)
})

client.on('call', async (call) => {
  const from = call.from
  console.log(`[BizBuddy] Incoming call from ${from} — rejecting and sending auto-reply`)

  try { await call.reject() } catch (e) {
    console.warn('[BizBuddy] call.reject() failed (non-fatal):', e.message)
  }

  // Wait for WhatsApp to finish processing the rejection before sending a message
  await new Promise(resolve => setTimeout(resolve, 1500))

  try {
    await client.sendMessage(
      from,
      "Sorry we couldn't attend your call, I'm happy to help you over text! Please let me know how I may assist you"
    )
    console.log(`[BizBuddy] Call auto-reply sent to ${from}`)
  } catch (err) {
    console.error('[BizBuddy] Call auto-reply send error:', err.message)
  }
})

// ── Follow-up message logic ───────────────────────────────────────────────────
// If a customer asks about services but doesn't book, send a nudge after 10s

const pendingFollowUps = new Map() // phone → timeout handle

const SERVICE_INQUIRY_KEYWORDS = [
  'service', 'services', 'price', 'prices', 'pricing', 'cost', 'how much',
  'menu', 'offer', 'available', 'appointment', 'book', 'session', 'treatment',
  'haircut', 'facial', 'massage', 'manicure', 'pedicure', 'colour', 'color',
  'consult', 'consultation', 'package', 'deal', 'hour', 'time', 'slot',
]

function looksLikeServiceInquiry(text) {
  const lower = text.toLowerCase()
  return SERVICE_INQUIRY_KEYWORDS.some(kw => lower.includes(kw))
}

function looksLikeBookingConfirmed(text) {
  const lower = text.toLowerCase()
  return (
    lower.includes('confirm') ||
    lower.includes('booking confirmed') ||
    lower.includes('appointment confirmed') ||
    lower.includes('booked') ||
    lower.includes('reservation')
  )
}

client.on('message', async (message) => {
  // Ignore group messages and status updates
  if (message.isGroupMsg || message.from === 'status@broadcast') return

  // Detect missed/rejected calls via call_log system message
  if (message.type === 'call_log') {
    const phone = message.from.replace('@c.us', '')
    console.log(`[BizBuddy] Missed call detected from +${phone} — sending auto-reply`)
    try {
      await client.sendMessage(
        message.from,
        "Sorry we couldn't attend your call, I'm happy to help you over text! Please let me know how I may assist you"
      )
      console.log(`[BizBuddy] Missed call auto-reply sent to +${phone}`)
    } catch (err) {
      console.error('[BizBuddy] Missed call auto-reply error:', err.message)
    }
    return
  }

  const phone = message.from.replace('@c.us', '')
  const sessionId = `wa_${phone.replace(/\D/g, '')}`

  // Any new message from this customer cancels pending follow-up
  if (pendingFollowUps.has(phone)) {
    clearTimeout(pendingFollowUps.get(phone))
    pendingFollowUps.delete(phone)
  }

  console.log(`[BizBuddy] Message from +${phone}: ${message.body}`)

  try {
    const response = await axios.post(`${FASTAPI_URL}/api/whatsapp/incoming`, {
      phone,
      message: message.body,
      session_id: sessionId,
    })

    const reply = response.data.reply
    await client.sendMessage(message.from, reply)
    console.log(`[BizBuddy] Reply sent to +${phone}`)

    // Schedule follow-up if the AI's reply mentions services but no booking yet
    const shouldFollowUp =
      looksLikeServiceInquiry(message.body) && !looksLikeBookingConfirmed(reply)

    if (shouldFollowUp) {
      const handle = setTimeout(async () => {
        pendingFollowUps.delete(phone)
        const followUp =
          "Just checking in — were you able to find what you were looking for? I'd love to help you book an appointment or answer any questions! 😊"
        try {
          await client.sendMessage(message.from, followUp)
          console.log(`[BizBuddy] Follow-up sent to +${phone}`)
        } catch (err) {
          console.error('[BizBuddy] Follow-up send error:', err.message)
        }
      }, 10_000) // 10 seconds for demo

      pendingFollowUps.set(phone, handle)
      console.log(`[BizBuddy] Follow-up scheduled for +${phone} in 10s`)
    }
  } catch (err) {
    console.error('[BizBuddy] Error processing message:', err.message)
  }
})

client.initialize()

// ── API Endpoints ─────────────────────────────────────────────────────────────

app.get('/status', (req, res) => {
  res.json({ status, qr: qrCodeData, number: connectedNumber })
})

app.post('/disconnect', async (req, res) => {
  try {
    await client.destroy()
    status = 'disconnected'
    connectedNumber = null
    qrCodeData = null
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`[BizBuddy] WhatsApp service running on http://localhost:${PORT}`)
})
