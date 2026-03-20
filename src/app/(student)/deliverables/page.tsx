'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DashboardResponse } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeliverablePageData {
  user: DashboardResponse['data']['user']
  cohort: DashboardResponse['data']['cohort']
  currentWeek: DashboardResponse['data']['currentWeek']
  currentDeliverable: DashboardResponse['data']['currentDeliverable']
  currentReflection: DashboardResponse['data']['currentReflection']
  isReflectionUnlocked: boolean
  daysUntilDeadline: number
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status || status === 'not_started') {
    return (
      <span style={{
        background: 'var(--border)',
        color: 'var(--ink)',
        fontSize: '11px',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: '99px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>Pendiente</span>
    )
  }
  if (status === 'draft') {
    return (
      <span style={{
        background: '#FEF3C7',
        color: '#92400E',
        fontSize: '11px',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: '99px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>Borrador</span>
    )
  }
  if (status === 'submitted') {
    return (
      <span style={{
        background: '#D1FAE5',
        color: '#065F46',
        fontSize: '11px',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: '99px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>Entregado ✓</span>
    )
  }
  if (status === 'reviewed') {
    return (
      <span style={{
        background: '#CCFBF1',
        color: '#0F766E',
        fontSize: '11px',
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: '99px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>Revisado ✓</span>
    )
  }
  return null
}

// ── Reflection Lock Card ──────────────────────────────────────────────────────

function ReflectionLockCard({ isDeliverableSubmitted }: { isDeliverableSubmitted: boolean }) {
  const isSunday = new Date().getDay() === 0

  let message: string
  if (!isSunday && !isDeliverableSubmitted) {
    message = 'La reflexión se desbloquea los domingos después de entregar tu trabajo de la semana.'
  } else if (!isSunday) {
    message = 'La reflexión solo se puede completar los domingos. ¡Ya entregaste — volvé el domingo!'
  } else {
    message = 'Entregá tu trabajo de la semana primero para desbloquear la reflexión.'
  }

  return (
    <div style={{
      background: '#F5F3FF',
      border: '1px solid #DDD6FE',
      borderRadius: 'var(--radius-lg)',
      padding: '32px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
      <p style={{ color: '#6B7280', fontSize: '14px', maxWidth: '360px', margin: '0 auto' }}>
        {message}
      </p>
    </div>
  )
}

// ── Reflection Form ───────────────────────────────────────────────────────────

function ReflectionForm({
  weekId,
  cohortId,
  existingReflection,
  onSaved,
}: {
  weekId: string
  cohortId: string
  existingReflection: DeliverablePageData['currentReflection']
  onSaved: () => void
}) {
  const [q1, setQ1] = useState(existingReflection?.q1 || '')
  const [q2, setQ2] = useState(existingReflection?.q2 || '')
  const [q3, setQ3] = useState(existingReflection?.q3 || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const isSubmitted = existingReflection?.status === 'submitted'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!q1.trim() || !q2.trim() || !q3.trim()) return

    setSaving(true)

    const res = await fetch('/api/reflections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekId, cohortId, q1, q2, q3 }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[ReflectionForm] submit error:', err)
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    onSaved()
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100px',
    padding: '12px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'inherit',
    fontSize: '14px',
    resize: 'vertical',
    background: isSubmitted ? '#F9FAFB' : 'white',
    color: 'var(--ink)',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '8px',
    color: 'var(--ink)',
  }

  if (saved) {
    return (
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
        <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--green)' }}>¡Reflexión enviada!</p>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '8px' }}>Tu mentor podrá leerla esta semana.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={labelStyle}>¿Qué aprendiste esta semana que no sabías antes?</label>
        <textarea
          style={textareaStyle}
          value={q1}
          onChange={e => setQ1(e.target.value)}
          placeholder="Escribí con honestidad — nadie espera perfección aquí..."
          disabled={isSubmitted}
          required
        />
      </div>
      <div>
        <label style={labelStyle}>¿Dónde te bloqueaste? ¿Qué hiciste para desbloquearte?</label>
        <textarea
          style={textareaStyle}
          value={q2}
          onChange={e => setQ2(e.target.value)}
          placeholder="Los bloqueos son parte del proceso. ¿Qué probaste?"
          disabled={isSubmitted}
          required
        />
      </div>
      <div>
        <label style={labelStyle}>Si lo hicieras de nuevo, ¿qué harías diferente?</label>
        <textarea
          style={textareaStyle}
          value={q3}
          onChange={e => setQ3(e.target.value)}
          placeholder="No para criticarte — para crecer..."
          disabled={isSubmitted}
          required
        />
      </div>
      {!isSubmitted && (
        <button
          type="submit"
          disabled={saving || !q1.trim() || !q2.trim() || !q3.trim()}
          style={{
            background: 'var(--magenta)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius)',
            padding: '14px 28px',
            fontWeight: 700,
            fontSize: '15px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            alignSelf: 'flex-start',
          }}
        >
          {saving ? 'Enviando...' : 'Enviar reflexión'}
        </button>
      )}
    </form>
  )
}

// ── Deliverable Form ──────────────────────────────────────────────────────────

function DeliverableForm({
  weekId,
  cohortId,
  deliverableDescription,
  successSignal,
  existingDeliverable,
  onSaved,
}: {
  weekId: string
  cohortId: string
  deliverableDescription: string
  successSignal: string
  existingDeliverable: DeliverablePageData['currentDeliverable']
  onSaved: () => void
}) {
  const [content, setContent] = useState(existingDeliverable?.content || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isSubmitted = existingDeliverable?.status === 'submitted' || existingDeliverable?.status === 'reviewed'

  async function handleSaveDraft(e: React.MouseEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (existingDeliverable?.id) {
      await supabase.from('deliverables').update({ content, status: 'draft' }).eq('id', existingDeliverable.id)
    } else {
      await supabase.from('deliverables').insert({
        user_id: user.id,
        cohort_id: cohortId,
        week_id: weekId,
        content,
        status: 'draft',
      })
    }

    setSaving(false)
    onSaved()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)

    const res = await fetch('/api/deliverables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekId, cohortId, content }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[DeliverableForm] submit error:', err)
      setSaving(false)
      return
    }

    setSaving(false)
    setSaved(true)
    onSaved()
  }

  if (saved) {
    return (
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚀</div>
        <p style={{ fontWeight: 700, fontSize: '18px', color: 'var(--green)' }}>¡Entregable enviado!</p>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '8px' }}>Tu mentor recibirá una notificación.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Success signal hint */}
      <div style={{
        background: '#F0FFF4',
        border: '1px solid #C6F6D5',
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '16px' }}>🎯</span>
        <div>
          <p style={{ fontWeight: 600, fontSize: '13px', color: '#065F46', margin: '0 0 2px' }}>Señal de éxito</p>
          <p style={{ fontSize: '13px', color: '#047857', margin: 0 }}>{successSignal}</p>
        </div>
      </div>

      {/* Content textarea */}
      <div>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--ink)' }}>
          {deliverableDescription}
        </label>
        <textarea
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '14px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontFamily: 'inherit',
            fontSize: '14px',
            resize: 'vertical',
            background: isSubmitted ? '#F9FAFB' : 'white',
            color: 'var(--ink)',
            boxSizing: 'border-box',
          }}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`Describí tu entregable. Sé específico/a — mencioná qué hiciste, con quién lo validaste, y qué aprendiste.`}
          disabled={isSubmitted}
          required
        />
      </div>

      {!isSubmitted && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || !content.trim()}
            style={{
              background: 'white',
              color: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 24px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            Guardar borrador
          </button>
          <button
            type="submit"
            disabled={saving || !content.trim()}
            style={{
              background: 'var(--teal)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: '12px 24px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Enviando...' : 'Entregar ✓'}
          </button>
        </div>
      )}
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DeliverablesPage() {
  const [data, setData] = useState<DeliverablePageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    try {
      const res = await fetch('/api/student/dashboard')
      if (!res.ok) throw new Error('Failed')
      const json: DashboardResponse = await res.json()
      setData({
        user: json.data.user,
        cohort: json.data.cohort,
        currentWeek: json.data.currentWeek,
        currentDeliverable: json.data.currentDeliverable,
        currentReflection: json.data.currentReflection,
        isReflectionUnlocked: json.isReflectionUnlocked,
        daysUntilDeadline: json.daysUntilDeadline,
      })
    } catch {
      setError('No pudimos cargar tu información. Recargá la página.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--teal)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
        {error || 'Sin datos'}
      </div>
    )
  }

  const { currentWeek, currentDeliverable, currentReflection, isReflectionUnlocked, daysUntilDeadline } = data
  const isDeliverableSubmitted = currentDeliverable?.status === 'submitted' || currentDeliverable?.status === 'reviewed'

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <h1 style={{ fontWeight: 800, fontSize: '22px', margin: 0 }}>
            Semana {currentWeek.week_number} — {currentWeek.title}
          </h1>
          <StatusBadge status={currentDeliverable?.status ?? null} />
        </div>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
          Fase {currentWeek.phase}
          {daysUntilDeadline > 0 && (
            <span style={{
              marginLeft: '12px',
              background: daysUntilDeadline <= 2 ? '#FEF2F2' : '#F0FFF4',
              color: daysUntilDeadline <= 2 ? '#DC2626' : '#065F46',
              padding: '2px 8px',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {daysUntilDeadline === 1 ? '¡Último día!' : `${daysUntilDeadline} días`}
            </span>
          )}
        </p>
      </div>

      {/* Opening question */}
      <div style={{
        background: 'var(--navy)',
        color: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
          Fenómeno de apertura
        </p>
        <p style={{ fontSize: '17px', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
          "{currentWeek.opening_question}"
        </p>
      </div>

      {/* Deliverable */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📦</span> Tu entregable
        </h2>
        <div style={{
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}>
          <DeliverableForm
            weekId={currentWeek.id}
            cohortId={data.cohort.id}
            deliverableDescription={currentWeek.deliverable_description}
            successSignal={currentWeek.success_signal}
            existingDeliverable={currentDeliverable}
            onSaved={loadData}
          />
        </div>
      </section>

      {/* Reflection */}
      <section>
        <h2 style={{
          fontWeight: 700, fontSize: '17px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '8px',
          color: isReflectionUnlocked ? 'var(--magenta)' : '#9CA3AF',
        }}>
          <span>{isReflectionUnlocked ? '📝' : '🔒'}</span> Reflexión semanal
          {!isReflectionUnlocked && (
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF' }}>(domingos)</span>
          )}
        </h2>
        <div style={{
          background: 'white',
          border: `1px solid ${isReflectionUnlocked ? '#DDD6FE' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
        }}>
          {!isReflectionUnlocked ? (
            <ReflectionLockCard isDeliverableSubmitted={isDeliverableSubmitted} />
          ) : (
            <ReflectionForm
              weekId={currentWeek.id}
              cohortId={data.cohort.id}
              existingReflection={currentReflection}
              onSaved={loadData}
            />
          )}
        </div>
      </section>

    </div>
  )
}
