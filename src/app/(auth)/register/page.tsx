'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const COUNTRIES = [
  'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT',
  'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE', 'US',
]

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina', BO: 'Bolivia', CL: 'Chile', CO: 'Colombia',
  CR: 'Costa Rica', CU: 'Cuba', DO: 'República Dominicana', EC: 'Ecuador',
  SV: 'El Salvador', GT: 'Guatemala', HN: 'Honduras', MX: 'México',
  NI: 'Nicaragua', PA: 'Panamá', PY: 'Paraguay', PE: 'Perú',
  PR: 'Puerto Rico', UY: 'Uruguay', VE: 'Venezuela', US: 'Estados Unidos',
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    nickname: '',
    age: '',
    country: '',
    market: '',
    parentName: '',
    parentEmail: '',
  })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsParentConsent = Number(form.age) < 18

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (field === 'country') {
      setForm(prev => ({ ...prev, country: value, market: value === 'US' ? 'USA' : 'LATAM' }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Send magic link
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        emailRedirectTo: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/auth/callback`,
        data: {
          full_name: form.fullName,
          nickname: form.nickname,
          age: Number(form.age),
          country: form.country,
          market: form.market,
          parent_name: form.parentName,
          parent_email: form.parentEmail,
        },
      },
    })

    if (authError) {
      setError('No pudimos completar el registro. Intentá de nuevo.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'var(--bg2)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-btn)',
    fontSize: '15px',
    color: 'var(--ink)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--ink3)',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-card)',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            background: 'var(--navy)',
            borderRadius: '12px',
            marginBottom: '14px',
          }}>
            <span style={{ color: 'var(--green)', fontSize: '24px', fontWeight: 800 }}>W</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
            Crear cuenta
          </h1>
          <p style={{ color: 'var(--ink3)', fontSize: '13px', marginTop: '6px' }}>
            WakiaYoung — programa de 6 semanas
          </p>
        </div>

        {sent ? (
          <div style={{
            background: 'var(--green-l)',
            borderRadius: 'var(--radius-btn)',
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📬</div>
            <p style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
              ¡Revisá tu email!
            </p>
            <p style={{ color: 'var(--ink2)', fontSize: '14px' }}>
              Te enviamos un link a <strong>{form.email}</strong> para confirmar tu cuenta.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '14px' }}>

              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" style={inputStyle} required
                  value={form.email} onChange={e => update('email', e.target.value)}
                  placeholder="tu@email.com" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Nombre completo</label>
                  <input type="text" style={inputStyle} required
                    value={form.fullName} onChange={e => update('fullName', e.target.value)}
                    placeholder="Valentina García" />
                </div>
                <div>
                  <label style={labelStyle}>Apodo (opcional)</label>
                  <input type="text" style={inputStyle}
                    value={form.nickname} onChange={e => update('nickname', e.target.value)}
                    placeholder="Vale" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Edad</label>
                  <input type="number" style={inputStyle} required min={14} max={18}
                    value={form.age} onChange={e => update('age', e.target.value)}
                    placeholder="16" />
                </div>
                <div>
                  <label style={labelStyle}>País</label>
                  <select style={inputStyle} required
                    value={form.country} onChange={e => update('country', e.target.value)}>
                    <option value="">Seleccioná</option>
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{COUNTRY_NAMES[c]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {needsParentConsent && Number(form.age) >= 14 && (
                <div style={{
                  background: 'var(--gold-l)',
                  borderRadius: 'var(--radius-btn)',
                  padding: '14px',
                  border: '1px solid var(--gold)',
                }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' }}>
                    Por ser menor de 18 años, necesitamos el consentimiento de tu madre/padre/tutor.
                  </p>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Nombre del padre/madre/tutor</label>
                      <input type="text" style={inputStyle} required={needsParentConsent}
                        value={form.parentName} onChange={e => update('parentName', e.target.value)}
                        placeholder="Carlos García" />
                    </div>
                    <div>
                      <label style={labelStyle}>Email del padre/madre/tutor</label>
                      <input type="email" style={inputStyle} required={needsParentConsent}
                        value={form.parentEmail} onChange={e => update('parentEmail', e.target.value)}
                        placeholder="padre@email.com" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p style={{
                  color: 'var(--coral)',
                  fontSize: '13px',
                  padding: '10px 14px',
                  background: 'var(--coral-l)',
                  borderRadius: 'var(--radius-btn)',
                }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: loading ? 'var(--ink4)' : 'var(--green)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 'var(--radius-btn)',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                }}
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>

              <p style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: '13px' }}>
                ¿Ya tenés cuenta?{' '}
                <a href="/login" style={{ color: 'var(--teal)', fontWeight: 700, textDecoration: 'none' }}>
                  Entrá acá
                </a>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
