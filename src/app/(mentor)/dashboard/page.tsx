'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MentorStudent {
  enrollment: { id: string; cohort_id: string; user_id: string }
  user: { id: string; full_name: string; nickname: string | null; avatar_url: string | null; country: string | null } | null
  cohortName: string
  lastActivityAt: string | null
  hoursInactive: number
  deliverableStatus: string
  hasSubmitted: boolean
  alertLevel: 'none' | 'yellow' | 'red'
  currentWeekNumber: number | null
}

interface MentorAlert {
  id: string
  studentId: string
  studentName: string
  cohortId: string
  alertType: string
  severity: 'yellow' | 'red'
  message: string
  createdAt: string
}

interface MentorDashboardData {
  mentor: { full_name: string; nickname: string | null; avatar_url: string | null }
  cohorts: Array<{
    id: string; name: string; current_week: number; status: string
    currentWeekData: { week_number: number; title: string; phase: string; due_date: string } | null
    submissionsThisWeek: number
    totalStudents: number
  }>
  students: MentorStudent[]
  alerts: MentorAlert[]
}

function AlertBadge({ level }: { level: 'none' | 'yellow' | 'red' }) {
  if (level === 'none') return null
  return (
    <span style={{
      display: 'inline-block',
      width: '8px', height: '8px',
      borderRadius: '50%',
      background: level === 'red' ? 'var(--coral)' : 'var(--gold)',
      flexShrink: 0,
    }} />
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    not_started: { bg: '#F3F4F6', color: '#6B7280', label: 'Pendiente' },
    draft:       { bg: '#FEF3C7', color: '#92400E', label: 'Borrador' },
    submitted:   { bg: '#D1FAE5', color: '#065F46', label: 'Entregado' },
    reviewed:    { bg: '#CCFBF1', color: '#0F766E', label: 'Revisado' },
  }
  const s = map[status] || map.not_started
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '11px', fontWeight: 700,
      padding: '3px 8px', borderRadius: '99px',
    }}>{s.label}</span>
  )
}

