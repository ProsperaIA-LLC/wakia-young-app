'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PRICES } from '@/lib/stripe/checkout'
import type { Market } from '@/types'
import type { PriceType } from '@/lib/stripe/checkout'

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormState {
  studentName:  string
  studentEmail: string
  studentAge:   string
  country:      string
  parentName:   string
  parentEmail:  string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MARKET_FLAGS: Record<Market, string> = { USA: '🇺🇸', LATAM: '🌎' }
const MARKET_LABEL: Record<Market, string> = { USA: 'Estados Unidos', LATAM: 'Latinoamérica' }

const INCLUDED = [
  '6 semanas de proyecto real con IA',
  'Mentoría personalizada semanal',
  'Pod de 4–5 estudiantes de toda LATAM',
  'Acceso a Luna — tu tutora de IA',
  'Certificación internacional (FGU)',
  'Comunidad vitalicia de builders',
]

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', boxSizing: 'border-box',
  border: '1.5px solid rgba(17,17,16,0.12)', borderRadius: '10px',
  fontFamily: 'inherit', fontSize: '14px', color: 'var(--ink)',
  background: 'var(--white)', outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 700, fontSize: '12px',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  color: 'var(--ink2)', marginBottom: '6px',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MarketSelector({ onSelect }: { onSelect: (m: Market) => void }) {
  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontWeight: 900, fontSize: '28px', margin: '0 0 10px', color: 'var(--ink)' }}>
          ¿Desde dónde estás aplicando?
        </h1>
        <p style={{ color: 'var(--ink3)', fontSize: '15px', margin: 0 }}>
          El precio varía según tu mercado.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {(['USA', 'LATAM'] as Market[]).map(market => (
          <button key={market} onClick={() => onSelect(market)} style={{
            background: 'var(--white)', border: '1.5px solid var(--border)',
            borderRadius: '14px', padding: '20px 24px',
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '16px',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(14,42,71,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <span style={{ fontSize: '32px' }}>{MARKET_FLAGS[market]}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)', marginBottom: '2px' }}>
                {MARKET_LABEL[market]}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ink3)' }}>
                Desde <strong style={{ color: 'var(--teal)' }}>${PRICES[market].early} USD</strong>
                {' '}· Early bird
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--ink4)', fontSize: '18px' }}>→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SuccessState({ studentName }: { studentName: string }) {
  return (
    <div style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px',
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: '20px',
        padding: '52px 40px', maxWidth: '460px', width: '100%',
        textAlign: 'center', border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'var(--green-l)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '32px', margin: '0 auto 20px',
        }}>🎉</div>
        <h1 style={{ fontWeight: 900, fontSize: '24px', margin: '0 0 10px', color: 'var(--ink)' }}>
          ¡Pago confirmado!
        </h1>
        <p style={{ color: 'var(--ink3)', fontSize: '15px', lineHeight: 1.7, margin: '0 0 8px' }}>
          {studentName ? `¡Bienvenido/a, ${studentName.split(' ')[0]}!` : '¡Bienvenido/a!'}{' '}
          Tu lugar en Prospera Young AI está reservado.
        </p>
        <p style={{ color: 'var(--ink3)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 28px' }}>
          Recibirás un email con tus datos de acceso en los próximos minutos. Revisá también la bandeja de spam.
        </p>
        <Link href="/login" style={{
          display: 'inline-block',
          background: 'var(--navy)', color: 'var(--white)',
          borderRadius: '10px', padding: '13px 28px',
          fontSize: '14px', fontWeight: 800, textDecoration: 'none',
        }}>
          Ingresar a la plataforma →
        </Link>
        <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--ink4)' }}>
          ¿Preguntas? Escribinos a{' '}
          <a href="mailto:hola@prosperayoung.ai" style={{ color: 'var(--teal)', textDecoration: 'none' }}>
            hola@prosperayoung.ai
          </a>
        </p>
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

function ApplyForm({ market, initPriceType }: { market: Market; initPriceType: PriceType }) {
  const router = useRouter()

  const [priceType, setPriceType] = useState<PriceType>(initPriceType)
  const [form, setForm]           = useState<FormState>({
    studentName: '', studentEmail: '', studentAge: '',
    country: '', parentName: '', parentEmail: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const age      = parseInt(form.studentAge) || 0
  const needsParent = age > 0 && age < 18
  const price    = PRICES[market][priceType]
  const fullPrice = PRICES[market].full

  function update(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const res = await fetch('/api/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market,
        priceType,
        studentName:  form.studentName.trim(),
        studentEmail: form.studentEmail.trim(),
        studentAge:   parseInt(form.studentAge) || 0,
        country:      form.country.trim(),
        parentName:   form.parentName.trim() || undefined,
        parentEmail:  form.parentEmail.trim() || undefined,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Error inesperado. Intentá de nuevo.')
      setSubmitting(false)
      return
    }

    // Redirect to Stripe Checkout
    window.location.href = json.url
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

        {/* ── Left: form ──────────────────────────────────────────────────── */}
        <div>
          {/* Back link */}
          <button onClick={() => router.push('/apply')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', color: 'var(--ink3)', padding: '0 0 20px',
            display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit',
          }}>
            ← Cambiar mercado
          </button>

          {/* Market badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '28px' }}>{MARKET_FLAGS[market]}</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '22px', color: 'var(--ink)', lineHeight: 1.2 }}>
                Reservar tu lugar
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ink3)' }}>
                {MARKET_LABEL[market]} · Prospera Young AI
              </div>
            </div>
          </div>

          {/* Price selector */}
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: '18px', marginBottom: '24px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
              Seleccioná tu precio
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(['early', 'full'] as PriceType[]).map(pt => {
                const p       = PRICES[market][pt]
                const checked = priceType === pt
                return (
                  <label key={pt} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                    border: `1.5px solid ${checked ? 'var(--navy)' : 'var(--border)'}`,
                    background: checked ? 'var(--bg)' : 'var(--white)',
                    transition: 'all .15s',
                  }}>
                    <input
                      type="radio" name="priceType" value={pt}
                      checked={checked} onChange={() => setPriceType(pt)}
                      style={{ accentColor: 'var(--navy)', width: '16px', height: '16px', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--ink)' }}>
                          ${p} USD
                        </span>
                        {pt === 'early' && (
                          <span style={{
                            background: 'var(--gold-l)', color: 'var(--gold)',
                            fontSize: '10px', fontWeight: 800,
                            padding: '2px 8px', borderRadius: '99px',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                          }}>
                            🔥 Early bird
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                        {pt === 'early'
                          ? `Precio especial — primeros 21 días (ahorrás $${fullPrice - p})`
                          : 'Precio regular del programa'}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            <p style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ink)', margin: 0 }}>
              Tus datos
            </p>

            {/* Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input style={inputStyle} type="text" required
                  value={form.studentName}
                  onChange={e => update('studentName', e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" required
                  value={form.studentEmail}
                  onChange={e => update('studentEmail', e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Age + Country */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Edad *</label>
                <input style={inputStyle} type="number" required
                  min="10" max="25"
                  value={form.studentAge}
                  onChange={e => update('studentAge', e.target.value)}
                  placeholder="14–18"
                />
              </div>
              <div>
                <label style={labelStyle}>País de residencia *</label>
                <input style={inputStyle} type="text" required
                  value={form.country}
                  onChange={e => update('country', e.target.value)}
                  placeholder={market === 'USA' ? 'United States' : 'México, Colombia…'}
                />
              </div>
            </div>

            {/* Parent info — shown when age < 18 */}
            {needsParent && (
              <div style={{
                background: 'var(--gold-l)', borderRadius: '10px',
                padding: '16px', border: '1px solid rgba(224,163,38,0.3)',
                display: 'flex', flexDirection: 'column', gap: '12px',
              }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚠ Menor de edad — datos del padre/tutor
                </p>
                <p style={{ fontSize: '12px', color: 'var(--ink3)', margin: 0, lineHeight: 1.6 }}>
                  Como tenés menos de 18 años, necesitamos la autorización de un padre o tutor legal. Le enviaremos un email automáticamente para que firme el consentimiento.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Nombre del padre/tutor *</label>
                    <input style={inputStyle} type="text" required
                      value={form.parentName}
                      onChange={e => update('parentName', e.target.value)}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email del padre/tutor *</label>
                    <input style={inputStyle} type="email" required
                      value={form.parentEmail}
                      onChange={e => update('parentEmail', e.target.value)}
                      placeholder="padre@email.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: 'var(--coral-l)', border: '1px solid var(--coral)',
                borderRadius: '10px', padding: '12px 14px',
                color: 'var(--coral)', fontSize: '13px', fontWeight: 600,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={submitting} style={{
              background: submitting ? 'var(--ink4)' : 'var(--green)',
              color: 'var(--navy)', border: 'none', borderRadius: '10px',
              padding: '15px', fontWeight: 900, fontSize: '15px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
              transition: 'background .15s',
            }}>
              {submitting ? 'Redirigiendo a Stripe…' : `Pagar $${price} USD → Reservar mi lugar`}
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--ink4)', margin: 0 }}>
              🔒 Pago seguro con Stripe · No guardamos datos de tarjeta
            </p>
          </form>
        </div>

        {/* ── Right: what's included ───────────────────────────────────────── */}
        <div style={{ position: 'sticky', top: '24px' }}>

          {/* Price summary card */}
          <div style={{
            background: 'var(--navy)', borderRadius: '16px',
            padding: '24px', marginBottom: '16px',
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {MARKET_FLAGS[market]} {MARKET_LABEL[market]} · {priceType === 'early' ? 'Early bird' : 'Precio regular'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 900, fontSize: '36px', color: 'var(--green)', lineHeight: 1 }}>
                ${PRICES[market][priceType]}
              </span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>USD</span>
              {priceType === 'early' && (
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>
                  ${PRICES[market].full}
                </span>
              )}
            </div>
            {priceType === 'early' && (
              <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>
                🔥 Ahorrás ${PRICES[market].full - PRICES[market].early} USD
              </div>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '16px', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Incluye
              </div>
              {INCLUDED.map(item => (
                <div key={item} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 800, flexShrink: 0, fontSize: '13px', marginTop: '1px' }}>✓</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guarantee */}
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '16px',
            display: 'flex', gap: '12px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '22px', flexShrink: 0 }}>🛡</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)', marginBottom: '4px' }}>
                Garantía de 7 días
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink3)', lineHeight: 1.6 }}>
                Si el programa no es lo que esperabas, te devolvemos el 100% en los primeros 7 días, sin preguntas.
              </div>
            </div>
          </div>

          {/* Scholarship link */}
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <Link href="/scholarship" style={{ fontSize: '12px', color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>
              ¿No podés pagar? Aplicá a una beca →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Page shell (reads search params) ─────────────────────────────────────────

function ApplyPageInner() {
  const params    = useSearchParams()
  const router    = useRouter()

  const marketParam    = params.get('market')?.toUpperCase() as Market | null
  const priceParam     = (params.get('price') ?? 'early') as PriceType
  const isSuccess      = params.get('success') === 'true'
  const wasCancelled   = params.get('cancelled') === 'true'
  const sessionId      = params.get('session_id') ?? ''

  const [market,    setMarket]    = useState<Market | null>(null)
  const [priceType, setPriceType] = useState<PriceType>('early')

  useEffect(() => {
    if (marketParam && ['USA', 'LATAM'].includes(marketParam)) {
      setMarket(marketParam)
    }
    if (['full', 'early'].includes(priceParam)) {
      setPriceType(priceParam)
    }
  }, [marketParam, priceParam])

  // Derive name from session if possible (stored in sessionStorage on success)
  const studentName = typeof window !== 'undefined'
    ? sessionStorage.getItem('prospera_student_name') ?? ''
    : ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif" }}>

      {/* Nav */}
      <nav style={{
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '32px', height: '32px', background: 'var(--green)',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 900, fontSize: '16px', color: 'var(--navy)',
          }}>P</div>
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)' }}>Prospera Young AI</span>
        </Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/scholarship" style={{ fontSize: '13px', color: 'var(--ink3)', textDecoration: 'none', fontWeight: 600 }}>
            Solicitar beca
          </Link>
          <Link href="/login" style={{ fontSize: '13px', color: 'var(--ink3)', textDecoration: 'none', fontWeight: 600 }}>
            Ingresar
          </Link>
        </div>
      </nav>

      {/* Cancelled banner */}
      {wasCancelled && !isSuccess && (
        <div style={{
          background: 'var(--gold-l)', borderBottom: '1px solid rgba(224,163,38,0.3)',
          padding: '12px 5%', textAlign: 'center',
          fontSize: '13px', color: 'var(--ink2)', fontWeight: 600,
        }}>
          Cancelaste el pago. Podés intentarlo de nuevo cuando quieras. 🙂
        </div>
      )}

      {/* Content */}
      {isSuccess ? (
        <SuccessState studentName={studentName} />
      ) : market ? (
        <ApplyForm market={market} initPriceType={priceType} />
      ) : (
        <MarketSelector onSelect={m => {
          setMarket(m)
          router.push(`/apply?market=${m}&price=${priceType}`, { scroll: false })
        }} />
      )}
    </div>
  )
}

// Wrap in Suspense so useSearchParams doesn't break SSR
export default function ApplyPage() {
  return (
    <Suspense>
      <ApplyPageInner />
    </Suspense>
  )
}
