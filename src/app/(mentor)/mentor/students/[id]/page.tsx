'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface StudentProfile {
  id: string
  full_name: string
  nickname: string | null
  avatar_url: string | null
  country: string | null
  age: number | null
  timezone: string | null
  created_at: string
}

interface DeliverableRow {
  id: string
  week_id: string
  status: string
  content: string | null
  created_at: string
  week: { week_number: number; title: string; phase: string } | null
}

interface ReflectionRow {
  id: string
  week_id: string
  q1: string | null
  q2: string | null
  q3: string | null
  mentor_feedback: string | null
  created_at: string
  week: { week_number: number; title: string } | null
}

interface NoteRow {
  id: string
  content: string
  created_at: string
}

interface ScoreRow {
  validation_score:    number
  creation_score:      number
  communication_score: number
  growth_score:        number
  attendance_percent:  number
  presented_at_demo_day: boolean
  notes: string | null
  scored_at: string | null
}

const COMPETENCY_META = [
  { key: 'validation_score',    label: 'Validación',    desc: 'Semanas 1–2', color: 'var(--teal)' },
  { key: 'creation_score',      label: 'Creación',      desc: 'Semanas 3–5', color: 'var(--magenta)' },
  { key: 'communication_score', label: 'Comunicación',  desc: 'Semana 6',    color: 'var(--green-d)' },
  { key: 'growth_score',        label: 'Crecimiento',   desc: 'Todo el programa', color: 'var(--gold)' },
] as const

