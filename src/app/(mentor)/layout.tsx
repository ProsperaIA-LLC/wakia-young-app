'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const NAV_COHORT = [
  { href: '/mentor/dashboard', label: 'Dashboard',    icon: '◈' },
  { href: '/mentor/pods',      label: 'Pods',          icon: '⬡' },
  { href: '/mentor/students',  label: 'Estudiantes',  icon: '◑' },
]

const NAV_SESSION = [
  { href: '/mentor/session',     label: 'Sesión del sábado', icon: '▷' },
  { href: '/mentor/reflections', label: 'Reflexiones',       icon: '◎' },
]

const NAV_ADMIN = [
  { href: '/mentor/weeks/new', label: 'Agregar semana', icon: '⊕' },
  { href: '/mentor/settings',  label: 'Configuración',  icon: '◈' },
]

function NavSection({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      padding: '14px 16px 5px',
    }}>
      {label}
    </div>
  )
}

function NavItem({
  href, label, icon, isActive, badge,
}: {
  href: string; label: string; icon: string
  isActive: boolean; badge?: number
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '9px 10px 9px 16px', margin: '1px 7px',
        borderRadius: 8, fontSize: 13,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
        background: isActive ? 'var(--magenta)' : 'transparent',
        border: 'none', cursor: 'pointer',
        width: 'calc(100% - 14px)', textAlign: 'left',
        transition: 'all .15s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{
          background: 'var(--coral)', color: '#fff',
          fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 20,
        }}>
          {badge}
        </span>
      )}
    </button>
  )
}

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkRole() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
      setIsAdmin(data?.role === 'admin')
    }
    checkRole()
  }, [])

  function isActive(href: string) {
    return pathname === href || (href !== '/mentor/dashboard' && pathname.startsWith(href))
  }

  return (
    <>
      <style>{`
        .ml-root { display: flex; min-height: 100vh; background: var(--bg); }
        .ml-sidebar {
          width: 220px; min-width: 220px; background: var(--navy);
          display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh;
          overflow-y: auto; flex-shrink: 0;
        }
        .ml-main { flex: 1; min-width: 0; overflow-y: auto; display: flex; flex-direction: column; }
        .ml-bottom-nav { display: none; }

        @media (max-width: 768px) {
          .ml-sidebar { display: none; }
          .ml-main { padding-bottom: 72px; }
          .ml-bottom-nav {
            display: flex;
            position: fixed; bottom: 0; left: 0; right: 0;
            height: 60px;
            background: var(--navy);
            border-top: 1px solid rgba(255,255,255,0.08);
            z-index: 100;
            align-items: stretch;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        }
      `}</style>

      <div className="ml-root">

        {/* ── Sidebar (desktop) ── */}
        <nav className="ml-sidebar">
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
              <div style={{
                width: 32, height: 32, background: 'var(--magenta)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 14, color: '#fff', flexShrink: 0,
              }}>M</div>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Wakia</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingLeft: 41 }}>
              Panel Mentor
            </div>
          </div>

          <div style={{
            margin: '12px 12px 0',
            background: 'rgba(165,8,107,0.2)',
            border: '1px solid rgba(165,8,107,0.35)',
            borderRadius: 8, padding: '8px 12px',
          }}>
            <div style={{
              fontSize: 10, color: 'rgba(165,8,107,0.8)',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2,
            }}>
              Mentor activo
            </div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
              Panel de control
            </div>
          </div>

          <div style={{ flex: 1, paddingBottom: 8 }}>
            <NavSection label="Cohorte" />
            {NAV_COHORT.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
            ))}
            <NavSection label="Sesión" />
            {NAV_SESSION.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
            ))}
            <NavSection label="Admin" />
            {NAV_ADMIN.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
            ))}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {isAdmin && (
              <button
                onClick={() => router.push('/admin/dashboard')}
                style={{
                  width: '100%', padding: '8px 12px',
                  background: 'rgba(165,8,107,0.2)',
                  border: '1px solid rgba(165,8,107,0.4)', borderRadius: 8,
                  color: 'var(--magenta)', fontSize: 12,
                  fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                }}
              >
                ← Volver a Admin
              </button>
            )}
            <button
              onClick={async () => {
                const { createClient } = await import('@/lib/supabase/client')
                await createClient().auth.signOut()
                window.location.href = '/young/login'
              }}
              style={{
                width: '100%', padding: '8px 12px',
                background: 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 8,
                color: 'rgba(255,255,255,0.45)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', textAlign: 'left',
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </nav>

        {/* ── Main ── */}
        <main className="ml-main">{children}</main>

        {/* ── Bottom nav (mobile only) — shows 3 main cohort items ── */}
        <nav className="ml-bottom-nav">
          {NAV_COHORT.map(item => {
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '3px',
                  border: 'none', background: 'transparent',
                  color: active ? 'var(--magenta)' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', padding: '4px 2px',
                  transition: 'color 0.15s', fontSize: '20px',
                }}
              >
                <span style={{ lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontSize: '9px', fontWeight: active ? 700 : 500 }}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

      </div>
    </>
  )
}
