import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ChatWidget from '../components/ChatWidget'

const TYPE_CONFIG = {
  restaurant: {
    tagline: 'Great food, warm vibes, unforgettable moments',
    features: ['Dine-in & Takeaway', 'Table Reservations', 'Private Events', 'Fresh Daily Menu'],
    cta: 'Reserve a Table',
    stat1: ['Menu Items', 'Fresh daily'],
    stat2: ['Private Events', 'Up to 30 guests'],
    stat3: ['Open Daily', 'Check hours'],
    stat4: ['Reservations', 'Book instantly'],
  },
  salon: {
    tagline: 'Look good, feel great — every single visit',
    features: ['Hair & Beauty', 'Appointment Booking', 'Expert Stylists', 'Premium Products'],
    cta: 'Book an Appointment',
    stat1: ['Services', 'Hair, skin & more'],
    stat2: ['Expert Staff', 'Trained professionals'],
    stat3: ['Walk-ins', 'Welcome anytime'],
    stat4: ['Appointments', 'Book instantly'],
  },
  clinic: {
    tagline: 'Your health, our priority — compassionate care always',
    features: ['Consultations', 'Appointment Booking', 'Expert Doctors', 'Quick Response'],
    cta: 'Book a Consultation',
    stat1: ['Specialists', 'Experienced doctors'],
    stat2: ['Consultations', 'In-person & online'],
    stat3: ['Quick Booking', 'Same-day slots'],
    stat4: ['24/7 Support', 'AI assistant'],
  },
  retail: {
    tagline: 'Quality products, exceptional service — every time',
    features: ['Wide Selection', 'Quick Enquiries', 'Order Support', 'Easy Returns'],
    cta: 'Browse Products',
    stat1: ['Products', 'Curated selection'],
    stat2: ['Fast Delivery', 'Quick turnaround'],
    stat3: ['Easy Returns', 'Hassle-free'],
    stat4: ['Support', 'Always available'],
  },
  service: {
    tagline: 'Reliable, professional service — done right the first time',
    features: ['Home Services', 'Quick Booking', 'Certified Pros', 'Same-day Slots'],
    cta: 'Book a Service',
    stat1: ['Services', 'Repairs & installs'],
    stat2: ['Certified', 'Trained professionals'],
    stat3: ['Same-day', 'Quick slots'],
    stat4: ['Support', 'Always available'],
  },
  other: {
    tagline: 'Your trusted local business — always here to help',
    features: ['Quick Enquiries', 'Appointment Booking', 'Expert Help', '24/7 AI Chat'],
    cta: 'Get in Touch',
    stat1: ['Services', 'Tailored for you'],
    stat2: ['Expert Staff', 'Always ready'],
    stat3: ['Bookings', 'Book instantly'],
    stat4: ['AI Support', '24/7 available'],
  },
}

