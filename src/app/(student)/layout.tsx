'use client'

import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard',    label: 'Inicio',      icon: '🏠' },
  { href: '/deliverables', label: 'Entregable',  icon: '📦' },
  { href: '/pod',          label: 'Mi Pod',      icon: '🫂' },
  { href: '/diary',        label: 'Diario',      icon: '📓' },
  { href: '/project',      label: 'Proyecto',    icon: '🚀' },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  return (
    <>
      <style>{`
        .sl-root { display: flex; min-height: 100vh; background: var(--bg); }
        .sl-sidebar {
          width: 220px; min-width: 220px;
          background: var(--navy);
          display: flex; flex-direction: column;
          min-height: 100vh; flex-shrink: 0;
          position: sticky; top: 0; height: 100vh; overflow-y: auto;
        }
        .sl-main { flex: 1; min-width: 0; overflow-y: auto; }
        .sl-bottom-nav { display: none; }

        @media (max-width: 768px) {
          .sl-sidebar { display: none; }
          .sl-main { padding-bottom: 72px; }
          .sl-bottom-nav {
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

      <div className="sl-root">

        {/* ── Sidebar (desktop) ── */}
        <nav className="sl-sidebar">
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

          <div style={{ padding: '10px 0', flex: 1 }}>
            <p style={{
              fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '10px 16px 4px',
            }}>
              Programa
            </p>
            {NAV.map(item => {
              const active = isActive(item.href)
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '9px 10px 9px 16px', margin: '1px 7px',
                    borderRadius: '8px', fontSize: '13px',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'white' : 'rgba(255,255,255,0.65)',
                    background: active ? 'var(--teal)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    width: 'calc(100% - 14px)', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </div>

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

        {/* ── Main content ── */}
        <main className="sl-main">{children}</main>

        {/* ── Bottom nav (mobile only) ── */}
        <nav className="sl-bottom-nav">
          {NAV.map(item => {
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '3px',
                  border: 'none', background: 'transparent',
                  color: active ? 'var(--teal)' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', padding: '4px 2px',
                  transition: 'color 0.15s',
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: 1 }}>{item.icon}</span>
                <span style={{
                  fontSize: '9px', fontWeight: active ? 700 : 500,
                  letterSpacing: '0.02em', whiteSpace: 'nowrap',
                }}>
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
