'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ReflectionRow {
  id: string
  answer_q1: string | null
  answer_q2: string | null
  mentor_feedback: string | null
  submitted_at: string | null
  created_at: string
  student: { id: string; full_name: string; nickname: string | null; country: string | null } | null
  week: { week_number: number; title: string } | null
}

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1)  return 'Hace menos de 1 hr'
  if (h < 24) return `Hace ${h} hr${h > 1 ? 's' : ''}`
  if (h < 48) return 'Ayer'
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export default function ReflectionsPage() {
  const router = useRouter()
  const [reflections, setReflections] = useState<ReflectionRow[]>([])
  const [loading, setLoading]         = useState(true)
  const [feedbackId, setFeedbackId]   = useState<string | null>(null)
  const [feedback, setFeedback]       = useState('')
  const [saving, setSaving]           = useState(false)
  const [weekFilter, setWeekFilter]   = useState<number | 'all'>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Get active cohort
      const { data: cohort } = await supabase
        .from('cohorts')
        .select('id')
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!cohort) { setLoading(false); return }

      const { data } = await supabase
        .from('reflections')
        .select(`
          id, answer_q1, answer_q2, mentor_feedback, submitted_at, created_at,
          users!reflections_user_id_fkey ( id, full_name, nickname, country ),
          weeks!reflections_week_id_fkey ( week_number, title )
        `)
        .eq('cohort_id', cohort.id)
        .order('created_at', { ascending: false })

      if (data) {
        setReflections(data.map((r: any) => ({
          ...r,
          student: r.users ?? null,
          week:    r.weeks ?? null,
        })))
      }
      setLoading(false)
    }
    load()
  }, [])

  async function saveFeedback() {
    if (!feedbackId || !feedback.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('reflections').update({ mentor_feedback: feedback }).eq('id', feedbackId)
    setReflections(prev => prev.map(r => r.id === feedbackId ? { ...r, mentor_feedback: feedback } : r))
    setFeedbackId(null)
    setFeedback('')
    setSaving(false)
  }

  const weeks = [...new Set(reflections.map(r => r.week?.week_number).filter(Boolean))] as number[]
  const filtered = weekFilter === 'all'
    ? reflections
    : reflections.filter(r => r.week?.week_number === weekFilter)

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--magenta)', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '22px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 4px', color: 'var(--ink)' }}>Reflexiones</h1>
        <p style={{ fontSize: 13, color: 'var(--ink3)', margin: 0 }}>
          {reflections.length} reflexión{reflections.length !== 1 ? 'es' : ''} enviadas · Puedes dar feedback por semana
        </p>
      </div>

      {/* Week filter */}
      {weeks.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {(['all', ...weeks.sort()] as const).map(w => (
            <button
              key={w}
              onClick={() => setWeekFilter(w)}
              style={{
                padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                border: `1.5px solid ${weekFilter === w ? 'var(--magenta)' : 'var(--border)'}`,
                background: weekFilter === w ? 'var(--magenta)' : 'var(--white)',
                color: weekFilter === w ? '#fff' : 'var(--ink3)',
                cursor: 'pointer',
              }}
            >
              {w === 'all' ? 'Todas' : `Semana ${w}`}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '40px 24px', textAlign: 'center',
          color: 'var(--ink3)', fontSize: 14,
        }}>
          {weekFilter === 'all'
            ? 'Todavía no hay reflexiones enviadas esta cohorte.'
            : `No hay reflexiones para la semana ${weekFilter}.`}
        </div>
      )}

      {/* Reflection list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(r => {
          const name = r.student?.nickname || r.student?.full_name?.split(' ')[0] || 'Estudiante'
          return (
            <div key={r.id} style={{
              background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: 16, overflow: 'hidden',
            }}>
              {/* Card header */}
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--magenta)', color: '#fff',
                    fontWeight: 800, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                    onClick={() => r.student && router.push(`/mentor/students/${r.student.id}`)}
                  >
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                      {name}
                      {r.student?.country ? ` · ${r.student.country}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                      Semana {r.week?.week_number ?? '?'} — {r.week?.title ?? ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {r.mentor_feedback && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: 'var(--teal-l)', color: 'var(--teal)',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      Feedback enviado
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
                    {r.submitted_at ? timeAgo(r.submitted_at) : timeAgo(r.created_at)}
                  </span>
                </div>
              </div>

              {/* Answers */}
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '¿Qué aprendiste esta semana?', value: r.answer_q1 },
                  { label: '¿Qué cambiarás la semana que viene?', value: r.answer_q2 },
                ].filter(q => q.value).map(q => (
                  <div key={q.label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                      {q.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>{q.value}</div>
                  </div>
                ))}

                {/* Feedback section */}
                {r.mentor_feedback ? (
                  <div style={{
                    marginTop: 4, background: 'var(--teal-l)', border: '1px solid rgba(0,140,165,0.2)',
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Tu feedback
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6 }}>{r.mentor_feedback}</div>
                    <button
                      onClick={() => { setFeedbackId(r.id); setFeedback(r.mentor_feedback!) }}
                      style={{ marginTop: 8, fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      Editar feedback
                    </button>
                  </div>
                ) : feedbackId === r.id ? (
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Escribí tu feedback para esta reflexión..."
                      autoFocus
                      style={{
                        width: '100%', minHeight: 80, padding: '10px 12px',
                        border: '1px solid var(--teal)', borderRadius: 10,
                        fontFamily: 'inherit', fontSize: 13, resize: 'vertical',
                        boxSizing: 'border-box', outline: 'none',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={saveFeedback}
                        disabled={saving || !feedback.trim()}
                        style={{
                          background: 'var(--teal)', color: '#fff', border: 'none',
                          borderRadius: 8, padding: '8px 18px', fontWeight: 700,
                          fontSize: 12, cursor: saving ? 'not-allowed' : 'pointer',
                          opacity: saving ? 0.7 : 1, fontFamily: 'inherit',
                        }}
                      >
                        {saving ? 'Guardando...' : 'Guardar feedback'}
                      </button>
                      <button
                        onClick={() => { setFeedbackId(null); setFeedback('') }}
                        style={{
                          background: 'none', color: 'var(--ink3)',
                          border: '1px solid var(--border)', borderRadius: 8,
                          padding: '8px 16px', fontWeight: 600, fontSize: 12,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setFeedbackId(r.id); setFeedback('') }}
                    style={{
                      alignSelf: 'flex-start', marginTop: 4,
                      background: 'var(--teal-l)', color: 'var(--teal)',
                      border: '1px solid rgba(0,140,165,0.25)', borderRadius: 8,
                      padding: '6px 14px', fontWeight: 700, fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    + Dar feedback
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
