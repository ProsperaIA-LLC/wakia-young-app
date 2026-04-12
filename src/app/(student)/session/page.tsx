'use client'

import { useState, useEffect } from 'react'
import type { DashboardResponse } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const AGENDA = [
  {
    time: '5 min',
    title: 'Check-in emocional',
    description: 'Cada estudiante describe cómo llegó en una palabra. Nadie juzga.',
    icon: '💬',
    color: 'var(--teal)',
    colorL: 'var(--teal-l)',
  },
  {
    time: '15 min',
    title: 'Caso real LATAM',
    description: 'El mentor presenta un caso de emprendimiento latinoamericano relacionado con el tema de la semana.',
    icon: '🌎',
    color: 'var(--navy)',
    colorL: '#e8edf3',
  },
  {
    time: '30 min',
    title: 'Spotlight de proyectos',
    description: '2–3 estudiantes presentan su trabajo. El mentor actúa como usuario real que prueba el producto.',
    icon: '⭐',
    color: 'var(--magenta)',
    colorL: 'var(--mag-l)',
  },
  {
    time: '15 min',
    title: 'Pregunta de apertura — próxima semana',
    description: 'El mentor deja una pregunta que genera curiosidad sobre el reto que viene. No la respondas todavía.',
    icon: '💡',
    color: 'var(--gold)',
    colorL: 'var(--gold-l)',
  },
  {
    time: '10 min',
    title: 'Q&A libre',
    description: 'Preguntas abiertas. Cierre con energía. ¡Lo lograron esta semana!',
    icon: '🙌',
    color: 'var(--green)',
    colorL: 'var(--green-l)',
  },
]

function getNextSaturday(): Date {
  const today = new Date()
  const day = today.getDay() // 0=Sun ... 6=Sat
  const daysUntil = day === 6 ? 0 : 6 - day
  const sat = new Date(today)
  sat.setDate(today.getDate() + daysUntil)
  return sat
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function daysUntilSaturday(): number {
  const today = new Date()
  return today.getDay() === 6 ? 0 : 6 - today.getDay()
}

export default function SessionPage() {
  const [week, setWeek] = useState<DashboardResponse['data']['currentWeek'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/api/student/dashboard`)
      .then(r => r.json())
      .then((d: DashboardResponse) => { setWeek(d.data?.currentWeek ?? null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const nextSat = getNextSaturday()
  const isSaturday = new Date().getDay() === 6
  const daysLeft = daysUntilSaturday()

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--teal)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            background: isSaturday ? 'var(--green-l)' : 'var(--teal-l)',
            color: isSaturday ? 'var(--green-d)' : 'var(--teal)',
            fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {isSaturday ? '● Hoy es sábado — ¡sesión en vivo!' : `Sábado · faltan ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`}
          </span>
          {week && (
            <span style={{
              background: 'var(--bg2)', color: 'var(--ink3)',
              fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
            }}>
              Semana {week.week_number} de 6
            </span>
          )}
        </div>
        <h1 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 4px', color: 'var(--ink)' }}>
          Sesión del sábado
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)', margin: 0 }}>
          {formatDate(nextSat)} · 60–75 minutos con tu mentor
        </p>
      </div>

      {/* Week context card */}
      {week && (
        <div style={{
          background: 'var(--navy)', color: 'white',
          borderRadius: 16, padding: '20px 24px', marginBottom: 24,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
            Esta semana trabajamos en
          </p>
          <p style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.3 }}>
            {week.title}
          </p>
          <p style={{ fontSize: 13, opacity: 0.7, margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
            "{week.opening_question}"
          </p>
        </div>
      )}

      {/* Prepare callout */}
      <div style={{
        background: 'rgba(224,163,38,0.08)',
        border: '1px solid rgba(224,163,38,0.25)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 24,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>🎯</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', margin: '0 0 4px' }}>
            Cómo prepararte para el sábado
          </p>
          <ul style={{ fontSize: 13, color: 'var(--ink2)', margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
            <li>Tené tu entregable enviado antes de la sesión</li>
            <li>Preparate para explicar qué construiste en 2 minutos</li>
            <li>Pensá en una pregunta que quedó sin responder esta semana</li>
            <li>¡Prendé la cámara! La conexión con tus compañeros importa</li>
          </ul>
        </div>
      </div>

      {/* Agenda */}
      <h2 style={{ fontWeight: 800, fontSize: 16, margin: '0 0 14px', color: 'var(--ink)' }}>
        Agenda de la sesión
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {AGENDA.map((block, idx) => (
          <div
            key={block.title}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${block.color}`,
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}
          >
            {/* Step circle */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: block.colorL, color: block.color,
              fontWeight: 800, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{block.title}</span>
                <span style={{
                  fontSize: 11, color: 'var(--ink3)',
                  background: 'var(--bg2)', padding: '2px 7px', borderRadius: 10,
                }}>
                  {block.time}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink2)', margin: 0, lineHeight: 1.5 }}>
                {block.description}
              </p>
            </div>
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{block.icon}</span>
          </div>
        ))}
      </div>

      {/* Total time */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        color: 'var(--ink3)', fontSize: 13, marginBottom: 32,
      }}>
        <span>⏱</span>
        <span>Total: <strong>75 minutos</strong></span>
      </div>

      {/* Spotlight tip */}
      <div style={{
        background: 'var(--mag-l)',
        border: '1px solid rgba(165,8,107,0.15)',
        borderRadius: 12, padding: '14px 18px',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>⭐</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--magenta)', margin: '0 0 4px' }}>
            ¿Vas a estar en el Spotlight?
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink2)', margin: 0, lineHeight: 1.5 }}>
            El mentor selecciona 2–3 estudiantes por sesión para presentar. Si te toca, no necesitás nada perfecto — mostrá lo real, lo que funciona y lo que no. El aprendizaje está en el proceso, no en el resultado final.
          </p>
        </div>
      </div>

    </div>
  )
}