export default function MentorDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<MentorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'red' | 'yellow'>('all')
  const [selectedCohort, setSelectedCohort] = useState<string>('all')

  useEffect(() => {
    fetch('/api/mentor/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--magenta)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!data) return null

  const { cohorts, students, alerts } = data

  // Filter students
  const filtered = students.filter(s => {
    if (selectedCohort !== 'all' && s.enrollment.cohort_id !== selectedCohort) return false
    if (filter === 'red') return s.alertLevel === 'red'
    if (filter === 'yellow') return s.alertLevel === 'yellow' || s.alertLevel === 'red'
    return true
  })

  const redCount = students.filter(s => s.alertLevel === 'red').length
  const yellowCount = students.filter(s => s.alertLevel === 'yellow').length
  const submittedCount = students.filter(s => s.hasSubmitted).length

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontWeight: 800, fontSize: '22px', margin: '0 0 4px' }}>Panel del Mentor</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
          {cohorts.length} cohorte{cohorts.length !== 1 ? 's' : ''} activa{cohorts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Cohort cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {cohorts.map(cohort => (
          <div
            key={cohort.id}
            style={{
              background: 'white',
              border: `2px solid ${selectedCohort === cohort.id ? 'var(--magenta)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedCohort(selectedCohort === cohort.id ? 'all' : cohort.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 2px' }}>{cohort.name}</p>
                {cohort.currentWeekData && (
                  <p style={{ color: '#6B7280', fontSize: '12px', margin: 0 }}>
                    Semana {cohort.currentWeekData.week_number} — {cohort.currentWeekData.title}
                  </p>
                )}
              </div>
              <span style={{
                background: 'var(--navy)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '99px',
              }}>
                S{cohort.current_week}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: '22px', margin: 0, color: 'var(--teal)' }}>{cohort.submissionsThisWeek}</p>
                <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>Entregaron</p>
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '22px', margin: 0 }}>{cohort.totalStudents}</p>
                <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>Estudiantes</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {(redCount > 0 || yellowCount > 0) && (
        <div style={{
          background: '#FFF1F0',
          border: '1px solid rgba(255,92,53,0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: '36px', height: '36px', background: 'var(--coral)',
            borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
          }}>🚨</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: '14px', margin: '0 0 2px' }}>
              {redCount > 0 ? `${redCount} alerta${redCount !== 1 ? 's' : ''} roja${redCount !== 1 ? 's' : ''}` : ''}
              {redCount > 0 && yellowCount > 0 ? ' · ' : ''}
              {yellowCount > 0 ? `${yellowCount} amarilla${yellowCount !== 1 ? 's' : ''}` : ''}
            </p>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Estudiantes que necesitan atención</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {alerts.filter(a => a.severity === 'red').slice(0, 3).map(a => (
              <button
                key={a.id}
                onClick={() => router.push(`/students/${a.studentId}`)}
                style={{
                  background: 'white',
                  border: '1.5px solid var(--coral)',
                  borderRadius: '99px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--coral)',
                  cursor: 'pointer',
                }}
              >
                {a.studentName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { n: students.length, label: 'Estudiantes activos', color: 'var(--ink)' },
          { n: submittedCount, label: 'Entregaron esta semana', color: 'var(--teal)' },
          { n: redCount, label: 'Alertas rojas', color: 'var(--coral)' },
          { n: yellowCount, label: 'Alertas amarillas', color: 'var(--gold)' },
        ].map(({ n, label, color }) => (
          <div key={label} style={{
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '14px 16px',
          }}>
            <p style={{ fontWeight: 800, fontSize: '28px', margin: '0 0 4px', color }}>{n}</p>
            <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, lineHeight: 1.3 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>Filtrar:</span>
        {(['all', 'yellow', 'red'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: '99px',
              border: `1.5px solid ${filter === f ? 'var(--magenta)' : 'var(--border)'}`,
              background: filter === f ? 'var(--magenta)' : 'white',
              color: filter === f ? 'white' : 'var(--ink)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {f === 'all' ? 'Todos' : f === 'yellow' ? '🟡 Amarilla+' : '🔴 Roja'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B7280' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Students table */}
      <div style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
          padding: '10px 16px',
          background: '#F9FAFB',
          borderBottom: '1px solid var(--border)',
        }}>
          {['Estudiante', 'Cohorte', 'Entregable', 'Última actividad', ''].map(h => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
            No hay estudiantes con este filtro
          </div>
        )}

        {filtered.map(s => (
          <div
            key={s.enrollment.id}
            onClick={() => router.push(`/students/${s.enrollment.user_id}`)}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              alignItems: 'center',
              borderLeft: s.alertLevel === 'red' ? '3px solid var(--coral)' : s.alertLevel === 'yellow' ? '3px solid var(--gold)' : '3px solid transparent',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            {/* Student info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertBadge level={s.alertLevel} />
              <div
                style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'var(--teal)', color: 'white', fontWeight: 800,
                  fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {s.user?.avatar_url || s.user?.nickname?.slice(0, 2).toUpperCase() || '??'}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>
                  {s.user?.nickname || s.user?.full_name?.split(' ')[0] || 'Estudiante'}
                </p>
                {s.user?.country && <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{s.user.country}</p>}
              </div>
            </div>

            {/* Cohort */}
            <span style={{ fontSize: '12px', color: '#6B7280' }}>{s.cohortName}</span>

            {/* Deliverable */}
            <StatusChip status={s.deliverableStatus} />

            {/* Last activity */}
            <span style={{ fontSize: '12px', color: s.hoursInactive >= 48 ? 'var(--coral)' : '#6B7280' }}>
              {s.lastActivityAt
                ? s.hoursInactive < 1
                  ? 'Ahora'
                  : s.hoursInactive < 24
                  ? `Hace ${s.hoursInactive}h`
                  : s.hoursInactive < 48
                  ? 'Ayer'
                  : `Hace ${Math.floor(s.hoursInactive / 24)} días`
                : 'Nunca'}
            </span>

            {/* Action */}
            <span style={{ fontSize: '12px', color: 'var(--teal)', fontWeight: 600 }}>Ver →</span>
          </div>
        ))}
      </div>

    </div>
  )
}
