'use client'

import { usePathname, useRouter } from 'next/navigation'

const NAV_PLATFORM = [
  { href: '/admin/dashboard',    label: 'Dashboard',   icon: '◈' },
  { href: '/admin/cohorts',      label: 'Cohortes',    icon: '⬡' },
  { href: '/admin/pods',         label: 'Pods',        icon: '⬡' },
]

const NAV_PEOPLE = [
  { href: '/admin/users',        label: 'Usuarios',    icon: '◑' },
  { href: '/admin/scholarships', label: 'Becas',       icon: '✦' },
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
        background: isActive ? 'var(--gold)' : 'transparent',
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string) {
    return pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
  }

  return (
    <>
      <style>{`
        .al-root { display: flex; min-height: 100vh; background: var(--bg); }
        .al-sidebar {
          width: 220px; min-width: 220px;
          background: #0a1f36;
          display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh;
          overflow-y: auto; flex-shrink: 0;
        }
        .al-main { flex: 1; min-width: 0; overflow-y: auto; display: flex; flex-direction: column; }
        .al-bottom-nav { display: none; }

        @media (max-width: 768px) {
          .al-sidebar { display: none; }
          .al-main { padding-bottom: 72px; }
          .al-bottom-nav {
            display: flex;
            position: fixed; bottom: 0; left: 0; right: 0;
            height: 60px; background: #0a1f36;
            border-top: 1px solid rgba(255,255,255,0.08);
            z-index: 100; align-items: stretch;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        }
      `}</style>

      <div className="al-root">

        {/* ── Sidebar ── */}
        <nav className="al-sidebar">
          {/* Logo */}
          <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
              <div style={{
                width: 32, height: 32, background: 'var(--gold)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 13, color: 'var(--navy)', flexShrink: 0,
              }}>A</div>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Wakia</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingLeft: 41 }}>
              Panel Admin
            </div>
          </div>

          {/* Admin badge */}
          <div style={{
            margin: '12px 12px 0',
            background: 'rgba(224,163,38,0.15)',
            border: '1px solid rgba(224,163,38,0.3)',
            borderRadius: 8, padding: '8px 12px',
          }}>
            <div style={{
              fontSize: 10, color: 'rgba(224,163,38,0.9)',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2,
            }}>
              Acceso total
            </div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
              Administrador
            </div>
          </div>

          {/* Nav */}
          <div style={{ flex: 1, paddingBottom: 8 }}>
            <NavSection label="Plataforma" />
            {NAV_PLATFORM.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
            ))}
            <NavSection label="Personas" />
            {NAV_PEOPLE.map(item => (
              <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
            ))}
          </div>

          {/* Links to other panels */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                width: '100%', padding: '7px 12px', marginBottom: 6,
                background: 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 8,
                color: 'rgba(255,255,255,0.5)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', textAlign: 'left',
              }}
            >
              → Vista Estudiante
            </button>
            <button
              onClick={() => router.push('/mentor/dashboard')}
              style={{
                width: '100%', padding: '7px 12px', marginBottom: 6,
                background: 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 8,
                color: 'rgba(255,255,255,0.5)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', textAlign: 'left',
              }}
            >
              → Vista Mentor
            </button>
            <button
              onClick={async () => {
                const { createClient } = await import('@/lib/supabase/client')
                await createClient().auth.signOut()
                window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/login`
              }}
              style={{
                width: '100%', padding: '7px 12px',
                background: 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 8,
                color: 'rgba(255,255,255,0.35)', fontSize: 12,
                fontWeight: 600, cursor: 'pointer', textAlign: 'left',
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </nav>

        {/* ── Main ── */}
        <main className="al-main">{children}</main>

        {/* ── Bottom nav (mobile) ── */}
        <nav className="al-bottom-nav">
          {[...NAV_PLATFORM, ...NAV_PEOPLE].map(item => {
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '3px',
                  border: 'none', background: 'transparent',
                  color: active ? 'var(--gold)' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', padding: '4px 2px',
                  transition: 'color 0.15s', fontSize: '18px',
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