function ScoreSlider({
  label, desc, color, value, onChange,
}: {
  label: string; desc: string; color: string; value: number; onChange: (v: number) => void
}) {
  const pct = (value / 4) * 100
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{label}</span>
          <span style={{ fontSize: 11, color: 'var(--ink3)', marginLeft: 6 }}>{desc}</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, color, minWidth: 30, textAlign: 'right' }}>
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range" min={0} max={4} step={0.5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, height: 4, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink4)', marginTop: 2 }}>
        <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
      </div>
    </div>
  )
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [deliverables, setDeliverables] = useState<DeliverableRow[]>([])
  const [reflections, setReflections] = useState<ReflectionRow[]>([])
  const [notes, setNotes] = useState<NoteRow[]>([])
  const [cohortId, setCohortId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [savingFeedback, setSavingFeedback] = useState(false)

  // Competency scores
  const [scores, setScores] = useState<ScoreRow>({
    validation_score: 0, creation_score: 0, communication_score: 0, growth_score: 0,
    attendance_percent: 0, presented_at_demo_day: false, notes: null, scored_at: null,
  })
  const [savingScores, setSavingScores] = useState(false)
  const [scoresSaved, setScoresSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Student profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      setStudent(profileData)

      // Active enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('cohort_id')
        .eq('user_id', id)
        .eq('status', 'active')
        .single()
      if (enrollment) setCohortId(enrollment.cohort_id)

      // All deliverables
      const { data: delivData } = await supabase
        .from('deliverables')
        .select('*, weeks(week_number, title, phase)')
        .eq('user_id', id)
        .order('created_at', { ascending: true })
      if (delivData) setDeliverables(delivData.map((d: any) => ({ ...d, week: d.weeks ?? null })))

      // All submitted reflections
      const { data: reflData } = await supabase
        .from('reflections')
        .select('id, q1, q2, q3, mentor_feedback, created_at, week_id, weeks(week_number, title)')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
      if (reflData) setReflections(reflData.map((r: any) => ({ ...r, week: r.weeks ?? null })))

      // Mentor notes
      const { data: notesData } = await supabase
        .from('mentor_notes')
        .select('id, note, created_at')
        .eq('student_id', id)
        .order('created_at', { ascending: false })
      if (notesData) setNotes(notesData.map((n: any) => ({ ...n, content: n.note })))

      // Competency scores (via API to use service role)
      if (enrollment?.cohort_id) {
        const scoresRes = await fetch(`/api/mentor/scores?student_id=${id}&cohort_id=${enrollment.cohort_id}`)
        if (scoresRes.ok) {
          const scoresJson = await scoresRes.json()
          if (scoresJson.scores) setScores(scoresJson.scores)
        }
      }

      setLoading(false)
    }
    load()
  }, [id])

  async function saveNote() {
    if (!newNote.trim() || !cohortId) return
    setSavingNote(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('mentor_notes').insert({
      mentor_id: user.id,
      student_id: id,
      cohort_id: cohortId,
      note: newNote.trim(),
    }).select('id, note, created_at').single()

    if (data) setNotes(prev => [{ ...data, content: (data as any).note }, ...prev])
    setNewNote('')
    setSavingNote(false)
  }

  async function saveReflectionFeedback() {
    if (!feedbackId || !feedback.trim()) return
    setSavingFeedback(true)
    const res = await fetch('/api/reflections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reflectionId: feedbackId, mentorFeedback: feedback }),
    })
    if (res.ok) {
      setReflections(prev => prev.map(r => r.id === feedbackId ? { ...r, mentor_feedback: feedback } : r))
    }
    setFeedbackId(null)
    setFeedback('')
    setSavingFeedback(false)
  }

  async function saveScores() {
    if (!cohortId) return
    setSavingScores(true)
    setScoresSaved(false)
    const res = await fetch('/api/mentor/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: id, cohort_id: cohortId, ...scores }),
    })
    if (res.ok) {
      const json = await res.json()
      setScores(json.scores)
      setScoresSaved(true)
      setTimeout(() => setScoresSaved(false), 3000)
    }
    setSavingScores(false)
  }

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

  if (!student) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>Estudiante no encontrado</div>
  )

  const submittedCount = deliverables.filter(d => ['submitted', 'reviewed'].includes(d.status)).length

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Back */}
      <button
        onClick={() => router.back()}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontWeight: 600, fontSize: '13px', marginBottom: '20px', padding: 0 }}
      >
        ← Volver al panel
      </button>

      {/* Student header */}
      <div style={{
        background: 'var(--navy)', color: 'white',
        borderRadius: 'var(--radius-lg)', padding: '28px',
        marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'var(--magenta)', color: 'white', fontWeight: 800,
          fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {(student.nickname || student.full_name).slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontWeight: 800, fontSize: '22px', margin: '0 0 4px' }}>
            {student.nickname || student.full_name.split(' ')[0]}
          </h1>
          <p style={{ opacity: 0.6, fontSize: '13px', margin: 0 }}>
            {student.full_name}
            {student.country && ` · ${student.country}`}
            {student.age && ` · ${student.age} años`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: '24px', margin: 0, color: 'var(--teal)' }}>{submittedCount}</p>
            <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Entregados</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: '24px', margin: 0, color: 'var(--gold)' }}>{reflections.length}</p>
            <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Reflexiones</p>
          </div>
        </div>
      </div>

      {/* Deliverables progress */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>Entregables (6 semanas)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {deliverables.length === 0 && (
            <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Sin entregables aún.</p>
          )}
          {deliverables.map(d => (
            <div key={d.id} style={{
              background: 'white', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '14px 18px',
              display: 'flex', alignItems: 'flex-start', gap: '14px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>
                    S{d.week?.week_number ?? '?'} — {d.week?.title ?? 'Entregable'}
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                    background: ['submitted', 'reviewed'].includes(d.status) ? '#D1FAE5' : '#FEF3C7',
                    color: ['submitted', 'reviewed'].includes(d.status) ? '#065F46' : '#92400E',
                  }}>
                    {d.status === 'submitted' ? 'Entregado' : d.status === 'reviewed' ? 'Revisado' : 'Borrador'}
                  </span>
                </div>
                {d.content && (
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {d.content.length > 200 ? d.content.slice(0, 200) + '...' : d.content}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reflections with feedback */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>Reflexiones</h2>
        {reflections.length === 0 && (
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Sin reflexiones aún.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reflections.map(r => (
            <div key={r.id} style={{
              background: 'white', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>
                  S{r.week?.week_number ?? '?'} — {r.week?.title ?? 'Reflexión'}
                </span>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  {new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                {[
                  { label: '¿Qué aprendiste esta semana?', value: r.q1 },
                  { label: '¿Qué cambiarás la semana que viene?', value: r.q2 },
                  { label: '¿Qué hiciste diferente esta semana?', value: r.q3 },
                ].map(({ label, value }) => value && (
                  <div key={label}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', margin: '0 0 3px', textTransform: 'uppercase' }}>{label}</p>
                    <p style={{ fontSize: '13px', color: 'var(--ink)', margin: 0, lineHeight: 1.5 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Mentor feedback */}
              {r.mentor_feedback ? (
                <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--teal)', margin: '0 0 4px' }}>Tu feedback</p>
                  <p style={{ fontSize: '13px', color: 'var(--ink)', margin: 0 }}>{r.mentor_feedback}</p>
                </div>
              ) : feedbackId === r.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Escribí tu feedback para esta reflexión..."
                    style={{
                      width: '100%', minHeight: '80px', padding: '10px 12px',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                      fontFamily: 'inherit', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={saveReflectionFeedback}
                      disabled={savingFeedback || !feedback.trim()}
                      style={{
                        background: 'var(--teal)', color: 'white', border: 'none',
                        borderRadius: 'var(--radius)', padding: '8px 16px', fontWeight: 700,
                        fontSize: '12px', cursor: 'pointer',
                      }}
                    >
                      {savingFeedback ? 'Guardando...' : 'Guardar feedback'}
                    </button>
                    <button
                      onClick={() => { setFeedbackId(null); setFeedback('') }}
                      style={{
                        background: 'none', color: '#6B7280', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)', padding: '8px 16px', fontWeight: 600,
                        fontSize: '12px', cursor: 'pointer',
                      }}
                    >Cancelar</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setFeedbackId(r.id)}
                  style={{
                    background: 'none', color: 'var(--teal)', border: '1px solid var(--teal)',
                    borderRadius: 'var(--radius)', padding: '6px 14px', fontWeight: 600,
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  + Dar feedback
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Mentor notes */}
      <section>
        <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>Notas del mentor</h2>
        <div style={{
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px 18px',
          marginBottom: '12px',
        }}>
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Añadí una nota privada sobre este estudiante..."
            style={{
              width: '100%', minHeight: '80px', padding: '10px 12px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              fontFamily: 'inherit', fontSize: '13px', resize: 'vertical',
              boxSizing: 'border-box', marginBottom: '10px',
            }}
          />
          <button
            onClick={saveNote}
            disabled={savingNote || !newNote.trim()}
            style={{
              background: 'var(--magenta)', color: 'white', border: 'none',
              borderRadius: 'var(--radius)', padding: '8px 18px', fontWeight: 700,
              fontSize: '13px', cursor: savingNote ? 'not-allowed' : 'pointer',
              opacity: savingNote ? 0.7 : 1,
            }}
          >
            {savingNote ? 'Guardando...' : 'Guardar nota'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notes.map(n => (
            <div key={n.id} style={{
              background: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 'var(--radius)', padding: '12px 14px',
            }}>
              <p style={{ fontSize: '13px', color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.5 }}>{n.content}</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                {new Date(n.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Competency Scoring ── */}
      <section style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', margin: 0 }}>Evaluación de competencias</h2>
          {scores.scored_at && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: 'var(--green-l)', color: 'var(--green-d)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Evaluado ✓
            </span>
          )}
        </div>

        <div style={{
          background: 'white', border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px',
        }}>
          {/* Average badge */}
          {scores.scored_at && (() => {
            const avg = (scores.validation_score + scores.creation_score + scores.communication_score + scores.growth_score) / 4
            const eligible = avg >= 3.0 && scores.attendance_percent >= 100 && scores.presented_at_demo_day
            return (
              <div style={{
                background: eligible ? 'var(--green-l)' : 'var(--gold-l)',
                border: `1px solid ${eligible ? 'var(--green)' : 'var(--gold)'}`,
                borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>{eligible ? '🏆' : '📋'}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                    {eligible ? 'Cumple todos los requisitos para el certificado' : 'Aún no cumple todos los requisitos'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>
                    Promedio: {avg.toFixed(2)} / 4.0
                    {scores.attendance_percent < 100 && ' · Asistencia incompleta'}
                    {!scores.presented_at_demo_day && ' · No presentó en Demo Day'}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 4 competency sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
            {COMPETENCY_META.map(({ key, label, desc, color }) => (
              <ScoreSlider
                key={key}
                label={label}
                desc={desc}
                color={color}
                value={scores[key as keyof ScoreRow] as number}
                onChange={v => setScores(prev => ({ ...prev, [key]: v }))}
              />
            ))}
          </div>

          {/* Attendance % */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 12, color: 'var(--ink2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Asistencia a sesiones en vivo (%)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range" min={0} max={100} step={10}
                value={scores.attendance_percent}
                onChange={e => setScores(prev => ({ ...prev, attendance_percent: Number(e.target.value) }))}
                style={{ flex: 1, accentColor: 'var(--teal)', height: 4, cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 800, fontSize: 16, color: scores.attendance_percent === 100 ? 'var(--green-d)' : 'var(--coral)', minWidth: 44 }}>
                {scores.attendance_percent}%
              </span>
            </div>
          </div>

          {/* Demo Day toggle */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div
                onClick={() => setScores(prev => ({ ...prev, presented_at_demo_day: !prev.presented_at_demo_day }))}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: scores.presented_at_demo_day ? 'var(--green)' : 'var(--ink4)',
                  position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: scores.presented_at_demo_day ? 21 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: 'white',
                  transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }} />
              </div>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>
                Presentó en Demo Day
              </span>
            </label>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 12, color: 'var(--ink2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notas de evaluación (opcional)
            </label>
            <textarea
              value={scores.notes ?? ''}
              onChange={e => setScores(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observaciones sobre el desempeño del estudiante..."
              style={{
                width: '100%', minHeight: 70, padding: '10px 12px',
                border: '1px solid var(--border)', borderRadius: 10,
                fontFamily: 'inherit', fontSize: 13, resize: 'vertical',
                boxSizing: 'border-box', color: 'var(--ink)',
              }}
            />
          </div>

          {/* Save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={saveScores}
              disabled={savingScores || !cohortId}
              style={{
                background: savingScores ? 'var(--ink4)' : 'var(--magenta)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '11px 24px', fontWeight: 800, fontSize: 14,
                cursor: savingScores ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {savingScores ? 'Guardando...' : 'Guardar evaluación'}
            </button>
            {scoresSaved && (
              <span style={{ fontSize: 13, color: 'var(--green-d)', fontWeight: 600 }}>
                ✓ Guardado
              </span>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
