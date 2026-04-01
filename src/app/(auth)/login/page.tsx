'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'login' | 'register'
type Step = 'email' | 'code'

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>('login')

  const [email, setEmail] = useState('')
  const [step, setStep] = useState<Step>('email')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [regForm, setRegForm] = useState({ fullName: '', email: '', country: '', age: '' })

  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setError('El código expiró o ya fue usado. Pedí uno nuevo.')
    }
  }, [searchParams])

  async function sendOtp() {
    if (!email) return
    setLoading(true)
    setError(null)

    // Verificar que el email está registrado antes de enviar el OTP
    try {
      const check = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const { exists } = await check.json()
      if (!exists) {
        setError('No encontramos una cuenta con ese email. Para inscribirse, usá el botón "Registrarme".')
        setLoading(false)
        return
      }
    } catch {
      // Si falla la verificación, dejamos pasar para no bloquear al usuario legítimo
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setError('No pudimos enviar el código. Verificá tu email e intentá de nuevo.')
    } else {
      setStep('code')
    }
    setLoading(false)
  }

  async function verifyOtp() {
    if (!otp || otp.length < 6) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) {
      setError('Código incorrecto o expirado. Revisá tu email e intentá de nuevo.')
      setLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  function handleRegister() {
    router.push('/apply')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)',
    border: '1.5px solid var(--border)', borderRadius: '10px',
    padding: '12px 14px', fontSize: '16px', color: 'var(--ink)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: 'var(--ink2)', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  const btnPrimary: React.CSSProperties = {
    display: 'block', width: '100%', background: 'var(--navy)',
    color: '#fff', border: 'none', borderRadius: '10px',
    padding: '13px', fontSize: '15px', fontWeight: 700,
    cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
  }

  const btnDisabled: React.CSSProperties = {
    ...btnPrimary, background: 'var(--ink4)', cursor: 'not-allowed',
  }

  return (
    <div style={{
      fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif",
      background: 'var(--navy)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <style>{`
        .lp-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 900px;
          width: 100%;
          min-height: 580px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.4);
        }
        .lp-brand {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .lp-form-pad { padding: 48px 40px; }
        @media (max-width: 640px) {
          .lp-card {
            grid-template-columns: 1fr;
            min-height: auto;
            border-radius: 16px;
          }
          .lp-brand { display: none; }
          .lp-form-pad { padding: 32px 24px; }
        }
      `}</style>

      <div className="lp-card">

        {/* ── Brand side ── */}
        <div className="lp-brand" style={{
          background: 'var(--navy2)',
          padding: '48px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: '-40px', bottom: '-40px',
            width: '280px', height: '280px',
            background: 'radial-gradient(circle,rgba(0,200,150,0.12) 0%,transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
              <div style={{
                width: '36px', height: '36px', background: 'var(--green)',
                borderRadius: '9px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 900, fontSize: '17px', color: 'var(--navy)',
              }}>P</div>
              <span style={{ fontWeight: 800, fontSize: '18px', color: '#fff' }}>Prospera Young AI</span>
            </div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: '32px', color: '#fff', lineHeight: 1.15, marginBottom: '16px' }}>
                Construí algo <span style={{ color: 'var(--green)' }}>real</span> en 6 semanas.
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: '280px' }}>
                El programa intensivo para jóvenes latinos de 14 a 18 años que quieren crear con inteligencia artificial — desde el día 1.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[
              { n: '6', l: 'semanas intensivas' },
              { n: '100%', l: 'virtual y en español' },
              { n: 'FGU', l: 'certificación' },
            ].map(({ n, l }) => (
              <div key={n}>
                <div style={{ fontWeight: 800, fontSize: '24px', color: 'var(--green)' }}>{n}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Form side ── */}
        <div className="lp-form-pad" style={{
          background: 'var(--white)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <div style={{ fontWeight: 800, fontSize: '22px', color: 'var(--ink)', marginBottom: '6px' }}>
            Bienvenido/a
          </div>
          <div style={{ fontSize: '14px', color: 'var(--ink3)', marginBottom: '32px', lineHeight: 1.5 }}>
            Ingresá a tu portal o registrate para la próxima cohorte.
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', marginBottom: '28px',
            background: 'var(--bg)', borderRadius: '10px', padding: '3px',
          }}>
            {(['login', 'register'] as Tab[]).map((t, i) => (
              <button key={t} onClick={() => { setTab(t); setStep('email'); setError(null) }} style={{
                flex: 1, padding: '10px 8px', borderRadius: '8px', border: 'none',
                background: tab === t ? 'var(--white)' : 'transparent',
                fontSize: '13px', fontWeight: 600,
                color: tab === t ? 'var(--ink)' : 'var(--ink3)',
                cursor: 'pointer',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all .15s', fontFamily: 'inherit',
              }}>
                {i === 0 ? 'Ya tengo cuenta' : 'Registrarme'}
              </button>
            ))}
          </div>

          {/* ── Login tab ── */}
          {tab === 'login' && (
            <>
              {step === 'email' ? (
                <div style={{
                  background: 'var(--bg)', borderRadius: '12px',
                  padding: '16px', border: '1.5px dashed var(--bg2)',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink2)', marginBottom: '4px' }}>
                    Acceso por código
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink3)', lineHeight: 1.5, marginBottom: '12px' }}>
                    Te enviamos un código de 6 dígitos a tu email. Sin contraseña.
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendOtp()}
                      placeholder="tu@email.com"
                      style={{
                        width: '100%', background: 'var(--white)',
                        border: '1.5px solid var(--border)', borderRadius: '10px',
                        padding: '12px 14px', fontSize: '16px', color: 'var(--ink)',
                        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  {error && (
                    <p style={{
                      fontSize: '12px', color: 'var(--coral)',
                      background: 'var(--coral-l)', borderRadius: '8px',
                      padding: '8px 12px', marginBottom: '10px',
                    }}>{error}</p>
                  )}
                  <button
                    onClick={sendOtp}
                    disabled={loading || !email}
                    style={loading || !email ? btnDisabled : btnPrimary}
                  >
                    {loading ? 'Enviando...' : 'Enviar código →'}
                  </button>
                </div>
              ) : (
                <div style={{
                  background: 'var(--bg)', borderRadius: '12px',
                  padding: '16px', border: '1.5px dashed var(--bg2)',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink2)', marginBottom: '4px' }}>
                    Revisá tu email
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink3)', lineHeight: 1.5, marginBottom: '12px' }}>
                    Enviamos un código de 6 dígitos a <strong>{email}</strong>. Expira en 10 minutos.
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <input
                      id="login-otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                      placeholder="123456"
                      style={{
                        width: '100%', background: 'var(--white)',
                        border: '1.5px solid var(--border)', borderRadius: '10px',
                        padding: '12px 14px', fontSize: '24px', color: 'var(--ink)',
                        outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace',
                        letterSpacing: '0.3em', textAlign: 'center',
                      }}
                    />
                  </div>
                  {error && (
                    <p style={{
                      fontSize: '12px', color: 'var(--coral)',
                      background: 'var(--coral-l)', borderRadius: '8px',
                      padding: '8px 12px', marginBottom: '10px',
                    }}>{error}</p>
                  )}
                  <button
                    onClick={verifyOtp}
                    disabled={loading || otp.length < 6}
                    style={loading || otp.length < 6 ? btnDisabled : btnPrimary}
                  >
                    {loading ? 'Verificando...' : 'Entrar →'}
                  </button>
                  <button
                    onClick={() => { setStep('email'); setOtp(''); setError(null) }}
                    style={{
                      display: 'block', width: '100%', background: 'transparent',
                      color: 'var(--ink3)', border: 'none', borderRadius: '10px',
                      padding: '10px', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', marginTop: '8px', fontFamily: 'inherit',
                    }}
                  >
                    ← Cambiar email
                  </button>
                </div>
              )}

              <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.6 }}>
                ¿No tenés cuenta aún?{' '}
                <span onClick={() => setTab('register')} style={{ color: 'var(--teal)', fontWeight: 600, cursor: 'pointer' }}>
                  Registrate acá
                </span>
              </div>
            </>
          )}

          {/* ── Register tab ── */}
          {tab === 'register' && (
            <>
              <div style={{
                background: 'var(--mag-l)', borderRadius: '8px', padding: '10px 12px',
                marginBottom: '16px', fontSize: '12px', color: 'var(--ink2)',
                lineHeight: 1.5, borderLeft: '3px solid var(--magenta)',
              }}>
                ✦ Para menores de 18 años se requiere autorización de un padre o tutor.
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Nombre completo</label>
                <input id="reg-name" name="fullName" type="text" autoComplete="name" value={regForm.fullName}
                  onChange={e => setRegForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Valentina García"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Email</label>
                <input id="reg-email" name="email" type="email" autoComplete="email" value={regForm.email}
                  onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="tu@email.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>País</label>
                  <select id="reg-country" name="country" value={regForm.country}
                    onChange={e => setRegForm(p => ({ ...p, country: e.target.value }))}
                    style={{ ...inputStyle, background: 'var(--bg)' }}
                  >
                    <option value="">Seleccioná tu país</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Bolivia">Bolivia</option>
                    <option value="Chile">Chile</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Costa Rica">Costa Rica</option>
                    <option value="Cuba">Cuba</option>
                    <option value="Ecuador">Ecuador</option>
                    <option value="El Salvador">El Salvador</option>
                    <option value="España">España</option>
                    <option value="Estados Unidos">Estados Unidos</option>
                    <option value="Guatemala">Guatemala</option>
                    <option value="Honduras">Honduras</option>
                    <option value="México">México</option>
                    <option value="Nicaragua">Nicaragua</option>
                    <option value="Panamá">Panamá</option>
                    <option value="Paraguay">Paraguay</option>
                    <option value="Perú">Perú</option>
                    <option value="Puerto Rico">Puerto Rico</option>
                    <option value="República Dominicana">República Dominicana</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div style={{ width: '90px', flexShrink: 0 }}>
                  <label style={labelStyle}>Edad</label>
                  <input id="reg-age" name="age" type="number" value={regForm.age} min={14} max={18}
                    onChange={e => setRegForm(p => ({ ...p, age: e.target.value }))}
                    placeholder="16"
                    style={inputStyle}
                  />
                </div>
              </div>

              <button
                onClick={handleRegister}
                style={{
                  display: 'block', width: '100%', background: 'var(--green)',
                  color: 'var(--navy)', border: 'none', borderRadius: '10px',
                  padding: '14px', fontSize: '15px', fontWeight: 800,
                  cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit', marginTop: '8px',
                }}
              >
                Reservar mi lugar →
              </button>

              <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.6 }}>
                Al registrarte aceptás los{' '}
                <span style={{ color: 'var(--teal)', fontWeight: 600, cursor: 'pointer' }}>términos del programa</span>.<br />
                Tu lugar se confirma al completar el pago.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
