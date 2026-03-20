'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ScholarshipPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    age: '',
    country: '',
    reason: '',
    project_idea: '',
    monthly_income: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    // Map form fields to DB schema fields (scholarship_applications table)
    const motivationLetter = [
      form.reason,
      form.project_idea ? `\n\nIdea de proyecto: ${form.project_idea}` : '',
      form.monthly_income ? `\nIngreso familiar mensual: ${form.monthly_income}` : '',
    ].join('')

    const { error: insertError } = await supabase
      .from('scholarship_applications')
      .insert({
        cohort_id: '00000000-0000-0000-0000-000000000000', // placeholder — updated by mentor
        applicant_name: form.full_name,
        applicant_email: form.email,
        applicant_age: parseInt(form.age) || 0,
        applicant_country: form.country,
        motivation_letter: motivationLetter,
        status: 'pending',
      } as any)

    if (insertError) {
      setError('Hubo un error al enviar tu solicitud. Intentá de nuevo.')
      setSaving(false)
      return
    }

    setSubmitted(true)
    setSaving(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontWeight: 800, fontSize: '24px', marginBottom: '12px' }}>¡Solicitud enviada!</h1>
          <p style={{ color: '#6B7280', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
            Revisaremos tu solicitud en los próximos 5 días hábiles. Te contactaremos por email con nuestra decisión.
          </p>
          <Link href="/" style={{
            background: '#0E2A47', color: 'white',
            borderRadius: '10px', padding: '12px 24px',
            fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            display: 'inline-block',
          }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 13px',
    border: '1px solid rgba(17,17,16,0.12)',
    borderRadius: '10px',
    fontFamily: 'inherit',
    fontSize: '14px',
    color: '#111110',
    background: 'white',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 600,
    fontSize: '13px',
    marginBottom: '6px',
    color: '#111110',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif" }}>

      {/* Nav */}
      <nav style={{
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(17,17,16,0.08)',
        padding: '14px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: '32px', height: '32px', background: '#00c896', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px', color: '#0E2A47' }}>P</div>
          <span style={{ fontWeight: 800, fontSize: '16px' }}>Prospera Young AI</span>
        </Link>
        <Link href="/login" style={{ fontSize: '14px', fontWeight: 600, color: '#8a8884', textDecoration: 'none' }}>Ingresar</Link>
      </nav>

      <div style={{ maxWidth: '580px', margin: '0 auto', padding: '48px 24px' }}>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontWeight: 900, fontSize: '28px', margin: '0 0 10px' }}>Solicitud de beca</h1>
          <p style={{ color: '#8a8884', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
            Queremos que el acceso económico no sea una barrera. Si necesitás apoyo para participar, completá este formulario.
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid rgba(17,17,16,0.08)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input style={inputStyle} type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} required placeholder="Tu nombre completo" />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="tu@email.com" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Edad *</label>
                <input style={inputStyle} type="number" min="14" max="18" value={form.age} onChange={e => update('age', e.target.value)} required placeholder="14–18" />
              </div>
              <div>
                <label style={labelStyle}>País de residencia *</label>
                <input style={inputStyle} type="text" value={form.country} onChange={e => update('country', e.target.value)} required placeholder="Argentina, México, USA..." />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Ingreso mensual familiar aproximado</label>
              <input style={inputStyle} type="text" value={form.monthly_income} onChange={e => update('monthly_income', e.target.value)} placeholder="Ej: USD 500, ARS 200.000, sin ingresos fijos" />
            </div>

            <div>
              <label style={labelStyle}>¿Por qué necesitás la beca? *</label>
              <textarea
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' } as React.CSSProperties}
                value={form.reason}
                onChange={e => update('reason', e.target.value)}
                required
                placeholder="Contanos tu situación. Sé honesto/a — no hay respuesta incorrecta."
              />
            </div>

            <div>
              <label style={labelStyle}>¿En qué querés trabajar durante el programa? *</label>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' } as React.CSSProperties}
                value={form.project_idea}
                onChange={e => update('project_idea', e.target.value)}
                required
                placeholder="Cualquier idea, problema que veas, o cosa que te gustaría construir. No necesitás tener todo claro."
              />
            </div>

            {error && (
              <p style={{ color: 'var(--coral)', fontSize: '13px', fontWeight: 600 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#0E2A47', color: 'white',
                border: 'none', borderRadius: '10px',
                padding: '14px', fontWeight: 800, fontSize: '15px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {saving ? 'Enviando...' : 'Enviar solicitud de beca'}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}
