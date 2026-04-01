'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// ── Inner component (needs useSearchParams) ────────────────────────────────────

function ConsentForm() {
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''
  const displayName  = searchParams.get('name')  ?? ''   // display-only, not used for auth

  const [status, setStatus]         = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]     = useState('')
  const [confirmedName, setConfirmedName] = useState('')  // name returned by API on success

  async function handleConsent() {
    if (!token) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/consent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Ocurrió un error. Intentá de nuevo.')
        setStatus('error')
        return
      }
      setConfirmedName(data.studentName ?? displayName)
      setStatus('success')
    } catch {
      setErrorMsg('No se pudo conectar. Verificá tu conexión e intentá de nuevo.')
      setStatus('error')
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--green-l)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 32,
        }}>✓</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>
          ¡Autorización confirmada!
        </h2>
        <p style={{ color: 'var(--ink2)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Gracias por autorizar la participación de <strong>{confirmedName}</strong> en
          Prospera Young AI. Tu hij@ ya puede acceder a todos los contenidos del programa.
        </p>
        <p style={{ color: 'var(--ink3)', fontSize: 13, marginTop: 16 }}>
          Podés cerrar esta ventana.
        </p>
      </div>
    )
  }

  // ── Invalid link state ─────────────────────────────────────────────────────
  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>
          Enlace inválido
        </h2>
        <p style={{ color: 'var(--ink2)', fontSize: 15, margin: 0 }}>
          Este enlace de consentimiento no es válido o ya expiró.
          Revisá el email que recibiste o contactá a{' '}
          <a href="mailto:hola@prosperayoung.ai" style={{ color: 'var(--teal)' }}>
            hola@prosperayoung.ai
          </a>
          .
        </p>
      </div>
    )
  }

  // ── Main consent form ──────────────────────────────────────────────────────
  return (
    <>
      {/* Header icon */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--gold-l)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', fontSize: 28,
      }}>
        👨‍👩‍👧
      </div>

      <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--navy)', textAlign: 'center' }}>
        Autorización de participación
      </h1>
      <p style={{ margin: '0 0 24px', color: 'var(--ink3)', fontSize: 14, textAlign: 'center' }}>
        Prospera Young AI · Programa intensivo 6 semanas
      </p>

      {/* Student card */}
      <div style={{
        background: 'var(--navy)', borderRadius: 14,
        padding: '18px 20px', marginBottom: 20, color: '#fff',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
          Estudiante
        </div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>
          {displayName || 'Tu hij@'}
        </div>
      </div>

      {/* Program info */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: '0 0 12px', color: 'var(--ink2)', fontSize: 14, lineHeight: 1.6 }}>
          Tu hij@ se inscribió en <strong>Prospera Young AI</strong>, un programa virtual
          intensivo de 6 semanas donde estudiantes de 14 a 18 años construyen productos
          reales usando inteligencia artificial.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            '📅 6 semanas de trabajo real — lunes a domingo',
            '🤖 Acceso a Luna, tutora de IA (solo contenido educativo)',
            '👥 Grupos pequeños de 4–5 estudiantes por zona horaria',
            '🏆 Certificación internacional respaldada por FGU',
            '🔒 Plataforma segura — sin redes sociales ni contacto externo',
          ].map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              fontSize: 13, color: 'var(--ink2)',
            }}>
              <span style={{ flexShrink: 0 }}>{item.split(' ')[0]}</span>
              <span>{item.split(' ').slice(1).join(' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div style={{
          background: '#ffede8', border: '1px solid var(--coral)',
          borderRadius: 10, padding: '12px 14px',
          color: 'var(--coral)', fontSize: 14, marginBottom: 16,
        }}>
          {errorMsg}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleConsent}
        disabled={status === 'loading'}
        style={{
          width: '100%', padding: '14px', border: 'none', cursor: 'pointer',
          borderRadius: 10, background: 'var(--green)', color: '#fff',
          fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
          opacity: status === 'loading' ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {status === 'loading' ? 'Procesando...' : 'Autorizar participación →'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink3)', marginTop: 14, marginBottom: 0 }}>
        Al confirmar, declarás que sos padre, madre o tutor legal{displayName ? ` de ${displayName}` : ''} y
        autorizás su participación en el programa.
      </p>
    </>
  )
}

// ── Page wrapper ───────────────────────────────────────────────────────────────

export default function ConsentPage() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{
            display: 'inline-block', background: 'var(--navy)', color: '#fff',
            fontWeight: 800, fontSize: 15, padding: '8px 18px', borderRadius: 10,
            letterSpacing: '-0.01em',
          }}>
            Prospera Young AI
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--white)', borderRadius: 20,
          padding: '32px 28px', boxShadow: '0 2px 16px rgba(14,42,71,0.09)',
        }}>
          <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--ink3)' }}>Cargando...</div>}>
            <ConsentForm />
          </Suspense>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink4)', marginTop: 20 }}>
          ¿Preguntas? Escribinos a{' '}
          <a href="mailto:hola@prosperayoung.ai" style={{ color: 'var(--teal)' }}>
            hola@prosperayoung.ai
          </a>
        </p>
      </div>
    </div>
  )
}
