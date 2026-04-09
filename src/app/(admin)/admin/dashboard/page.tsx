'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────────

interface StatsData {
  usersByRole: { students: number; mentors: number; admins: number; total: number }
  totalEnrollments: number
  totalRevenue: number
  activeCohort: {
    id: string; name: string; market: string; status: string
    current_week: number; start_date: string; end_date: string; max_students: number
  } | null
  pendingScholarships: number
  cohortCounts: { upcoming: number; active: number; completed: number; total: number }
  recentEnrollments: Array<{
    id: string; market: string; pricePaid: number | null; isScholarship: boolean
    enrolledAt: string
    student: { fullName: string; nickname: string | null; country: string | null } | null
    cohortName: string | null
  }>
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtUSD(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, color = 'var(--ink)', accent,
}: {
  label: string; value: string | number; sub?: string; color?: string; accent?: string
}) {
  return (
    <div style={{
      background: 'var(--white)', border: `1.5px solid ${accent ?? 'var(--border)'}`,
      borderRadius: 14, padding: '18px 20px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: sub ? 4 : 0 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <style>{`
        @keyframes sh { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .sk { background: linear-gradient(90deg,var(--bg2) 25%,var(--bg) 50%,var(--bg2) 75%);
              background-size: 800px 100%; animation: sh 1.4s infinite; border-radius: 12px; }
      `}</style>
      <div className="sk" style={{ height: 32, width: 220, marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[1,2,3,4].map(i => <div key={i} className="sk" style={{ height: 100 }} />)}
      </div>
      <div className="sk" style={{ height: 280 }} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => { setError('No se pudieron cargar las estadísticas'); setLoading(false) })
  }, [])

  if (loading) return <Skeleton />
  if (error || !stats) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--coral)' }}>{error}</div>
  )

  const { usersByRole, totalEnrollments, totalRevenue, activeCohort, pendingScholarships, cohortCounts, recentEnrollments } = stats

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 4px', color: 'var(--ink)' }}>
          Panel de administración
        </h1>
        <p style={{ color: 'var(--ink3)', fontSize: 13, margin: 0 }}>
          Vista global de la plataforma WakiaYoung
        </p>
      </div>

      {/* Scholarship alert */}
      {pendingScholarships > 0 && (
        <div
          onClick={() => router.push('/admin/scholarships')}
          style={{
            background: 'var(--gold-l)', border: '1.5px solid var(--gold)',
            borderRadius: 12, padding: '12px 18px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 18 }}>✦</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
              {pendingScholarships} solicitud{pendingScholarships !== 1 ? 'es' : ''} de beca pendiente{pendingScholarships !== 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: 13, color: 'var(--ink3)', marginLeft: 8 }}>
              Requieren revisión →
            </span>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Estudiantes" value={usersByRole.students} sub={`${usersByRole.mentors} mentores · ${usersByRole.admins} admins`} color="var(--teal)" accent="var(--teal)" />
        <StatCard label="Inscripciones" value={totalEnrollments} color="var(--ink)" />
        <StatCard label="Revenue total" value={fmtUSD(totalRevenue)} color="var(--green-d)" accent="var(--green)" />
        <StatCard label="Cohortes" value={cohortCounts.total} sub={`${cohortCounts.active} activa · ${cohortCounts.completed} completadas`} color="var(--navy)" />
      </div>

      {/* Active cohort banner */}
      {activeCohort ? (
        <div style={{
          background: 'var(--navy)', color: '#fff',
          borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Cohorte activa
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{activeCohort.name}</div>
            <div style={{ fontSize: 13, opacity: 0.65 }}>
              {activeCohort.market} · {fmtDate(activeCohort.start_date)} → {fmtDate(activeCohort.end_date)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, textAlign: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 26, color: 'var(--gold)' }}>
                S{activeCohort.current_week}
              </div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Semana actual</div>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 26 }}>
                {activeCohort.max_students}
              </div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Capacidad</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg2)', border: '1.5px dashed var(--border)',
          borderRadius: 16, padding: '24px', marginBottom: 24, textAlign: 'center',
        }}>
          <p style={{ color: 'var(--ink3)', fontSize: 14, margin: '0 0 12px' }}>
            No hay cohorte activa en este momento
          </p>
          <button
            onClick={() => router.push('/admin/cohorts')}
            style={{
              background: 'var(--navy)', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 20px', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Crear cohorte →
          </button>
        </div>
      )}

      {/* Recent enrollments */}
      <div style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontWeight: 800, fontSize: 15, margin: 0 }}>
            Últimas inscripciones
          </h2>
          <button
            onClick={() => router.push('/admin/users')}
            style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Ver todos →
          </button>
        </div>

        {recentEnrollments.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink3)', fontSize: 14 }}>
            Sin inscripciones aún
          </div>
        ) : (
          <div>
            {recentEnrollments.map((e, i) => {
              const name = e.student?.nickname || e.student?.fullName?.split(' ')[0] || 'Estudiante'
              return (
                <div
                  key={e.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                    alignItems: 'center', gap: 16,
                    padding: '13px 20px',
                    borderBottom: i < recentEnrollments.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{name}</span>
                    {e.student?.country && (
                      <span style={{ fontSize: 12, color: 'var(--ink3)', marginLeft: 6 }}>
                        {e.student.country}
                      </span>
                    )}
                    {e.cohortName && (
                      <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1 }}>{e.cohortName}</div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                    background: e.market === 'USA' ? 'var(--teal-l)' : 'var(--navy)',
                    color: e.market === 'USA' ? 'var(--teal)' : '#fff',
                  }}>
                    {e.market}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: e.isScholarship ? 'var(--gold)' : 'var(--green-d)',
                  }}>
                    {e.isScholarship ? '✦ Beca' : fmtUSD(e.pricePaid ?? 0)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                    {fmtDate(e.enrolledAt)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
