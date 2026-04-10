'use client'

import { useState, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Student {
  user_id: string
  full_name: string
  nickname: string | null
  country: string | null
  pod_name: string | null
  deliverables_submitted: number
}

interface SessionData {
  cohortName: string
  currentWeek: number
  weekTitle: string
  deliverableDescription: string
  nextWeekQuestion: string | null
  students: Student[]
}

// ── Agenda blocks ─────────────────────────────────────────────────────────────

const AGENDA = [
  {
    id: 'checkin',
    time: '5 min',
    title: 'Check-in emocional',
    description: '¿Cómo llegaron hoy? Cada estudiante en una palabra o frase.',
    color: 'var(--teal)',
    colorL: 'var(--teal-l)',
  },
  {
    id: 'case',
    time: '15 min',
    title: 'Caso real LATAM',
    description: 'Presentar un caso real de emprendimiento latinoamericano relacionado con la semana.',
    color: 'var(--navy)',
    colorL: '#e8edf3',
  },
  {
    id: 'spotlight',
    time: '30 min',
    title: 'Spotlight de proyectos',
    description: '2–3 estudiantes presentan. El mentor actúa como usuario desconocido que prueba el producto.',
    color: 'var(--magenta)',
    colorL: 'var(--mag-l)',
  },
  {
    id: 'nextweek',
    time: '15 min',
    title: 'Pregunta de apertura — semana que viene',
    description: 'Dejar una pregunta abierta que genera curiosidad sobre el próximo reto.',
    color: 'var(--gold)',
    colorL: 'var(--gold-l)',
  },
  {
    id: 'qa',
    time: '10 min',
    title: 'Q&A',
    description: 'Preguntas libres. Cierre con energía positiva.',
    color: 'var(--green)',
    colorL: 'var(--green-l)',
  },
]

// ── Avatar helpers ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['var(--green)', 'var(--teal)', 'var(--magenta)', 'var(--gold)', 'var(--coral)']

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(full: string, nick: string | null) {
  const s = nick || full
  const p = s.trim().split(/\s+/)
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : s.slice(0, 2).toUpperCase()
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: '24px' }}>
      <style>{`
        @keyframes sk { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
        .sk { background:linear-gradient(90deg,var(--bg2) 25%,var(--bg) 50%,var(--bg2) 75%);
              background-size:1200px 100%;animation:sk 1.4s infinite;border-radius:10px; }
      `}</style>
      <div className="sk" style={{ height: 36, width: 260, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div>
          {[1,2,3,4,5].map(i => <div key={i} className="sk" style={{ height: 80, marginBottom: 10 }} />)}
        </div>
        <div className="sk" style={{ height: 420, borderRadius: 16 }} />
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function SessionPage() {
  const [data, setData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeBlock, setActiveBlock] = useState<string | null>(null)
  const [doneBlocks, setDoneBlocks] = useState<Set<string>>(new Set())
  const [spotlight, setSpotlight] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/mentor/dashboard`)
      .then(r => r.json())
      .then(payload => {
        if (!payload.cohort) { setLoading(false); return }

        const students: Student[] = (payload.students ?? []).map((s: any) => ({
          user_id: s.user_id,
          full_name: s.full_name,
          nickname: s.nickname ?? null,
          country: s.country ?? null,
          pod_name: s.pod_name ?? null,
          deliverables_submitted: s.deliverables_submitted ?? 0,
        }))

        setData({
          cohortName: payload.cohort.name,
          currentWeek: payload.cohort.current_week,
          weekTitle: payload.cohort.weekTitle ?? '',
          deliverableDescription: payload.cohort.deliverableDescription ?? '',
          nextWeekQuestion: payload.cohort.nextWeekQuestion ?? null,
          students,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  if (!data) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink3)' }}>
        No hay ninguna cohorte activa.
      </div>
    )
  }

  const DAY_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const today = new Date()
  const isSaturday = today.getDay() === 6
  const todayLabel = DAY_ES[today.getDay()]

  function toggleDone(id: string) {
    setDoneBlocks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
    if (activeBlock === id) setActiveBlock(null)
  }

  function toggleSpotlight(userId: string) {
    setSpotlight(prev => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else if (next.size < 3) {
        next.add(userId)
      }
      return next
    })
  }

  const totalMin = AGENDA.reduce((acc, b) => acc + parseInt(b.time), 0)
  const doneMin = AGENDA.filter(b => doneBlocks.has(b.id)).reduce((acc, b) => acc + parseInt(b.time), 0)
  const progressPct = Math.round((doneMin / totalMin) * 100)

  return (
    <div style={{ padding: '22px 24px 48px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            background: 'var(--navy)', color: 'rgba(255,255,255,0.65)',
            fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
          }}>
            Semana <b style={{ color: 'var(--magenta)' }}>{data.currentWeek}</b> de 6
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
            background: isSaturday ? 'var(--green-l)' : 'var(--gold-l)',
            color: isSaturday ? 'var(--green-d)' : '#b07a10',
          }}>
            {isSaturday ? '● Hoy es sábado — sesión en vivo' : `Próxima sesión: sábado (hoy es ${todayLabel})`}
          </div>
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 4px', color: 'var(--ink)' }}>
          Sesión del sábado
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink3)', margin: 0 }}>
          {data.cohortName} · Guía para la sesión en vivo de 60–75 minutos
        </p>
      </div>

      {/* ── Progress bar ── */}
      {doneBlocks.size > 0 && (
        <div style={{
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink2)' }}>Progreso de la sesión</span>
              <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{doneMin} / {totalMin} min</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--bg2)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${progressPct}%`,
                background: progressPct === 100 ? 'var(--green)' : 'var(--teal)',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
          {progressPct === 100 && (
            <span style={{ fontSize: 20 }}>🎉</span>
          )}
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* ── Left: Agenda ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AGENDA.map((block, idx) => {
            const isActive = activeBlock === block.id
            const isDone = doneBlocks.has(block.id)

            return (
              <div
                key={block.id}
                style={{
                  background: 'var(--white)',
                  border: `1px solid ${isActive ? block.color : isDone ? 'var(--border)' : 'var(--border)'}`,
                  borderLeft: `4px solid ${isDone ? 'var(--border)' : block.color}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  opacity: isDone ? 0.55 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', cursor: 'pointer',
                  }}
                  onClick={() => setActiveBlock(isActive ? null : block.id)}
                >
                  {/* Step number */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: isDone ? 'var(--bg2)' : block.colorL,
                    color: isDone ? 'var(--ink4)' : block.color,
                    fontWeight: 800, fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isDone ? '✓' : idx + 1}
                  </div>

                  {/* Title + time */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 700, fontSize: 14,
                      color: isDone ? 'var(--ink3)' : 'var(--ink)',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>
                      {block.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>
                      {block.time}
                    </div>
                  </div>

                  {/* Done toggle */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleDone(block.id) }}
                    style={{
                      padding: '5px 12px', borderRadius: 20,
                      fontSize: 11, fontWeight: 700,
                      border: `1.5px solid ${isDone ? 'var(--border)' : block.color}`,
                      background: isDone ? 'var(--bg2)' : block.colorL,
                      color: isDone ? 'var(--ink3)' : block.color,
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    {isDone ? 'Deshacer' : 'Hecho'}
                  </button>
                </div>

                {/* Expanded description */}
                {isActive && (
                  <div style={{
                    padding: '0 16px 14px 56px',
                    fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6,
                    borderTop: '1px solid var(--border)',
                    paddingTop: 12,
                  }}>
                    {block.description}

                    {/* Spotlight: show selected students */}
                    {block.id === 'spotlight' && spotlight.size > 0 && (
                      <div style={{
                        marginTop: 10,
                        background: 'var(--mag-l)',
                        borderRadius: 10, padding: '10px 12px',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--magenta)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Estudiantes en spotlight
                        </div>
                        {data.students
                          .filter(s => spotlight.has(s.user_id))
                          .map(s => (
                            <div key={s.user_id} style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>
                              {s.nickname || s.full_name.split(' ')[0]}
                              {s.country ? ` · ${s.country}` : ''}
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Next week: show question if available */}
                    {block.id === 'nextweek' && data.nextWeekQuestion && (
                      <div style={{
                        marginTop: 10,
                        background: 'var(--gold-l)',
                        borderRadius: 10, padding: '10px 12px',
                        fontSize: 13, color: 'var(--ink)',
                        fontStyle: 'italic',
                        lineHeight: 1.6,
                      }}>
                        "{data.nextWeekQuestion}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Right: Spotlight picker + Notes ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Spotlight picker */}
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                  Spotlight
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>
                  Seleccioná hasta 3 estudiantes
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: spotlight.size === 3 ? 'var(--green-l)' : 'var(--mag-l)',
                color: spotlight.size === 3 ? 'var(--green-d)' : 'var(--magenta)',
              }}>
                {spotlight.size}/3
              </span>
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {data.students.length === 0 && (
                <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--ink3)', textAlign: 'center' }}>
                  No hay estudiantes aún.
                </div>
              )}
              {data.students.map(s => {
                const selected = spotlight.has(s.user_id)
                const disabled = !selected && spotlight.size >= 3
                return (
                  <div
                    key={s.user_id}
                    onClick={() => !disabled && toggleSpotlight(s.user_id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border)',
                      cursor: disabled ? 'default' : 'pointer',
                      background: selected ? 'var(--mag-l)' : 'transparent',
                      opacity: disabled ? 0.4 : 1,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!selected && !disabled) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)' }}
                    onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: selected ? 'var(--magenta)' : avatarColor(s.full_name),
                      color: '#fff', fontWeight: 800, fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected ? '✦' : initials(s.full_name, s.nickname)}
                    </div>

                    {/* Name + pod */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: selected ? 700 : 600,
                        color: selected ? 'var(--magenta)' : 'var(--ink)',
                      }}>
                        {s.nickname || s.full_name.split(' ')[0]}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                        {[s.country, s.pod_name].filter(Boolean).join(' · ')}
                      </div>
                    </div>

                    {/* Submitted badge */}
                    {s.deliverables_submitted > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20,
                        background: 'var(--green-l)', color: 'var(--green-d)',
                        flexShrink: 0,
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Session notes */}
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid var(--border)',
              fontWeight: 800, fontSize: 14, color: 'var(--ink)',
            }}>
              Notas de la sesión
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tomá notas durante la sesión — destacados, observaciones, seguimientos..."
              style={{
                width: '100%', minHeight: 140,
                padding: '12px 16px',
                border: 'none', outline: 'none', resize: 'vertical',
                fontSize: 13, color: 'var(--ink)', lineHeight: 1.6,
                background: 'transparent', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
