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

client.on('message', async (message) => {
  // Ignore group messages and status updates
  if (message.isGroupMsg || message.from === 'status@broadcast') return

  const phone = message.from.replace('@c.us', '')
  const sessionId = `wa_${phone.replace(/\D/g, '')}`

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
