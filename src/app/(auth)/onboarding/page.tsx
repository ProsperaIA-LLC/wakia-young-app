'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const EMOJIS = ['😎','🚀','⚡','🎯','💡','🦁','🐯','🦊','🐙','🌟','🔥','💎','🌈','🎸','🤖','🧠','🌺','🎮','📱','✨']

const COUNTRIES = [
  { code: 'MX', label: 'México 🇲🇽' },
  { code: 'CO', label: 'Colombia 🇨🇴' },
  { code: 'AR', label: 'Argentina 🇦🇷' },
  { code: 'VE', label: 'Venezuela 🇻🇪' },
  { code: 'PE', label: 'Perú 🇵🇪' },
  { code: 'EC', label: 'Ecuador 🇪🇨' },
  { code: 'CL', label: 'Chile 🇨🇱' },
  { code: 'US', label: 'Estados Unidos 🇺🇸' },
  { code: 'OTHER', label: 'Otro' },
]

const TIMEZONES = [
  { value: 'America/Los_Angeles',            label: 'GMT-8 (Los Angeles)' },
  { value: 'America/Denver',                 label: 'GMT-7 (Denver)' },
  { value: 'America/Mexico_City',            label: 'GMT-6 (CDMX)' },
  { value: 'America/Bogota',                 label: 'GMT-5 (Bogotá / Lima)' },
  { value: 'America/Santiago',               label: 'GMT-4 (Santiago)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'GMT-3 (Bs. As.)' },
]

type Step = 1 | 2 | 3 | 'success' | 'pending-consent'

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep]     = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const [nickname, setNickname] = useState('')
  const [country, setCountry]   = useState('')
  const [timezone, setTimezone] = useState('America/Bogota')
  const [avatar, setAvatar]     = useState('😎')
  const [c1, setC1] = useState(true)
  const [c2, setC2] = useState(false)
  const [c3, setC3] = useState(false)

  const progressPct = (step === 'success' || step === 'pending-consent') ? 100 : ((step as number) / 3) * 100

  async function handleFinish() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sesión expirada. Volvé a iniciar sesión.')
      setLoading(false)
      return
    }
    const age = Number(user.user_metadata?.age) || 0
    const market = country === 'US' ? 'USA' : 'LATAM'
    const fullName = user.user_metadata?.full_name || user.user_metadata?.nickname || nickname || user.email!.split('@')[0]

    // Save via API route (service role handles duplicate email conflicts)
    const saveRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/onboarding/save`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nickname: nickname || fullName, country, timezone, market, avatar, fullName, age: age || null }),
    })
    if (!saveRes.ok) {
      const data = await saveRes.json()
      setError(`Error guardando perfil: ${data.error ?? 'Intentá de nuevo.'}`)
      setLoading(false)
      return
    }
    if (age < 18 && age > 0) {
      // Send parent consent email
      const parentName  = user.user_metadata?.parent_name  ?? ''
      const parentEmail = user.user_metadata?.parent_email ?? ''
      const market      = user.user_metadata?.market       ?? (country === 'US' ? 'USA' : 'LATAM')

      if (parentEmail) {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/consent/send`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ parentName, parentEmail, studentName: fullName, market }),
        })
      }

      setLoading(false)
      setStep('pending-consent')
    } else {
      setLoading(false)
      setStep('success')
      setTimeout(() => { window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/dashboard` }, 2000)
    }
  }

  const fieldLabel: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ink2)',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
  }
  const fieldInput: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1.5px solid var(--border)',
    borderRadius: '10px', padding: '12px 14px', fontSize: '16px', color: 'var(--ink)',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', appearance: 'none' as const,
  }
  const btnNext: React.CSSProperties = {
    flex: 1, background: 'var(--green)', color: 'var(--navy)', border: 'none',
    borderRadius: '10px', padding: '13px', fontSize: '15px', fontWeight: 800,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', minHeight: '48px',
  }
  const btnBack: React.CSSProperties = {
    flexShrink: 0, background: 'transparent', color: 'var(--ink3)',
    border: '1.5px solid var(--border)', borderRadius: '10px', padding: '12px 16px',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: '48px',
  }

  return (
    <div style={{
      fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif",
      background: 'var(--bg)', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '16px',
    }}>
      <style>{`
        .onb-progress-label {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; white-space: nowrap;
        }
        .onb-card { padding: 36px 40px; }
        .onb-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .onb-emoji-grid { display: flex; gap: 10px; flex-wrap: wrap; }
        .onb-emoji-item { width: 52px; height: 52px; font-size: 24px; }

        @media (max-width: 640px) {
          .onb-progress-label { font-size: 9px; letter-spacing: 0.03em; }
          .onb-card { padding: 24px 20px; }
          .onb-field-row { grid-template-columns: 1fr; gap: 0; }
          .onb-emoji-item { width: 44px; height: 44px; font-size: 20px; }
        }
      `}</style>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '520px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '4px' }}>
          {['Perfil', 'Avatar', 'Consentimiento'].map((lbl, i) => (
            <span key={lbl} className="onb-progress-label" style={{
              color: step === i + 1 ? 'var(--green)' : 'var(--ink3)',
            }}>{lbl}</span>
          ))}
        </div>
        <div style={{ height: '4px', background: 'var(--bg2)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--green)', borderRadius: '2px', transition: 'width .4s ease' }} />
        </div>
      </div>

      {/* Card */}
      <div className="onb-card" style={{
        background: 'var(--white)', borderRadius: '20px', border: '1px solid var(--border)',
        width: '100%', maxWidth: '520px', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
      }}>

        {/* ── STEP 1: Profile ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Paso 1 de 3</div>
            <div style={{ fontWeight: 800, fontSize: '22px', color: 'var(--ink)', marginBottom: '6px' }}>¿Cómo te llamamos? 👋</div>
            <div style={{ fontSize: '14px', color: 'var(--ink3)', lineHeight: 1.6, marginBottom: '24px' }}>Esta información aparece en tu perfil y en el certificado FGU.</div>

            <div style={{ marginBottom: '18px' }}>
              <label style={fieldLabel}>¿Cómo querés que te llamen?</label>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                placeholder="Vale, Rodri, Cami..." style={fieldInput} />
            </div>

            <div className="onb-field-row" style={{ marginBottom: '18px' }}>
              <div>
                <label style={fieldLabel}>País</label>
                <select value={country} onChange={e => setCountry(e.target.value)} style={fieldInput}>
                  <option value="">Seleccioná...</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={fieldLabel}>Zona horaria</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} style={fieldInput}>
                  {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(2)} disabled={!nickname || !country}
                style={{
                  ...btnNext,
                  background: !nickname || !country ? 'var(--bg2)' : 'var(--green)',
                  color: !nickname || !country ? 'var(--ink4)' : 'var(--navy)',
                  cursor: !nickname || !country ? 'not-allowed' : 'pointer',
                }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Avatar ── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Paso 2 de 3</div>
            <div style={{ fontWeight: 800, fontSize: '22px', color: 'var(--ink)', marginBottom: '6px' }}>Elegí tu avatar ✨</div>
            <div style={{ fontSize: '14px', color: 'var(--ink3)', lineHeight: 1.6, marginBottom: '20px' }}>Tu cara visible en el pod y la cohorte.</div>

            <div style={{
              background: 'var(--navy)', borderRadius: '14px', padding: '16px 18px',
              marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', background: 'var(--green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0,
              }}>{avatar}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>{nickname || 'Tu nombre'}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                  {COUNTRIES.find(c => c.code === country)?.label.split(' ')[0] || 'País'} · Pod por asignar
                </div>
              </div>
              <div style={{
                marginLeft: 'auto', flexShrink: 0,
                background: 'rgba(0,200,150,0.15)', border: '1px solid rgba(0,200,150,0.3)',
                color: 'var(--green)', fontSize: '11px', fontWeight: 700,
                padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
              }}>Cohorte 1</div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <span style={{ ...fieldLabel, display: 'block', marginBottom: '12px' }}>Elegí un emoji</span>
              <div className="onb-emoji-grid">
                {EMOJIS.map(e => (
                  <div key={e} onClick={() => setAvatar(e)} className="onb-emoji-item" style={{
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer',
                    border: `2.5px solid ${avatar === e ? 'var(--green)' : 'transparent'}`,
                    background: avatar === e ? 'var(--green-l)' : 'var(--bg2)',
                    transition: 'all .15s',
                  }}>{e}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(1)} style={btnBack}>← Atrás</button>
              <button onClick={() => setStep(3)} style={btnNext}>Continuar →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Consent ── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Paso 3 de 3</div>
            <div style={{ fontWeight: 800, fontSize: '22px', color: 'var(--ink)', marginBottom: '6px' }}>Últimos detalles 📋</div>
            <div style={{ fontSize: '14px', color: 'var(--ink3)', lineHeight: 1.6, marginBottom: '20px' }}>Leé y aceptá para activar tu cuenta.</div>

            <div style={{
              background: 'var(--mag-l)', borderRadius: '10px', padding: '12px 14px',
              marginBottom: '20px', fontSize: '13px', color: 'var(--ink2)',
              lineHeight: 1.5, borderLeft: '3px solid var(--magenta)',
            }}>
              ✦ <strong>Nota para padres:</strong> Les enviamos un email separado para confirmar la participación.
            </div>

            {[
              {
                checked: c1, setChecked: setC1,
                title: 'Reglas del programa',
                text: 'Me comprometo a entregar mi trabajo cada semana, a ser honesto/a en mis reflexiones, y a respetar a mis compañeros de pod.',
              },
              {
                checked: c2, setChecked: setC2,
                title: 'Uso de IA (Luna)',
                text: 'Entiendo que el tutor IA es una herramienta de apoyo, no un sustituto de mi propio pensamiento.',
              },
              {
                checked: c3, setChecked: setC3,
                title: 'Política de privacidad',
                text: 'Acepto que mis datos de aprendizaje se usen para mejorar el programa. No se comparten con terceros.',
              },
            ].map(({ checked, setChecked, title, text }) => (
              <div key={title} onClick={() => setChecked(!checked)} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px', borderRadius: '10px', marginBottom: '10px',
                cursor: 'pointer', border: `1.5px solid ${checked ? 'var(--green)' : 'var(--border)'}`,
                background: checked ? 'var(--green-l)' : 'var(--bg)',
                transition: 'all .15s',
              }}>
                <div style={{
                  width: '20px', height: '20px', minWidth: '20px', borderRadius: '5px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 800, marginTop: '1px',
                  background: checked ? 'var(--green)' : 'transparent',
                  border: `2px solid ${checked ? 'var(--green)' : 'var(--ink4)'}`,
                  color: 'var(--navy)', transition: 'all .15s',
                }}>{checked ? '✓' : ''}</div>
                <div style={{ fontSize: '13px', color: 'var(--ink2)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--ink)' }}>{title}</strong> — {text}
                </div>
              </div>
            ))}

            {error && (
              <p style={{ fontSize: '13px', color: 'var(--coral)', background: 'var(--coral-l)', borderRadius: '8px', padding: '10px 12px', marginTop: '12px' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setStep(2)} style={btnBack}>← Atrás</button>
              <button
                onClick={handleFinish}
                disabled={loading || !c1 || !c2 || !c3}
                style={{
                  ...btnNext,
                  background: loading || !c1 || !c2 || !c3 ? 'var(--bg2)' : 'var(--green)',
                  color: loading || !c1 || !c2 || !c3 ? 'var(--ink4)' : 'var(--navy)',
                  cursor: loading || !c1 || !c2 || !c3 ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Guardando...' : 'Comenzar el programa 🚀'}
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: '24px', color: 'var(--ink)', marginBottom: '10px' }}>
              ¡Bienvenid@, {nickname}!
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ink3)', lineHeight: 1.7, marginBottom: '24px' }}>
              Tu cuenta está activa. Te asignamos a un pod según tu zona horaria.<br />
              La semana 1 empieza el próximo lunes — te avisamos por email.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {['📍 Pod por asignar', '🗓 Semana 1 · Lunes', '🏆 Certificado FGU'].map(tag => (
                <span key={tag} style={{
                  background: 'var(--bg)', borderRadius: '20px', padding: '6px 14px',
                  fontSize: '12px', fontWeight: 700, color: 'var(--ink2)',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── PENDING PARENT CONSENT (under-18) ── */}
        {step === 'pending-consent' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>📬</div>
            <div style={{ fontWeight: 800, fontSize: '22px', color: 'var(--ink)', marginBottom: '10px' }}>
              ¡Casi listo, {nickname}!
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ink3)', lineHeight: 1.7, marginBottom: '20px' }}>
              Le enviamos un email a tu madre/padre/tutor para confirmar tu participación.
              Revisá con ellos y pediles que hagan clic en el link.
            </div>
            <div style={{
              background: 'var(--gold-l)', border: '1px solid var(--gold)',
              borderRadius: '12px', padding: '14px 16px',
              fontSize: '13px', color: 'var(--ink2)', lineHeight: 1.6, marginBottom: '20px',
            }}>
              <strong>Mientras tanto</strong>, tu cuenta está creada pero el acceso al
              programa se activa automáticamente cuando tu tutor confirme.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {['📍 Pod por asignar', '✉️ Email enviado al tutor', '🏆 Certificado FGU'].map(tag => (
                <span key={tag} style={{
                  background: 'var(--bg)', borderRadius: '20px', padding: '6px 14px',
                  fontSize: '12px', fontWeight: 700, color: 'var(--ink2)',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
