'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Badge, StatusBadge } from '@/components/ui'

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

function activityLabel(hoursInactive: number, lastActivityAt: string | null): string {
  if (!lastActivityAt) return 'Nunca'
  if (hoursInactive < 1) return 'Ahora'
  if (hoursInactive < 24) return `Hace ${hoursInactive}h`
  if (hoursInactive < 48) return 'Ayer'
  return `Hace ${Math.floor(hoursInactive / 24)} días`
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<MentorStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'red' | 'yellow' | 'submitted'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'status'>('activity')

  useEffect(() => {
    fetch('/api/mentor/dashboard')
      .then(r => r.json())
      .then(d => {
        const currentWeek = d.cohort?.current_week ?? 1
        const cohortName  = d.cohort?.name ?? ''
        const mapped: MentorStudent[] = (d.students ?? []).map((s: any) => ({
          enrollment: { id: s.user_id, cohort_id: s.cohort_id, user_id: s.user_id },
          user: {
            id: s.user_id,
            full_name: s.full_name ?? 'Estudiante',
            nickname: s.nickname ?? null,
            avatar_url: null,
            country: s.country ?? null,
          },
          cohortName,
          lastActivityAt: null,
          hoursInactive: s.hours_since_activity ?? 0,
          deliverableStatus: s.deliverables_submitted >= currentWeek ? 'submitted' : 'pending',
          hasSubmitted: s.deliverables_submitted >= currentWeek,
          alertLevel: (s.hours_since_activity ?? 0) >= 48
            ? 'red'
            : (s.hours_since_activity ?? 0) >= 24
            ? 'yellow'
            : 'none',
          currentWeekNumber: currentWeek,
        }))
        setStudents(mapped)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = students
    .filter(s => {
      const name = s.user?.nickname || s.user?.full_name || ''
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'red') return s.alertLevel === 'red'
      if (filter === 'yellow') return s.alertLevel === 'yellow' || s.alertLevel === 'red'
      if (filter === 'submitted') return s.hasSubmitted
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        const na = a.user?.nickname || a.user?.full_name || ''
        const nb = b.user?.nickname || b.user?.full_name || ''
        return na.localeCompare(nb)
      }
      if (sortBy === 'status') {
        const order = { reviewed: 0, submitted: 1, draft: 2, not_started: 3, pending: 4 }
        return (order[a.deliverableStatus as keyof typeof order] ?? 5) -
               (order[b.deliverableStatus as keyof typeof order] ?? 5)
      }
      // activity: most inactive first
      return b.hoursInactive - a.hoursInactive
    })

  const redCount = students.filter(s => s.alertLevel === 'red').length
  const yellowCount = students.filter(s => s.alertLevel === 'yellow').length
  const submittedCount = students.filter(s => s.hasSubmitted).length

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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '28px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '22px', margin: '0 0 4px' }}>Estudiantes</h1>
          <p style={{ color: 'var(--ink3)', fontSize: '13px', margin: 0 }}>
            {students.length} estudiante{students.length !== 1 ? 's' : ''} activo{students.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Buscar estudiante..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '9px 14px',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '13px',
            background: 'var(--white)',
            color: 'var(--ink)',
            outline: 'none',
            width: '220px',
          }}
        />
      </div>

      {/* Summary chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total', value: students.length, color: 'var(--ink)' },
          { label: 'Entregaron', value: submittedCount, color: 'var(--teal)' },
          { label: 'Alertas rojas', value: redCount, color: 'var(--coral)' },
          { label: 'Alertas amarillas', value: yellowCount, color: 'var(--gold)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 16px',
          }}>
            <p style={{ fontWeight: 800, fontSize: '26px', margin: '0 0 2px', color }}>{value}</p>
            <p style={{ fontSize: '11px', color: 'var(--ink3)', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filter + sort row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink3)' }}>Filtrar:</span>
        {([
          { key: 'all', label: 'Todos' },
          { key: 'red', label: '🔴 Alerta roja' },
          { key: 'yellow', label: '🟡 Alerta amarilla+' },
          { key: 'submitted', label: '✅ Entregaron' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '5px 13px',
              borderRadius: '99px',
              border: `1.5px solid ${filter === key ? 'var(--magenta)' : 'var(--border)'}`,
              background: filter === key ? 'var(--magenta)' : 'var(--white)',
              color: filter === key ? 'var(--white)' : 'var(--ink)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ink3)' }}>Ordenar:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '12px',
              color: 'var(--ink)',
              background: 'var(--white)',
              cursor: 'pointer',
            }}
          >
            <option value="activity">Actividad</option>
            <option value="name">Nombre</option>
            <option value="status">Entregable</option>
          </select>
          <span style={{ fontSize: '12px', color: 'var(--ink3)' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Student cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.length === 0 && (
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '40px', textAlign: 'center',
            color: 'var(--ink3)', fontSize: '14px',
          }}>
            No hay estudiantes con este filtro
          </div>
        )}

        {filtered.map(s => {
          const displayName = s.user?.nickname || s.user?.full_name?.split(' ')[0] || 'Estudiante'
          const isRed = s.alertLevel === 'red'
          const isYellow = s.alertLevel === 'yellow'

          return (
            <div
              key={s.enrollment.id}
              onClick={() => router.push(`/mentor/students/${s.enrollment.user_id}`)}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderLeft: isRed
                  ? '3px solid var(--coral)'
                  : isYellow
                  ? '3px solid var(--gold)'
                  : '3px solid transparent',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: '16px',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
            >
              {/* Student info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                {/* Alert pip */}
                {(isRed || isYellow) && (
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: isRed ? 'var(--coral)' : 'var(--gold)',
                  }} />
                )}
                <Avatar
                  name={s.user?.full_name ?? undefined}
                  avatarUrl={s.user?.avatar_url ?? undefined}
                  size="sm"
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--ink3)', margin: 0 }}>
                    {s.user?.full_name}
                    {s.user?.country ? ` · ${s.user.country}` : ''}
                    {s.cohortName ? ` · ${s.cohortName}` : ''}
                  </p>
                </div>
              </div>

              {/* Deliverable status */}
              <div style={{ textAlign: 'center', minWidth: '90px' }}>
                <p style={{ fontSize: '10px', color: 'var(--ink3)', margin: '0 0 4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  S{s.currentWeekNumber ?? '?'}
                </p>
                <StatusBadge status={s.deliverableStatus} />
              </div>

              {/* Last activity */}
              <div style={{ textAlign: 'right', minWidth: '90px' }}>
                <p style={{ fontSize: '10px', color: 'var(--ink3)', margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Actividad
                </p>
                <p style={{
                  fontSize: '12px', fontWeight: 600, margin: 0,
                  color: s.hoursInactive >= 72 ? 'var(--coral)' : s.hoursInactive >= 48 ? 'var(--gold)' : 'var(--ink2)',
                }}>
                  {activityLabel(s.hoursInactive, s.lastActivityAt)}
                </p>
              </div>

              {/* Arrow */}
              <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: '16px' }}>→</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
