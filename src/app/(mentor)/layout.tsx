'use client'

import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/mentor/dashboard', label: 'Panel',      icon: '📊' },
  { href: '/mentor/pods',      label: 'Pods',       icon: '🫂' },
  { href: '/mentor/students',  label: 'Estudiantes', icon: '👥' },
]

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Sidebar */}
      <nav style={{
        width: '220px',
        minWidth: '220px',
        background: 'var(--navy)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '3px' }}>
            <div style={{
              width: '32px', height: '32px', background: 'var(--magenta)',
              borderRadius: '8px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: 'white',
            }}>P</div>
            <span style={{ fontWeight: 800, fontSize: '15px', color: 'white' }}>Próspero</span>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', paddingLeft: '41px', margin: 0 }}>
            Young AI
          </p>
        </div>

        {/* Mentor badge */}
        <div style={{
          margin: '12px 12px 0',
          background: 'rgba(165,8,107,0.2)',
          border: '1px solid rgba(165,8,107,0.35)',
          borderRadius: '8px',
          padding: '8px 12px',
        }}>
          <p style={{ fontSize: '10px', color: 'rgba(165,8,107,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>
            Mentor
          </p>
          <p style={{ fontSize: '12px', color: 'white', fontWeight: 600, margin: 0 }}>Panel de control</p>
        </div>

        {/* Nav items */}
        <div style={{ padding: '10px 0', flex: 1 }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '10px 16px 4px',
          }}>
            Gestión
          </p>
          {NAV.map(item => {
            const isActive = pathname === item.href || (item.href !== '/mentor/dashboard' && pathname.startsWith(item.href))
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '9px 10px 9px 16px',
                  margin: '1px 7px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                  background: isActive ? 'var(--magenta)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  width: 'calc(100% - 14px)',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Sign out */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client')
              await createClient().auth.signOut()
              router.push('/login')
            }}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: '8px',
              color: 'rgba(255,255,255,0.45)', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer', textAlign: 'left',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>

    </div>
  )
}
