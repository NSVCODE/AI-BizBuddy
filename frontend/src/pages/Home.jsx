import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import ChatWidget from '../components/ChatWidget'

const MENU_ITEMS = [
  { name: 'Signature LatteLune Latte', price: '220', tag: 'Fan Favourite' },
  { name: 'Iced Matcha Latte', price: '250', tag: 'Bestseller' },
  { name: 'Blue Butterfly Lemonade', price: '220', tag: 'Aesthetic' },
  { name: 'Waffle Stack', price: '320', tag: 'Must Try' },
  { name: 'Avocado Toast', price: '280', tag: 'Healthy' },
  { name: 'Lotus Biscoff Cheesecake', price: '260', tag: 'Dreamy' },
]

export default function Home() {
  const [activeNav, setActiveNav] = useState('home')

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setActiveNav(id)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--navy)', fontWeight: '700', letterSpacing: '-0.5px' }}>
            LatteLune
          </span>
        </div>

        <div style={{ marginLeft: '48px', display: 'flex', gap: '4px' }}>
          {[['home', 'Home'], ['menu', 'Menu'], ['about', 'About'], ['contact', 'Contact']].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              padding: '7px 16px', borderRadius: '6px',
              background: 'transparent',
              color: activeNav === id ? 'var(--navy)' : 'var(--text-secondary)',
              fontSize: '14px', fontWeight: activeNav === id ? '600' : '400',
              cursor: 'pointer', transition: 'color 0.2s',
            }}>{label}</button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => scrollTo('menu')}
            style={{
              padding: '8px 20px', borderRadius: '8px',
              background: 'var(--navy)', color: 'white',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--navy-light)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--navy)'}
          >
            Reserve a Table
          </button>
          <Link to="/dashboard" style={{
            padding: '8px 16px', borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '13px', border: '1px solid var(--border)',
          }}>Admin</Link>
        </div>
      </nav>

      {/* Hero */}
      <section id="home" style={{
        minHeight: '100vh',
        background: 'var(--white)',
        display: 'flex',
        alignItems: 'center',
        padding: '100px 48px 60px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '60px' }}>
          <div style={{ maxWidth: '560px' }}>
            <div style={{
              display: 'inline-block',
              background: 'var(--subtle)',
              color: 'var(--navy)',
              padding: '5px 14px', borderRadius: '6px',
              fontSize: '12px', fontWeight: '600', marginBottom: '24px',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              border: '1px solid var(--border)',
            }}>
              Now open in Indiranagar, Bengaluru
            </div>

            <h1 style={{
              fontSize: '54px', lineHeight: '1.1',
              color: 'var(--navy)', marginBottom: '20px',
              fontWeight: '700', letterSpacing: '-1px',
            }}>
              Where every sip<br />
              <span style={{ color: 'var(--navy-muted)' }}>feels like moonlight</span>
            </h1>

            <p style={{
              fontSize: '17px', color: 'var(--text-secondary)', lineHeight: '1.7',
              marginBottom: '36px', maxWidth: '460px',
            }}>
              A cozy aesthetic café in the heart of Bengaluru.
              Artisan coffee, dreamy interiors, and baked goods made fresh daily.
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
                Reserve a Table
              </button>
              <button
                onClick={() => scrollTo('menu')}
                style={{
                  padding: '13px 30px', borderRadius: '8px',
                  background: 'white', color: 'var(--navy)',
                  fontSize: '15px', fontWeight: '600',
                  border: '1.5px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                View Menu
              </button>
            </div>

            <div style={{
              marginTop: '40px', display: 'inline-flex', alignItems: 'center', gap: '8px',
              color: 'var(--text-secondary)', fontSize: '13px',
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)' }} />
              Open today · 8:00 AM – 10:00 PM · Indiranagar, Bengaluru
            </div>
          </div>

          {/* Right — stat cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
            flexShrink: 0,
          }}>
            {[
              { label: 'Artisan Coffee', sub: 'Hand-crafted daily' },
              { label: 'Fresh Bakes', sub: 'From scratch every morning' },
              { label: 'Cozy Interiors', sub: 'Work or unwind' },
              { label: 'Aesthetic Drinks', sub: 'Instagram-worthy' },
            ].map((card, i) => (
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
                <div style={{ fontWeight: '700', fontSize: '13px', color: i % 2 === 0 ? 'white' : 'var(--navy)', marginBottom: '4px' }}>{card.label}</div>
                <div style={{ fontSize: '11px', color: i % 2 === 0 ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)', lineHeight: 1.3 }}>{card.sub}</div>
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
        {['Free WiFi', 'Pet Friendly', 'Live Music Weekends', 'Private Events', 'LunaStars Loyalty'].map(label => (
          <div key={label} style={{ fontSize: '13px', fontWeight: '500', opacity: 0.85 }}>
            {label}
          </div>
        ))}
      </section>

      {/* Menu Section */}
      <section id="menu" style={{ padding: '88px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Our Menu
          </div>
          <h2 style={{ fontSize: '38px', color: 'var(--navy)', fontWeight: '700', letterSpacing: '-0.5px' }}>Crafted with care</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px', fontSize: '16px' }}>
            Every item is made fresh daily — no compromises, no shortcuts.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {MENU_ITEMS.map((item) => (
            <div key={item.name} style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border)',
              transition: 'all 0.2s',
              cursor: 'default',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--navy)' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--navy)' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy)', flexShrink: 0 }}>
                  ₹{item.price}
                </div>
              </div>
              <span style={{
                display: 'inline-block',
                padding: '3px 10px', borderRadius: '20px',
                background: 'var(--subtle)', color: 'var(--navy-muted)',
                fontSize: '11px', fontWeight: '600', border: '1px solid var(--border)',
              }}>{item.tag}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '36px' }}>
          <button
            onClick={() => document.querySelector('[aria-label="Open chat"]')?.click()}
            style={{
              padding: '11px 26px', borderRadius: '8px',
              background: 'var(--subtle)', color: 'var(--navy)',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              border: '1px solid var(--border)',
            }}
          >
            Ask Luna about the full menu
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{
        background: 'var(--navy)',
        padding: '88px 48px', color: 'white',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Our Story
          </div>
          <h2 style={{ fontSize: '38px', color: 'white', marginBottom: '20px', fontWeight: '700', letterSpacing: '-0.5px', maxWidth: '500px' }}>
            A space to slow down and savour
          </h2>
          <p style={{ fontSize: '16px', lineHeight: '1.8', maxWidth: '560px', opacity: 0.75, marginBottom: '56px' }}>
            LatteLune was born from a simple dream — to create a space where people could slow down,
            sip something beautiful, and feel at home. Every corner tells a story,
            and every cup is poured with intention.
          </p>
          <div style={{ display: 'flex', gap: '56px', flexWrap: 'wrap' }}>
            {[['500+', 'Happy regulars'], ['3', 'Signature blends'], ['8am', 'Open daily'], ['2024', 'Best café award']].map(([num, label]) => (
              <div key={label}>
                <div style={{ fontSize: '34px', fontWeight: '700', color: 'white', letterSpacing: '-1px' }}>{num}</div>
                <div style={{ fontSize: '13px', opacity: 0.55, marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '88px 48px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Find Us
          </div>
          <h2 style={{ fontSize: '38px', color: 'var(--navy)', fontWeight: '700', letterSpacing: '-0.5px' }}>Come say hello</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px', fontSize: '16px' }}>
            Or chat with Luna to book a table instantly.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { title: 'Address', detail: '12th Main Rd, Indiranagar\nBengaluru 560008' },
            { title: 'Hours', detail: 'Mon–Fri: 8am–10pm\nSat–Sun: 9am–11pm' },
            { title: 'Phone', detail: '+91 98765 43210' },
            { title: 'Email', detail: 'hello@lattelune.in' },
          ].map(card => (
            <div key={card.title} style={{
              background: 'var(--white)', borderRadius: 'var(--radius-md)',
              padding: '28px 32px', minWidth: '200px',
              boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: '700', color: 'var(--navy)', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}>{card.title}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: '1.6' }}>{card.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--navy)', color: 'rgba(255,255,255,0.5)',
        padding: '28px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '13px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>LatteLune</span>
          <span style={{ marginLeft: '16px' }}>© 2025 · Bengaluru</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin</Link>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>
            Powered by <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>BizBuddy</span>
          </span>
        </div>
      </footer>

      <ChatWidget />
    </div>
  )
}
