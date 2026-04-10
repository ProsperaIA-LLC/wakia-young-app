'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormState {
  applicant_name:    string
  applicant_email:   string
  applicant_age:     string
  applicant_country: string
  motivation_letter: string
  video_url:         string
  reference_contact: string
}

const INITIAL: FormState = {
  applicant_name:    '',
  applicant_email:   '',
  applicant_age:     '',
  applicant_country: '',
  motivation_letter: '',
  video_url:         '',
  reference_contact: '',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// ── Styles ────────────────────────────────────────────────────────────────────

const input: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  border: '1.5px solid rgba(17,17,16,0.12)',
  borderRadius: '10px',
  fontFamily: 'inherit',
  fontSize: '14px',
  color: 'var(--ink)',
  background: 'var(--white)',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const label: React.CSSProperties = {
  display: 'block',
  fontWeight: 700,
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px',
  color: 'var(--ink2)',
}

const hint: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--ink3)',
  marginTop: '5px',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScholarshipPage() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const words    = wordCount(form.motivation_letter)
  const wordsOk  = words >= 200
  const wordColor = words === 0 ? 'var(--ink4)' : wordsOk ? 'var(--green)' : 'var(--coral)'

  function update(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!wordsOk) {
      setError(`La carta de motivación debe tener al menos 200 palabras (tiene ${words}).`)
      return
    }

    setSaving(true)

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/scholarship`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicant_name:    form.applicant_name.trim(),
        applicant_email:   form.applicant_email.trim(),
        applicant_age:     parseInt(form.applicant_age) || 0,
        applicant_country: form.applicant_country.trim(),
        motivation_letter: form.motivation_letter.trim(),
        video_url:         form.video_url.trim() || undefined,
        reference_contact: form.reference_contact.trim() || undefined,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Error inesperado. Intentá de nuevo.')
      setSaving(false)
      return
    }

    setSubmitted(true)
    setSaving(false)
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif",
      }}>
        <div style={{
          background: 'var(--white)', borderRadius: '20px',
          padding: '52px 40px', maxWidth: '480px', width: '100%',
          textAlign: 'center', border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--green-l)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 20px',
          }}>🎓</div>
          <h1 style={{ fontWeight: 900, fontSize: '24px', margin: '0 0 10px', color: 'var(--ink)' }}>
            ¡Solicitud enviada!
          </h1>
          <p style={{ color: 'var(--ink3)', fontSize: '15px', lineHeight: 1.7, margin: '0 0 28px' }}>
            Recibimos tu solicitud de beca. La revisaremos en los próximos <strong style={{ color: 'var(--ink)' }}>5 días hábiles</strong> y te contactaremos por email con nuestra decisión.
          </p>
          <p style={{ color: 'var(--ink3)', fontSize: '13px', margin: '0 0 28px' }}>
            Mientras tanto, puedes explorar el programa o escribirnos a{' '}
            <a href="mailto:hola@wakia.app" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>
              hola@wakia.app
            </a>
          </p>
          <Link href="/" style={{
            display: 'inline-block',
            background: 'var(--navy)', color: 'var(--white)',
            borderRadius: '10px', padding: '13px 28px',
            fontSize: '14px', fontWeight: 800, textDecoration: 'none',
          }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

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
          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)' }}>WakiaYoung</span>
        </Link>
        <Link href="/login" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink3)', textDecoration: 'none' }}>
          Ingresar
        </Link>
      </nav>

      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--green-l)', borderRadius: '20px',
            padding: '5px 12px', marginBottom: '14px',
          }}>
            <span style={{ fontSize: '14px' }}>🎓</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green-d)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Beca completa · cupos limitados
            </span>
          </div>
          <h1 style={{ fontWeight: 900, fontSize: '30px', margin: '0 0 12px', color: 'var(--ink)', lineHeight: 1.2 }}>
            Solicitud de beca
          </h1>
          <p style={{ color: 'var(--ink3)', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>
            Queremos que el acceso económico no sea una barrera. Si sos Latino/a de 14 a 18 años y no podés pagar el programa, completá este formulario con honestidad.
          </p>
        </div>

        {/* What we cover box */}
        <div style={{
          background: 'var(--navy)', borderRadius: '14px',
          padding: '18px 20px', marginBottom: '28px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
        }}>
          {[
            ['✓', 'Acceso completo al programa'],
            ['✓', 'Mentoría personalizada'],
            ['✓', 'Certificación FGU incluida'],
            ['✓', 'Comunidad vitalicia'],
          ].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--green)', fontWeight: 800, fontSize: '14px' }}>{icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div style={{
          background: 'var(--white)', borderRadius: '18px',
          padding: '32px', border: '1px solid var(--border)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={label}>Nombre completo *</label>
                <input
                  style={input} type="text"
                  value={form.applicant_name}
                  onChange={e => update('applicant_name', e.target.value)}
                  required placeholder="Tu nombre completo"
                />
              </div>
              <div>
                <label style={label}>Email *</label>
                <input
                  style={input} type="email"
                  value={form.applicant_email}
                  onChange={e => update('applicant_email', e.target.value)}
                  required placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Age + Country */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={label}>Edad *</label>
                <input
                  style={input} type="number"
                  min="10" max="25"
                  value={form.applicant_age}
                  onChange={e => update('applicant_age', e.target.value)}
                  required placeholder="14–18"
                />
                <p style={hint}>El programa es para jóvenes de 14 a 18 años.</p>
              </div>
              <div>
                <label style={label}>País de residencia *</label>
                <input
                  style={input} type="text"
                  value={form.applicant_country}
                  onChange={e => update('applicant_country', e.target.value)}
                  required placeholder="México, Colombia, Argentina…"
                />
              </div>
            </div>

            {/* Motivation letter */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label style={{ ...label, marginBottom: 0 }}>Carta de motivación *</label>
                <span style={{ fontSize: '12px', fontWeight: 700, color: wordColor }}>
                  {words} / 200 palabras mínimo
                </span>
              </div>
              <textarea
                style={{ ...input, minHeight: '180px', resize: 'vertical' } as React.CSSProperties}
                value={form.motivation_letter}
                onChange={e => update('motivation_letter', e.target.value)}
                required
                placeholder="Contanos: ¿quién sos?, ¿por qué querés participar en WakiaYoung?, ¿qué problema te gustaría resolver con tecnología?, y ¿por qué necesitás la beca? Sé honesto/a — no hay respuesta incorrecta."
              />
              {words > 0 && !wordsOk && (
                <p style={{ ...hint, color: 'var(--coral)', fontWeight: 600 }}>
                  Necesitás {200 - words} palabras más.
                </p>
              )}
              {wordsOk && (
                <p style={{ ...hint, color: 'var(--green)', fontWeight: 600 }}>
                  ✓ Mínimo alcanzado
                </p>
              )}
            </div>

            {/* Video URL */}
            <div>
              <label style={label}>Video de presentación (opcional)</label>
              <input
                style={input} type="url"
                value={form.video_url}
                onChange={e => update('video_url', e.target.value)}
                placeholder="https://youtube.com/... o https://drive.google.com/..."
              />
              <p style={hint}>
                Un video de 1–2 minutos contándote un poco. Puede ser desde el celular — no hace falta que sea perfecto.
              </p>
            </div>

            {/* Reference */}
            <div>
              <label style={label}>Referencia (opcional)</label>
              <input
                style={input} type="text"
                value={form.reference_contact}
                onChange={e => update('reference_contact', e.target.value)}
                placeholder="Nombre y contacto de alguien que te conozca (docente, familiar, mentor…)"
              />
              <p style={hint}>
                Una persona que pueda hablar de vos: profesor/a, familiar, coach, etc. Incluí su nombre y email o teléfono.
              </p>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />

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
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? 'var(--ink4)' : 'var(--navy)',
                color: 'var(--white)', border: 'none', borderRadius: '10px',
                padding: '15px', fontWeight: 800, fontSize: '15px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                transition: 'background 0.15s',
              }}
            >
              {saving ? 'Enviando solicitud…' : 'Enviar solicitud de beca →'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: '12px', margin: 0 }}>
              Al enviar, aceptás nuestra{' '}
              <Link href="/privacidad" style={{ color: 'var(--teal)', textDecoration: 'none' }}>política de privacidad</Link>.
              {' '}No compartimos tu información con terceros.
            </p>

          </form>
        </div>

      </div>
    </div>
  )
}
