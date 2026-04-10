'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DashboardResponse } from '@/types'
import {
  generateCertificate,
  type CertificateStudent,
  type CertificateCohort,
  type CompetencyScores,
  type EligibilityResult,
} from '@/lib/utils/certificate'

const WEEK_PHASES = [
  { week: 1, phase: 'Despertar', title: 'El problema que te duele', icon: '🔍' },
  { week: 2, phase: 'Despertar', title: 'IA como forma de pensar', icon: '🧠' },
  { week: 3, phase: 'Construir', title: 'Algo real en 5 días', icon: '🔨' },
  { week: 4, phase: 'Construir', title: 'Las 3 preguntas del negocio', icon: '💡' },
  { week: 5, phase: 'Construir', title: 'Agentes que trabajan mientras duermes', icon: '🤖' },
  { week: 6, phase: 'Lanzar', title: 'Demo Day: tu primer hito público', icon: '🚀' },
]

interface CertData {
  eligible:   boolean
  scored:     boolean
  scores:     CompetencyScores | null
  eligibility: EligibilityResult | null
  student:    CertificateStudent | null
  cohort:     CertificateCohort | null
}

export default function ProjectPage() {
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [currentWeek, setCurrentWeek]   = useState<number>(1)
  const [loading, setLoading]           = useState(true)
  const [noCohort, setNoCohort]         = useState(false)
  const [certData, setCertData]         = useState<CertData | null>(null)
  const [generating, setGenerating]     = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Parallel: dashboard (week info) + deliverables + certificate eligibility
      const [dashRes, delivRes, certRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/student/dashboard`),
        supabase
          .from('deliverables')
          .select('*, weeks(week_number, title, phase, deliverable_description, success_signal)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/certificate`),
      ])

      if (!dashRes.ok) { setNoCohort(true); setLoading(false); return }
      const dashJson: DashboardResponse = await dashRes.json()
      setCurrentWeek(dashJson.data.cohort.current_week)
      setDeliverables(delivRes.data || [])

      if (certRes.ok) {
        const c = await certRes.json()
        setCertData({
          eligible:    c.eligible ?? false,
          scored:      c.scored   ?? false,
          scores:      c.scores   ?? null,
          eligibility: c.eligibility ?? null,
          student: {
            fullName: dashJson.data.user.full_name,
            country:  dashJson.data.user.country,
            nickname: dashJson.data.user.nickname,
          },
          cohort: c.cohort ? {
            name:      c.cohort.name,
            market:    c.cohort.market,
            startDate: c.cohort.startDate,
            endDate:   c.cohort.endDate,
          } : null,
        })
      }

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

  if (noCohort) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '380px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
          <h2 style={{ fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>Tu cohorte todavía no está activa</h2>
          <p style={{ color: 'var(--ink3)', fontSize: '14px', lineHeight: 1.6 }}>
            Tu historial de proyecto estará disponible cuando arranque el programa.
          </p>
        </div>
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

      {/* Certificate section */}
      {certData && <CertificateSection certData={certData} generating={generating} onDownload={async () => {
        if (!certData?.eligible || !certData.student || !certData.cohort || !certData.scores) return
        setGenerating(true)
        try {
          await generateCertificate(certData.student, certData.cohort, certData.scores)
        } finally {
          setGenerating(false)
        }
      }} />}

    </div>
  )
}

// ── Certificate section component ─────────────────────────────────────────────

const COMP_LABELS: Record<keyof CompetencyScores, string> = {
  validation:    'Validación',
  creation:      'Creación',
  communication: 'Comunicación',
  growth:        'Crecimiento',
}

function CertificateSection({ certData, generating, onDownload }: {
  certData:   CertData
  generating: boolean
  onDownload: () => void
}) {
  const { eligible, scored, scores, eligibility } = certData

  // Not scored yet by mentor — neutral state
  if (!scored) {
    return (
      <div style={{
        marginTop: '24px',
        background: 'var(--navy)', color: 'white',
        borderRadius: '16px', padding: '28px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏆</div>
        <h2 style={{ fontWeight: 800, fontSize: '18px', margin: '0 0 8px' }}>Certificado FGU</h2>
        <p style={{ opacity: 0.7, fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
          Tu mentor evaluará tus competencias al finalizar el programa.<br />
          Una vez calificado, aparecerá aquí tu certificado para descargar.
        </p>
      </div>
    )
  }

  // Scored — show score breakdown + download or pending conditions
  return (
    <div style={{
      marginTop: '24px',
      background: eligible ? 'var(--navy)' : 'white',
      border: eligible ? 'none' : '1px solid var(--border)',
      borderRadius: '16px', padding: '28px',
      color: eligible ? 'white' : 'var(--ink)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ fontSize: '32px' }}>{eligible ? '🏆' : '📋'}</div>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '18px', margin: '0 0 2px' }}>
            {eligible ? '¡Certificado disponible!' : 'Certificado FGU — En progreso'}
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.7, margin: 0 }}>
            {eligible
              ? 'Cumpliste todas las condiciones. ¡Descargá tu certificado!'
              : `Promedio de competencias: ${eligibility?.averageScore.toFixed(2) ?? '—'} / 4.0`}
          </p>
        </div>
      </div>

      {/* Competency scores grid */}
      {scores && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px', marginBottom: '20px',
        }}>
          {(Object.keys(scores) as (keyof CompetencyScores)[]).map(key => {
            const score = scores[key]
            const barColor =
              score >= 3.5 ? 'var(--green)' :
              score >= 3.0 ? 'var(--teal)'  :
              score >= 2.0 ? 'var(--gold)'  : 'var(--coral)'

            return (
              <div key={key} style={{
                background: eligible ? 'rgba(255,255,255,0.08)' : 'var(--bg)',
                borderRadius: '10px', padding: '12px',
              }}>
                <div style={{
                  fontWeight: 800, fontSize: '20px',
                  color: eligible ? 'white' : barColor,
                  marginBottom: '4px',
                }}>
                  {score.toFixed(1)}
                  <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.6 }}> /4</span>
                </div>
                {/* Bar */}
                <div style={{
                  height: '4px', borderRadius: '99px',
                  background: eligible ? 'rgba(255,255,255,0.15)' : 'var(--border)',
                  marginBottom: '6px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '99px',
                    background: eligible ? 'var(--green)' : barColor,
                    width: `${(score / 4) * 100}%`,
                  }} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {COMP_LABELS[key]}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Eligible → download button */}
      {eligible ? (
        <button
          onClick={onDownload}
          disabled={generating}
          style={{
            width: '100%', padding: '14px',
            background: generating ? 'rgba(255,255,255,0.2)' : 'var(--green)',
            color: generating ? 'rgba(255,255,255,0.5)' : 'var(--navy)',
            border: 'none', borderRadius: '10px',
            fontWeight: 800, fontSize: '15px',
            cursor: generating ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', letterSpacing: '-0.01em',
            transition: 'background 0.15s',
          }}
        >
          {generating ? 'Generando PDF…' : '⬇ Descargar certificado FGU'}
        </button>
      ) : (
        // Not eligible yet — show which conditions are missing
        eligibility?.failedConditions.length ? (
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Condiciones pendientes
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {eligibility.failedConditions.map(cond => (
                <li key={cond} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  background: 'var(--coral-l)', borderRadius: '8px',
                  padding: '8px 12px', fontSize: '13px', color: 'var(--coral)',
                  fontWeight: 600,
                }}>
                  <span>✗</span>
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  )
}
