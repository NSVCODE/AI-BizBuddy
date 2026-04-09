import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TYPES = [
  { id: 'restaurant', label: 'Restaurant / Café', desc: 'Dine-in, takeaway, reservations' },
  { id: 'salon', label: 'Salon / Spa', desc: 'Appointments, services, beauty' },
  { id: 'clinic', label: 'Clinic / Healthcare', desc: 'Consultations, appointments' },
  { id: 'retail', label: 'Retail Store', desc: 'Products, inventory, orders' },
  { id: 'service', label: 'Service Provider', desc: 'Repairs, installations, home services' },
  { id: 'other', label: 'Other', desc: 'Any other type of business' },
]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [form, setForm] = useState({ name: '', location: '', phone: '', email: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) { setError('Business name and phone are required.'); return }
    setLoading(true); setError('')
    try {
      const { error } = await supabase.from('businesses').insert({
        user_id: user.id, type: selectedType,
        name: form.name, location: form.location,
        phone: form.phone, email: form.email, description: form.description,
      })
      if (error) throw error
      setStep(3)
      setTimeout(() => navigate('/dashboard'), 1800)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080C18] flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-96 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className={`w-full relative ${step === 1 ? 'max-w-2xl' : 'max-w-md'}`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <img src="/BizBuddy_Logo.png" alt="BizBuddy" className="h-8 w-auto" />
            <span className="text-blue-500 text-xs font-semibold tracking-widest uppercase">Setup</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
            {step === 1 && 'What kind of business do you run?'}
            {step === 2 && 'Tell us about your business'}
            {step === 3 && "You're all set!"}
          </h1>
          <p className="text-slate-500 text-sm">
            {step === 1 && 'BizBuddy will tailor your AI to your industry.'}
            {step === 2 && 'This helps your AI give accurate info to customers.'}
            {step === 3 && 'Redirecting to your dashboard...'}
          </p>
        </div>

        {/* Progress */}
        {step < 3 && (
          <div className="flex gap-1.5 mb-8">
            {[1, 2].map(s => (
              <div key={s} className={`h-0.5 w-8 rounded-full transition-colors ${s <= step ? 'bg-blue-500' : 'bg-white/10'}`} />
            ))}
          </div>
        )}

        {/* Step 1 — Type selection */}
        {step === 1 && (
          <div className="grid grid-cols-3 gap-3">
            {TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { setSelectedType(type.id); setStep(2) }}
                className="glass p-5 text-left transition-all hover:bg-white/[.08] hover:border-blue-500/40 group"
              >
                <div className="font-semibold text-sm text-white mb-1 group-hover:text-blue-300 transition-colors">
                  {type.label}
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">{type.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Details form */}
        {step === 2 && (
          <div className="glass p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[.08]">
              <span className="text-sm font-semibold text-white">
                {TYPES.find(t => t.id === selectedType)?.label}
              </span>
              <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-blue-400 transition-colors">
                Change
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Business Name *" name="name" placeholder="e.g. LatteLune Café" value={form.name} onChange={handleChange} required />
              <Field label="Location / Address" name="location" placeholder="e.g. Indiranagar, Bengaluru" value={form.location} onChange={handleChange} />
              <Field label="Phone Number *" name="phone" placeholder="e.g. +91 98765 43210" value={form.phone} onChange={handleChange} required />
              <Field label="Business Email" name="email" type="email" placeholder="e.g. hello@yourbusiness.com" value={form.email} onChange={handleChange} />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Short Description</label>
                <textarea
                  name="description" value={form.description} onChange={handleChange}
                  placeholder="What makes your business special..."
                  rows={3}
                  className="input-dark resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary mt-2">
                {loading ? 'Setting up...' : 'Launch My BizBuddy'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="glass p-12 text-center backdrop-blur-sm">
            <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{form.name} is live on BizBuddy</h2>
            <p className="text-slate-500 text-sm">Taking you to your dashboard...</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 mt-6">
          <span className="text-xs text-slate-700">Powered by</span>
          <img src="/BizBuddy_Logo.png" alt="BizBuddy" className="h-4 w-auto opacity-50" />
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required} className="input-dark"
      />
    </div>
  )
}
