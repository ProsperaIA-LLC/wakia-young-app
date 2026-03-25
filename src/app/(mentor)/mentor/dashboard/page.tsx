'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type {
  MentorDashboardData, CohortOverview, StudentProgress,
  MentorAlertWithStudent, PodSummaryWithPod, DeliverableWithStudent,
} from '@/types'

// ── API response shape ────────────────────────────────────────────────────────

interface Payload extends MentorDashboardData {
  mentor: { full_name: string; nickname: string | null; role: string }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['var(--green)', 'var(--coral)', 'var(--teal)', 'var(--gold)', 'var(--magenta)', '#163857']

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarColor(name: string, inactive = false) {
  if (inactive) return 'var(--ink4)'
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(full: string, nick: string | null) {
  const s = nick || full
  const p = s.trim().split(/\s+/)
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : s.slice(0, 2).toUpperCase()
}

function hoursLabel(h: number | null) {
  if (h === null) return 'Sin actividad'
  if (h < 1)  return 'Hace menos de 1 hr'
  if (h < 24) return `hace ${Math.floor(h)} hrs`
  if (h < 48) return 'ayer'
  return `hace ${Math.floor(h / 24)} días 🚨`
}

function fmtSubmitted(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  const h = Math.floor((Date.now() - d.getTime()) / 36e5)
  if (h < 1)  return 'hace menos de 1 hr'
  if (h < 24) return `hace ${h} hr${h > 1 ? 's' : ''}`
  if (h < 48) return 'ayer'
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ n, label, color }: { n: number | string; label: string; color: string }) {
  return (
    <div style={{
      background: 'var(--white)', borderRadius: 14,
      border: '1px solid var(--border)', padding: '14px 16px',
    }}>
      <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1, marginBottom: 4, color }}>{n}</div>
      <div style={{ fontSize: 11, color: 'var(--ink3)', lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

function DelivBadge({ submitted }: { submitted: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      textTransform: 'uppercase', letterSpacing: '0.04em',
      background: submitted ? 'var(--green-l)' : 'var(--coral-l)',
      color: submitted ? 'var(--green-d)' : 'var(--coral)',
    }}>
      {submitted ? 'Entregado' : 'Pendiente'}
    </span>
  )
}

function HoursBar({ hours }: { hours: number | null }) {
  const MAX_HOURS = 72
  const pct = hours === null ? 0 : Math.min(100, (hours / MAX_HOURS) * 100)
  const barColor = hours === null ? 'var(--ink4)'
    : hours < 24 ? 'var(--green)'
    : hours < 48 ? 'var(--gold)'
    : 'var(--coral)'
  return (
    <div style={{ height: 4, borderRadius: 2, background: 'var(--bg2)', marginTop: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: barColor }} />
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: '22px 24px' }}>
      <style>{`
        @keyframes sk { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        .sk { background:linear-gradient(90deg,var(--bg2) 25%,var(--bg) 50%,var(--bg2) 75%);
              background-size:1200px 100%;animation:sk 1.4s infinite;border-radius:10px; }
      `}</style>
      {/* stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
        {[1,2,3,4,5].map(i => <div key={i} className="sk" style={{ height: 72 }} />)}
      </div>
      <div className="sk" style={{ height: 64, borderRadius: 14, marginBottom: 16 }} />
      <div className="sk" style={{ height: 300, borderRadius: 16, marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[1,2,3].map(i => <div key={i} className="sk" style={{ height: 160, borderRadius: 14 }} />)}
      </div>
      <div className="sk" style={{ height: 160, borderRadius: 16 }} />
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function MentorDashboardPage() {
  const router = useRouter()
  const [data, setData]             = useState<Payload | null>(null)
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<'all' | 'yellow' | 'red'>('all')
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [resolvingAll, setResolvingAll] = useState(false)

  async function resolveAlert(alertId: string) {
    setResolvedIds(prev => new Set([...prev, alertId]))
    await fetch('/api/mentor/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId }),
    })
  }

  async function resolveAllAlerts(cohortId: string) {
    if (!data) return
    setResolvingAll(true)
    const allIds = [
      ...data.redAlerts.map(a => a.alert.id),
      ...data.yellowAlerts.map(a => a.alert.id),
    ]
    setResolvedIds(new Set(allIds))
    await fetch('/api/mentor/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolveAll: true, cohortId }),
    })
    setResolvingAll(false)
  }

  useEffect(() => {
    fetch('/api/mentor/dashboard')
      .then(async r => {
        if (r.status === 401 || r.status === 403) { router.replace('/login'); return }
        setData(await r.json())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <Skeleton />
  if (!data || !data.cohort) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink3)' }}>
        No hay ninguna cohorte activa en este momento.
      </div>
    )
  }

  const {
    mentor, cohort, overview, students,
    redAlerts, yellowAlerts, podSummaries, recentDeliverables,
  } = data

  // ── Derived values ──────────────────────────────────────────────────────────

  // Alert-level lookup per student
  const alertLevel = new Map<string, 'red' | 'yellow'>()
  for (const a of redAlerts)    alertLevel.set(a.alert.student_id, 'red')
  for (const a of yellowAlerts) if (!alertLevel.has(a.alert.student_id)) alertLevel.set(a.alert.student_id, 'yellow')

  // Who submitted this week (appear in recentDeliverables or total deliverables >= current_week)
  const submittedThisWeek = new Set(recentDeliverables.map(d => d.student.id))
  const submittedCount = students.filter(s =>
    submittedThisWeek.has(s.user_id) || s.deliverables_submitted >= cohort.current_week
  ).length

  // Pod count
  const podIds = new Set(students.map(s => s.pod_id).filter(Boolean))

  // Completion rate
  const completionRate = students.length > 0
    ? Math.round(submittedCount / students.length * 100)
    : 0

  // Alert students list for banner — filter out locally resolved ones
  const alertStudents = [
    ...redAlerts.map(a => ({ ...a, sev: 'red' as const })),
    ...yellowAlerts.map(a => ({ ...a, sev: 'yellow' as const })),
  ].filter(a => !resolvedIds.has(a.alert.id))

  const totalAlerts = alertStudents.length

  // Filtered students list
  const filtered = students.filter(s => {
    const lv = alertLevel.get(s.user_id)
    if (filter === 'red')    return lv === 'red'
    if (filter === 'yellow') return lv === 'red' || lv === 'yellow'
    return true
  })

  // Pod member mini faces from students
  function podMembers(podId: string) {
    return students.filter(s => s.pod_id === podId).slice(0, 5)
  }

  // Pod has alert?
  function podHasAlert(podId: string) {
    return students.some(s => s.pod_id === podId && alertLevel.has(s.user_id))
  }

  // Day label for topbar
  const DAY_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const todayLabel = DAY_ES[new Date().getDay()]

  const mentorLabel = mentor?.nickname || mentor?.full_name?.split(' ').map(p => p[0]).join('') || 'M'

  return (
    <>
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(245,244,240,0.97)',
        borderBottom: '1px solid var(--border)',
        padding: '11px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'var(--navy)', color: 'rgba(255,255,255,0.65)',
            fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
          }}>
            Cohorte <b style={{ color: 'var(--magenta)' }}>1</b> · Activa
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
            📍 Semana {cohort.current_week} de 6 · {todayLabel}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {totalAlerts > 0 && (
            <button
              onClick={() => setFilter(f => f === 'all' ? 'red' : 'all')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--coral-l)', border: '1px solid rgba(255,92,53,0.25)',
                padding: '5px 12px', borderRadius: 20,
                fontSize: 12, fontWeight: 700, color: 'var(--coral)', cursor: 'pointer',
              }}
            >
              ⚠ {totalAlerts} alerta{totalAlerts !== 1 ? 's' : ''} activa{totalAlerts !== 1 ? 's' : ''}
            </button>
          )}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--magenta)', color: '#fff',
            fontWeight: 800, fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {mentorLabel.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '22px 24px 40px' }}>

        {/* Stats row — 5 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
          <StatBox n={overview.active_students}                          label="Estudiantes activos"           color="var(--green)" />
          <StatBox n={submittedCount}                                    label={`Entregaron semana ${cohort.current_week}`} color="var(--gold)" />
          <StatBox n={totalAlerts}                                       label="Alertas sin resolver"          color="var(--coral)" />
          <StatBox n={podIds.size}                                       label="Pods activos"                  color="var(--teal)" />
          <StatBox n={`${completionRate}%`}                              label="Tasa de completación"          color="var(--magenta)" />
        </div>

        {/* Alerts banner */}
        {totalAlerts > 0 && (
          <div style={{
            background: 'var(--coral-l)', border: '1px solid rgba(255,92,53,0.2)',
            borderRadius: 14, padding: '14px 18px', marginBottom: 16,
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, background: 'var(--coral)', borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, flexShrink: 0,
              }}>
                🚨
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
                  {totalAlerts} estudiante{totalAlerts !== 1 ? 's' : ''} necesita{totalAlerts === 1 ? '' : 'n'} atención hoy
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                  Sin actividad por más de 48 horas
                </div>
              </div>
              <button
                onClick={() => resolveAllAlerts(cohort.id)}
                disabled={resolvingAll}
                style={{
                  background: 'var(--white)', border: '1.5px solid var(--coral)',
                  borderRadius: 8, padding: '6px 14px',
                  fontSize: 11, fontWeight: 700, color: 'var(--coral)',
                  cursor: resolvingAll ? 'not-allowed' : 'pointer',
                  opacity: resolvingAll ? 0.6 : 1, flexShrink: 0,
                }}
              >
                {resolvingAll ? 'Resolviendo...' : 'Resolver todas ✓'}
              </button>
            </div>
            {/* Per-student rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alertStudents.map(a => (
                <div key={a.alert.id} style={{
                  background: 'var(--white)', borderRadius: 10,
                  padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: a.sev === 'red' ? 'var(--coral)' : 'var(--gold)',
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', flex: 1 }}>
                    {a.student.full_name}
                    {a.student.country ? <span style={{ fontWeight: 400, color: 'var(--ink3)', marginLeft: 6 }}>· {a.student.country}</span> : null}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
                    {a.sev === 'red' ? '+48h sin actividad' : '+24h sin actividad'}
                  </span>
                  <button
                    onClick={() => router.push(`/mentor/students/${a.alert.student_id}`)}
                    style={{
                      background: 'var(--coral-l)', border: '1px solid rgba(255,92,53,0.3)',
                      borderRadius: 7, padding: '4px 10px',
                      fontSize: 11, fontWeight: 700, color: 'var(--coral)',
                      cursor: 'pointer',
                    }}
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => resolveAlert(a.alert.id)}
                    style={{
                      background: 'var(--green-l)', border: '1px solid rgba(0,200,150,0.3)',
                      borderRadius: 7, padding: '4px 10px',
                      fontSize: 11, fontWeight: 700, color: 'var(--green-d)',
                      cursor: 'pointer',
                    }}
                  >
                    Resolver ✓
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Students table ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>Estado de estudiantes</div>
            <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 1 }}>
              Semana {cohort.current_week} · Ordenados por actividad reciente
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'yellow', 'red'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  border: `1.5px solid ${filter === f ? 'var(--magenta)' : 'var(--border)'}`,
                  background: filter === f ? 'var(--magenta)' : 'var(--white)',
                  color: filter === f ? '#fff' : 'var(--ink3)',
                  cursor: 'pointer',
                }}
              >
                {f === 'all' ? 'Todos' : f === 'yellow' ? '🟡 Alerta' : '🔴 Urgente'}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: 'var(--white)', borderRadius: 16,
          border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16,
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
            padding: '10px 16px',
            background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          }}>
            {['Estudiante', 'Entregable', 'Última actividad', 'Reflexión', 'Pod', ''].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {h}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
              No hay estudiantes con este filtro.
            </div>
          )}

          {filtered.map((s: StudentProgress, idx) => {
            const lv = alertLevel.get(s.user_id)
            const hours = s.hours_since_activity
            const isRed    = lv === 'red'    || (hours !== null && hours >= 48)
            const isYellow = !isRed && (lv === 'yellow' || (hours !== null && hours >= 24))
            const hasSubmitted = submittedThisWeek.has(s.user_id) || s.deliverables_submitted >= cohort.current_week
            const hasReflection = s.reflections_submitted > 0

            return (
              <div
                key={s.user_id}
                onClick={() => router.push(`/mentor/students/${s.user_id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
                  padding: '12px 16px', alignItems: 'center',
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', transition: 'background .12s',
                  borderLeft: isRed ? '3px solid var(--coral)' : isYellow ? '3px solid var(--gold)' : '3px solid transparent',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '' }}
              >
                {/* Student info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: avatarColor(s.full_name, isRed && !lv),
                    color: isRed && !lv ? 'var(--ink2)' : '#fff',
                    fontWeight: 800, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {initials(s.full_name, s.nickname)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                      {s.full_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                      {[s.country, s.pod_name].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>

                {/* Deliverable */}
                <div><DelivBadge submitted={hasSubmitted} /></div>

                {/* Last activity + bar */}
                <div>
                  <div style={{
                    fontSize: 12,
                    color: isRed ? 'var(--coral)' : 'var(--ink2)',
                    fontWeight: isRed ? 700 : 400,
                  }}>
                    {hoursLabel(hours)}
                  </div>
                  <HoursBar hours={hours} />
                </div>

                {/* Reflection */}
                <div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    background: hasReflection ? 'var(--teal-l)' : 'var(--gold-l)',
                    color: hasReflection ? 'var(--teal)' : '#b07a10',
                  }}>
                    {hasReflection ? 'Hecha' : 'Dom'}
                  </span>
                </div>

