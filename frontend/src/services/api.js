import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Chat
export const sendMessage = (session_id, message, channel = 'web_chat', business_id = null) =>
  api.post('/api/chat', { session_id, message, channel, ...(business_id && { business_id }) }).then(r => r.data)

export const getConversations = () =>
  api.get('/api/chat/conversations').then(r => r.data)

export const getMessages = (session_id) =>
  api.get(`/api/chat/conversations/${session_id}/messages`).then(r => r.data)

// Leads
export const getLeads = (business_id) =>
  api.get('/api/leads', { params: business_id ? { business_id } : {} }).then(r => r.data)

export const updateLead = (id, data) =>
  api.patch(`/api/leads/${id}`, data).then(r => r.data)

export const deleteLead = (id) =>
  api.delete(`/api/leads/${id}`).then(r => r.data)

// Bookings
export const getBookings = (business_id) =>
  api.get('/api/bookings', { params: business_id ? { business_id } : {} }).then(r => r.data)

export const updateBookingStatus = (id, status) =>
  api.patch(`/api/bookings/${id}/status`, { status }).then(r => r.data)

export const cancelBooking = (id) =>
  api.delete(`/api/bookings/${id}`).then(r => r.data)

// WhatsApp simulation
export const simulateWhatsApp = (phone, message, session_id = null) =>
  api.post('/api/whatsapp/simulate', { phone, message, session_id }).then(r => r.data)

export const simulateMissedCall = (phone, caller_name = null) =>
  api.post('/api/whatsapp/missed-call', { phone, caller_name }).then(r => r.data)

// Analytics
export const getAnalytics = () =>
  api.get('/api/analytics/summary').then(r => r.data)

export const getAnalyticsDetailed = () =>
  api.get('/api/analytics/detailed').then(r => r.data)

export const seedDemoData = (business_id, type) =>
  api.post('/api/business/seed-demo', { business_id, type }).then(r => r.data)

// FAQs
export const getFAQs = (business_id) =>
  api.get('/api/faqs', { params: business_id ? { business_id } : {} }).then(r => r.data)

export const createFAQ = (question, answer, business_id) =>
  api.post('/api/faqs', { question, answer, business_id }).then(r => r.data)

export const updateFAQ = (id, data) =>
  api.put(`/api/faqs/${id}`, data).then(r => r.data)

export const deleteFAQ = (id) =>
  api.delete(`/api/faqs/${id}`).then(r => r.data)

// Business profile
export const getBusinessProfile = () =>
  api.get('/api/business/profile').then(r => r.data)

export const updateBusinessProfile = (data) =>
  api.put('/api/business/profile', data).then(r => r.data)

export default api
