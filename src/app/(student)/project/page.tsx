'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DashboardResponse } from '@/types'

const WEEK_PHASES = [
  { week: 1, phase: 'Despertar', title: 'El problema que te duele', icon: '🔍' },
  { week: 2, phase: 'Despertar', title: 'IA como forma de pensar', icon: '🧠' },
  { week: 3, phase: 'Construir', title: 'Algo real en 5 días', icon: '🔨' },
  { week: 4, phase: 'Construir', title: 'Las 3 preguntas del negocio', icon: '💡' },
  { week: 5, phase: 'Construir', title: 'Agentes que trabajan mientras dormís', icon: '🤖' },
  { week: 6, phase: 'Lanzar', title: 'Demo Day: tu primer hito público', icon: '🚀' },
]

export default function ProjectPage() {
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Get current week from dashboard
      const res = await fetch('/api/student/dashboard')
      const json: DashboardResponse = await res.json()
      setCurrentWeek(json.data.cohort.current_week)

      // Get all deliverables for this user
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('deliverables')
        .select('*, weeks(week_number, title, phase, deliverable_description, success_signal)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      setDeliverables(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--teal)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const submittedCount = deliverables.filter(d => ['submitted', 'reviewed'].includes(d.status)).length
  const progressPercent = Math.round((submittedCount / 6) * 100)

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontWeight: 800, fontSize: '22px', margin: '0 0 8px' }}>Mi Proyecto</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
          Tu progreso a lo largo de las 6 semanas del programa
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px 24px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px' }}>Progreso del programa</span>
          <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--teal)' }}>{submittedCount}/6</span>
        </div>
        <div style={{ background: 'var(--border)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            background: 'var(--teal)',
            height: '100%',
            width: `${progressPercent}%`,
            borderRadius: '99px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <p style={{ color: '#6B7280', fontSize: '12px', margin: '8px 0 0' }}>
          {submittedCount === 6 ? '¡Programa completo! 🎉' : `${6 - submittedCount} entregable${6 - submittedCount !== 1 ? 's' : ''} por completar`}
        </p>
      </div>

      {/* 6-week timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {WEEK_PHASES.map(({ week, phase, title, icon }) => {
          const deliverable = deliverables.find(d => d.weeks?.week_number === week)
          const isSubmitted = deliverable && ['submitted', 'reviewed'].includes(deliverable.status)
          const isCurrent = week === currentWeek
          const isFuture = week > currentWeek
          const isLocked = isFuture && !deliverable

          return (
            <div
              key={week}
              style={{
                background: 'white',
                border: `1.5px solid ${isCurrent ? 'var(--teal)' : isSubmitted ? '#C6F6D5' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {/* Week number / status dot */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                  background: isSubmitted ? 'var(--green)' : isCurrent ? 'var(--teal)' : 'var(--border)',
                  color: isSubmitted || isCurrent ? 'white' : '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: isSubmitted ? '16px' : '14px',
                }}>
                  {isSubmitted ? '✓' : icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>Semana {week}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
                      background: phase === 'Despertar' ? '#EDE9FE' : phase === 'Construir' ? '#DBEAFE' : '#FEF3C7',
                      color: phase === 'Despertar' ? '#6D28D9' : phase === 'Construir' ? '#1D4ED8' : '#92400E',
                    }}>
                      {phase.toUpperCase()}
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--teal)', color: 'white', padding: '2px 7px', borderRadius: '99px' }}>
                        Esta semana
                      </span>
                    )}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)', margin: '0 0 6px' }}>{title}</p>

                  {deliverable ? (
                    <div>
                      {deliverable.status === 'draft' && (
                        <span style={{ fontSize: '12px', color: '#92400E', fontWeight: 600 }}>📝 Borrador guardado</span>
                      )}
                      {['submitted', 'reviewed'].includes(deliverable.status) && deliverable.content && (
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                          {deliverable.content.length > 150 ? deliverable.content.slice(0, 150) + '...' : deliverable.content}
                        </p>
                      )}
                      {deliverable.status === 'reviewed' && (
                        <span style={{ fontSize: '12px', color: 'var(--teal)', fontWeight: 700, display: 'block', marginTop: '6px' }}>
                          ✓ Revisado por mentor
                        </span>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
                      {isLocked ? 'Disponible cuando llegue esta semana' : 'Sin entregar aún'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Certificate preview if complete */}
      {submittedCount === 6 && (
        <div style={{
          marginTop: '24px',
          background: 'var(--navy)', color: 'white',
          borderRadius: 'var(--radius-lg)', padding: '28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</div>
          <h2 style={{ fontWeight: 800, fontSize: '20px', margin: '0 0 8px' }}>¡Completaste el programa!</h2>
          <p style={{ opacity: 0.7, fontSize: '14px', margin: '0 0 16px' }}>
            Tu certificado FGU será generado una vez que tu mentor valide todos tus entregables.
          </p>
        </div>
      )}

    </div>
  )
}
