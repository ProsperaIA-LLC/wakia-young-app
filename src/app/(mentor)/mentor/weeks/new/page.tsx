'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PHASES = ['Despertar', 'Construir', 'Lanzar'] as const
type Phase = typeof PHASES[number]

const PHASE_WEEKS: Record<Phase, number[]> = {
  Despertar: [1, 2],
  Construir: [3, 4, 5],
  Lanzar:    [6],
}

const TOOL_SUGGESTIONS = ['Claude', 'Claude Code', 'ChatGPT', 'Glide', 'n8n', 'Make', 'Notion', 'Loom', 'WhatsApp']

export default function NewWeekPage() {
  const router = useRouter()

  const [cohortId, setCohortId]   = useState('')
  const [cohortName, setCohortName] = useState('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')

  const [weekNumber, setWeekNumber]                   = useState(1)
  const [phase, setPhase]                             = useState<Phase>('Despertar')
  const [title, setTitle]                             = useState('')
  const [openingQuestion, setOpeningQuestion]         = useState('')
  const [deliverableDescription, setDeliverableDesc] = useState('')
  const [successSignal, setSuccessSignal]             = useState('')
  const [reflectionQ1, setReflectionQ1]               = useState('')
  const [reflectionQ2, setReflectionQ2]               = useState('')
  const [tools, setTools]                             = useState<string[]>([])
  const [toolInput, setToolInput]                     = useState('')
  const [unlockDate, setUnlockDate]                   = useState('')
  const [dueDate, setDueDate]                         = useState('')
  const [mentorVideoUrl, setMentorVideoUrl]           = useState('')
  const [notionGuideUrl, setNotionGuideUrl]           = useState('')

  useEffect(() => {
    fetch('/api/mentor/cohort')
      .then(r => r.json())
      .then(d => {
        if (d.cohort) {
          setCohortId(d.cohort.id)
          setCohortName(d.cohort.name)
          // Suggest next week number
          const existingNums = (d.weeks ?? []).map((w: any) => w.week_number)
          const next = Math.min(6, Math.max(...existingNums, 0) + 1)
          setWeekNumber(next)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Auto-set phase when week number changes
  useEffect(() => {
    if (weekNumber <= 2) setPhase('Despertar')
    else if (weekNumber <= 5) setPhase('Construir')
    else setPhase('Lanzar')
  }, [weekNumber])

  function addTool(t: string) {
    const trimmed = t.trim()
    if (trimmed && !tools.includes(trimmed)) setTools(prev => [...prev, trimmed])
    setToolInput('')
  }

  function removeTool(t: string) {
    setTools(prev => prev.filter(x => x !== t))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const res = await fetch('/api/mentor/weeks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cohort_id: cohortId,
        week_number: weekNumber,
        phase,
        title,
        opening_question: openingQuestion,
        deliverable_description: deliverableDescription,
        success_signal: successSignal,
        reflection_q1: reflectionQ1,
        reflection_q2: reflectionQ2,
        tools,
        unlock_date: unlockDate,
        due_date: dueDate,
        mentor_video_url: mentorVideoUrl || null,
        notion_guide_url: notionGuideUrl || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al crear la semana')
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => router.push('/mentor/settings'), 1500)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: '1px solid var(--border)', borderRadius: 10,
    fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit',
    background: 'var(--white)', outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 700, fontSize: 12,
    color: 'var(--ink2)', marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  const fieldStyle: React.CSSProperties = { marginBottom: 18 }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--magenta)', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (saved) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 48 }}>✅</div>
        <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Semana creada exitosamente</div>
        <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Redirigiendo a configuración...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '22px 24px 60px', maxWidth: 680 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: 'var(--teal)', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 12 }}
        >
          ← Volver
        </button>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 4px', color: 'var(--ink)' }}>
          Agregar semana
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink3)', margin: 0 }}>
          {cohortName || 'Cohorte activa'} · Completá todos los campos
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Week number + Phase */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Semana</label>
            <select
              value={weekNumber}
              onChange={e => setWeekNumber(Number(e.target.value))}
              style={inputStyle}
              required
            >
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>Semana {n}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Fase</label>
            <select
              value={phase}
              onChange={e => setPhase(e.target.value as Phase)}
              style={inputStyle}
              required
            >
              {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Title */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Título de la semana</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder='Ej: "El problema que te duele"'
            style={inputStyle}
            required
          />
        </div>

        {/* Opening question */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Pregunta de apertura (fenómeno finlandés)</label>
          <textarea
            value={openingQuestion}
            onChange={e => setOpeningQuestion(e.target.value)}
            placeholder="La pregunta que abre la semana y genera curiosidad..."
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            required
          />
        </div>

        {/* Deliverable */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Descripción del entregable</label>
          <textarea
            value={deliverableDescription}
            onChange={e => setDeliverableDesc(e.target.value)}
            placeholder="¿Qué tiene que entregar el estudiante esta semana?"
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            required
          />
        </div>

        {/* Success signal */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Señal de éxito</label>
          <input
            type="text"
            value={successSignal}
            onChange={e => setSuccessSignal(e.target.value)}
            placeholder="¿Cómo sabe el estudiante que terminó?"
            style={inputStyle}
            required
          />
        </div>

        {/* Reflection questions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Reflexión — Pregunta 1</label>
            <input
              type="text"
              value={reflectionQ1}
              onChange={e => setReflectionQ1(e.target.value)}
              placeholder='"Lo que aprendí esta semana fue..."'
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Reflexión — Pregunta 2</label>
            <input
              type="text"
              value={reflectionQ2}
              onChange={e => setReflectionQ2(e.target.value)}
              placeholder='"La semana que viene cambio..."'
              style={inputStyle}
            />
          </div>
        </div>

        {/* Tools */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Herramientas de la semana</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {tools.map(t => (
              <span key={t} style={{
                background: 'var(--teal-l)', color: 'var(--teal)',
                fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {t}
                <button
                  type="button"
                  onClick={() => removeTool(t)}
                  style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}
                >×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={toolInput}
              onChange={e => setToolInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTool(toolInput) } }}
              placeholder="Escribí una herramienta y presioná Enter"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => addTool(toolInput)}
              style={{
                background: 'var(--teal-l)', color: 'var(--teal)',
                border: '1px solid rgba(0,140,165,0.3)', borderRadius: 10,
                padding: '0 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit', flexShrink: 0,
              }}
            >+ Agregar</button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {TOOL_SUGGESTIONS.filter(t => !tools.includes(t)).map(t => (
              <button
                key={t} type="button" onClick={() => addTool(t)}
                style={{
                  background: 'var(--bg2)', color: 'var(--ink3)',
                  border: 'none', borderRadius: 20, padding: '3px 10px',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Video del mentor (URL, opcional)</label>
            <input
              type="url"
              value={mentorVideoUrl}
              onChange={e => setMentorVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Guía Notion (URL, opcional)</label>
            <input
              type="url"
              value={notionGuideUrl}
              onChange={e => setNotionGuideUrl(e.target.value)}
              placeholder="https://notion.so/..."
              style={inputStyle}
            />
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>Fecha de apertura (lunes)</label>
            <input type="date" value={unlockDate} onChange={e => setUnlockDate(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Fecha límite (domingo)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} required />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--coral-l)', color: 'var(--coral)',
            border: '1px solid rgba(255,92,53,0.25)', borderRadius: 10,
            padding: '10px 14px', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          style={{
            background: saving ? 'var(--ink4)' : 'var(--magenta)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '12px 28px', fontWeight: 800, fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {saving ? 'Creando...' : 'Crear semana'}
        </button>
      </form>
    </div>
  )
}