                {/* Pod */}
                <div style={{ fontSize: 12, color: 'var(--ink2)' }}>
                  {s.pod_name ?? '—'}
                  {s.is_pod_leader_this_week && (
                    <span style={{ color: 'var(--gold)', marginLeft: 3 }}>✦</span>
                  )}
                </div>

                {/* Action button */}
                <div>
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/mentor/students/${s.user_id}`) }}
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      background: isRed || isYellow ? 'var(--coral-l)' : 'var(--teal-l)',
                      color: isRed || isYellow ? 'var(--coral)' : 'var(--teal)',
                      transition: 'all .15s',
                    }}
                  >
                    {isRed || isYellow ? 'Contactar' : '+ Nota'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Pod summaries grid ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
              Resúmenes de pods · Semana {cohort.current_week}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 1 }}>
              Enviados por los Pod Leaders el viernes
            </div>
          </div>
          <button
            onClick={() => router.push('/mentor/pods')}
            style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Ver todos →
          </button>
        </div>

        {podSummaries.length === 0 ? (
          <div style={{
            background: 'var(--white)', borderRadius: 14,
            border: '1px solid var(--border)', padding: '20px 18px',
            fontSize: 13, color: 'var(--ink3)', marginBottom: 16,
          }}>
            Ningún Pod Leader ha enviado el resumen esta semana todavía.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            {podSummaries.map((item: PodSummaryWithPod) => {
              const members = podMembers(item.pod.id)
              const hasAlert = podHasAlert(item.pod.id)

              return (
                <div
                  key={item.summary.id}
                  style={{
                    background: 'var(--white)', borderRadius: 14,
                    border: `1px solid ${hasAlert ? 'var(--coral)' : 'var(--border)'}`,
                    padding: 16,
                  }}
                >
                  {/* Pod card header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                        {item.pod.name}
                      </div>
                      {item.pod.timezone_region && (
                        <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>
                          {item.pod.timezone_region}
                        </div>
                      )}
                    </div>
                    {hasAlert && (
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--coral)', flexShrink: 0, marginTop: 3 }} />
                    )}
                  </div>

                  {/* Summary text */}
                  <div style={{
                    background: 'var(--bg)', borderRadius: 8, padding: '10px 12px',
                    marginBottom: 10,
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--ink3)',
                      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
                    }}>
                      Resumen del Pod Leader ({item.podLeader.nickname || item.podLeader.full_name.split(' ')[0]})
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{item.summary.summary_text}"
                    </div>
                  </div>

                  {/* Mini member faces */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {members.map(m => {
                      const mAlert = alertLevel.get(m.user_id)
                      return (
                        <div
                          key={m.user_id}
                          title={m.nickname || m.full_name.split(' ')[0]}
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: avatarColor(m.full_name, mAlert === 'red'),
                            color: mAlert === 'red' ? 'var(--ink2)' : '#fff',
                            fontSize: 10, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative', flexShrink: 0,
                          }}
                        >
                          {initials(m.full_name, m.nickname)}
                          {mAlert && (
                            <div style={{
                              position: 'absolute', top: -1, right: -1,
                              width: 8, height: 8, borderRadius: '50%',
                              background: mAlert === 'red' ? 'var(--coral)' : 'var(--gold)',
                              border: '1.5px solid var(--white)',
                            }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Recent deliverables ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
            Entregables recientes para revisar
          </div>
          <button
            onClick={() => router.push('/mentor/students')}
            style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Ver todos →
          </button>
        </div>

        {recentDeliverables.length === 0 ? (
          <div style={{
            background: 'var(--white)', borderRadius: 16,
            border: '1px solid var(--border)', padding: '20px 18px',
            fontSize: 13, color: 'var(--ink3)',
          }}>
            No hay entregables pendientes de revisión esta semana. 🎉
          </div>
        ) : (
          <div style={{
            background: 'var(--white)', borderRadius: 16,
            border: '1px solid var(--border)', overflow: 'hidden',
          }}>
            {recentDeliverables.map((item: DeliverableWithStudent, idx) => (
              <div
                key={item.deliverable.id}
                onClick={() => router.push(`/mentor/students/${item.student.id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 120px',
                  gap: 12, padding: '12px 16px', alignItems: 'center',
                  borderBottom: idx < recentDeliverables.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', transition: 'background .12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '' }}
              >
                {/* Student + preview */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    {item.student.full_name}
                    {item.student.country ? ` · ${item.student.country}` : ''}
                  </div>
                  {item.deliverable.content && (
                    <div style={{
                      fontSize: 12, color: 'var(--ink3)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: 300,
                    }}>
                      {item.deliverable.content}
                    </div>
                  )}
                </div>

                {/* Week */}
                <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                  Semana {item.week.week_number}
                  {item.week.title && (
                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1 }}>{item.week.title}</div>
                  )}
                </div>

                {/* Time */}
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                  {fmtSubmitted(item.deliverable.submitted_at)}
                </div>

                {/* Action */}
                <div>
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/mentor/students/${item.student.id}`) }}
                    style={{
                      background: 'var(--navy)', color: '#fff',
                      border: 'none', borderRadius: 8, padding: '6px 14px',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'background .15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--navy2)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--navy)' }}
                  >
                    Revisar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  )
}