export default function Home() {
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/business/profile')
      .then(r => r.json())
      .then(data => { setBusiness(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const cfg = TYPE_CONFIG[business?.type] || TYPE_CONFIG.other
  const name = business?.name || 'Our Business'
  const description = business?.description || 'Welcome! Chat with our AI assistant to book appointments, ask questions, or get help with anything you need.'
  const location = business?.location || ''
  const phone = business?.phone || ''
  const email = business?.email || ''

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--white)' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'var(--white)',
        borderBottom: '1px solid var(--border)',
        padding: '0 48px',
        display: 'flex', alignItems: 'center', height: '64px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--navy)', fontWeight: '700', letterSpacing: '-0.5px' }}>
          {name}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => document.querySelector('[aria-label="Open chat"]')?.click()}
            style={{
              padding: '8px 20px', borderRadius: '8px',
              background: 'var(--navy)', color: 'white',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              border: 'none', transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--navy-light)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--navy)'}
          >
            {cfg.cta}
          </button>
          <Link to="/auth" style={{
            padding: '8px 16px', borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '13px', border: '1px solid var(--border)',
            textDecoration: 'none',
          }}>Admin</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        background: 'var(--white)',
        display: 'flex',
        alignItems: 'center',
        padding: '100px 48px 60px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '60px' }}>
          <div style={{ maxWidth: '560px' }}>
            {location && (
              <div style={{
                display: 'inline-block',
                background: 'var(--subtle)',
                color: 'var(--navy)',
                padding: '5px 14px', borderRadius: '6px',
                fontSize: '12px', fontWeight: '600', marginBottom: '24px',
                letterSpacing: '0.05em', textTransform: 'uppercase',
                border: '1px solid var(--border)',
              }}>
                {location}
              </div>
            )}

            <h1 style={{
              fontSize: '54px', lineHeight: '1.1',
              color: 'var(--navy)', marginBottom: '20px',
              fontWeight: '700', letterSpacing: '-1px',
              fontFamily: 'var(--font-display)',
            }}>
              {name}
            </h1>

            <p style={{
              fontSize: '17px', color: 'var(--navy-muted)', lineHeight: '1.1',
              marginBottom: '12px', fontWeight: '500',
            }}>
              {cfg.tagline}
            </p>

            <p style={{
              fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.7',
              marginBottom: '36px', maxWidth: '460px',
            }}>
              {description}
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => document.querySelector('[aria-label="Open chat"]')?.click()}
                style={{
                  padding: '13px 30px', borderRadius: '8px',
                  background: 'var(--navy)',
                  color: 'white', fontSize: '15px', fontWeight: '600',
                  cursor: 'pointer', transition: 'background 0.2s',
                  border: 'none',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--navy-light)'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--navy)'}
              >
                {cfg.cta}
              </button>
              <button
                onClick={() => document.querySelector('[aria-label="Open chat"]')?.click()}
                style={{
                  padding: '13px 30px', borderRadius: '8px',
                  background: 'white', color: 'var(--navy)',
                  fontSize: '15px', fontWeight: '600',
                  border: '1.5px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                Chat with Us
              </button>
            </div>

            {phone && (
              <div style={{
                marginTop: '40px', display: 'inline-flex', alignItems: 'center', gap: '8px',
                color: 'var(--text-secondary)', fontSize: '13px',
              }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)' }} />
                {phone}{location ? ` · ${location}` : ''}
              </div>
            )}
          </div>

          {/* Right — feature cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexShrink: 0 }}>
            {[cfg.stat1, cfg.stat2, cfg.stat3, cfg.stat4].map(([label, sub], i) => (
              <div key={i} style={{
                width: '160px', height: '140px',
                borderRadius: '12px',
                background: i % 2 === 0 ? 'var(--navy)' : 'var(--subtle)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', justifyContent: 'flex-end',
                padding: '18px',
                transform: i % 2 === 0 ? 'translateY(0)' : 'translateY(16px)',
                boxShadow: 'var(--shadow-md)',
              }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: i % 2 === 0 ? 'white' : 'var(--navy)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '11px', color: i % 2 === 0 ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)', lineHeight: 1.3 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section style={{
        background: 'var(--navy)', color: 'white',
        padding: '18px 48px',
        display: 'flex', justifyContent: 'center', gap: '48px',
        flexWrap: 'wrap',
      }}>
        {cfg.features.map(label => (
          <div key={label} style={{ fontSize: '13px', fontWeight: '500', opacity: 0.85 }}>{label}</div>
        ))}
      </section>

      {/* Contact Section */}
      {(phone || email || location) && (
        <section style={{ padding: '88px 48px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Find Us
            </div>
            <h2 style={{ fontSize: '38px', color: 'var(--navy)', fontWeight: '700', letterSpacing: '-0.5px', fontFamily: 'var(--font-display)' }}>
              Come say hello
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px', fontSize: '16px' }}>
              Or chat with our AI assistant for instant help.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              location && { title: 'Address', detail: location },
              phone    && { title: 'Phone',   detail: phone },
              email    && { title: 'Email',   detail: email },
            ].filter(Boolean).map(card => (
              <div key={card.title} style={{
                background: 'var(--white)', borderRadius: 'var(--radius-md)',
                padding: '28px 32px', minWidth: '200px',
                boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontWeight: '700', color: 'var(--navy)', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.title}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: '1.6' }}>{card.detail}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        background: 'var(--navy)', color: 'rgba(255,255,255,0.5)',
        padding: '28px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '13px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '15px', fontFamily: 'var(--font-display)' }}>{name}</span>
          <span style={{ marginLeft: '16px' }}>© 2026</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/auth" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Admin</Link>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>
            Powered by <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>BizBuddy</span>
          </span>
        </div>
      </footer>

      <ChatWidget />
    </div>
  )
}
