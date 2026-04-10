'use client'

import { useState, useEffect, useRef } from 'react'
import type { PodMemberData, PodResponse } from '@/app/api/pod/route'
import type { BuddyMessageItem, BuddyMessagesResponse } from '@/app/api/buddy/messages/route'

// ── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'var(--green)', 'var(--coral)', 'var(--teal)', 'var(--gold)', 'var(--magenta)',
]

function initials(fullName: string, nickname: string | null) {
  const src = nickname || fullName
  const parts = src.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : src.slice(0, 2).toUpperCase()
}

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function activityDotColor(m: PodMemberData) {
  if (m.isInactive) return 'var(--coral)'
  if (m.hoursSinceActivity === null) return 'var(--ink4)'
  if (m.hoursSinceActivity < 2) return '#22c55e'
  if (m.hoursSinceActivity < 24) return 'var(--gold)'
  return 'var(--ink4)'
}

function chipStyle(m: PodMemberData, buddyId: string | null) {
  if (m.isInactive) return { bg: 'var(--coral-l)', color: 'var(--coral)', label: 'Sin actividad' }
  if (m.hasSubmittedThisWeek) return { bg: 'var(--green-l)', color: 'var(--green-d)', label: 'Entregó ✓' }
  if (m.buddyId && m.userId === buddyId) return { bg: 'var(--coral-l)', color: 'var(--coral)', label: 'Buddy' }
  if (m.hoursSinceActivity !== null && m.hoursSinceActivity < 2) return { bg: 'var(--green-l)', color: 'var(--green-d)', label: 'Activa/o' }
  return { bg: 'var(--teal-l)', color: 'var(--teal)', label: 'Activa/o' }
}

function activityLabel(m: PodMemberData) {
  if (m.hoursSinceActivity === null) return 'Sin actividad registrada'
  if (m.hoursSinceActivity < 1) return 'Activa/o ahora'
  if (m.hoursSinceActivity < 24) return `Hace ${m.hoursSinceActivity}h`
  if (m.hoursSinceActivity < 48) return 'Ayer'
  return `Hace ${Math.floor(m.hoursSinceActivity / 24)} días`
}

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({ m, myBuddyId }: { m: PodMemberData; myBuddyId: string | null }) {
  const name = m.nickname || m.fullName.split(' ')[0]
  const chip = chipStyle(m, myBuddyId)
  const isBuddy = m.userId === myBuddyId
  const avatarBg = m.isInactive ? 'var(--ink4)' : avatarColor(m.fullName)

  return (
    <div
      style={{
        background: m.isCurrentUser ? '#fafffe' : 'var(--white)',
        border: `1.5px solid ${m.isCurrentUser ? 'var(--green)' : isBuddy ? 'var(--teal)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '16px 12px',
        textAlign: 'center',
        position: 'relative',
        cursor: 'default',
        transition: 'transform .2s, box-shadow .2s, border-color .2s',
      }}
      onMouseEnter={e => {
        if (!m.isCurrentUser) {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-2px)'
          el.style.boxShadow = '0 5px 18px rgba(14,42,71,0.07)'
          if (!isBuddy) el.style.borderColor = 'var(--teal)'
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = ''
        el.style.boxShadow = ''
        el.style.borderColor = m.isCurrentUser ? 'var(--green)' : isBuddy ? 'var(--teal)' : 'var(--border)'
      }}
    >
      {/* Inactive alert pip */}
      {m.isInactive && !m.isCurrentUser && (
        <div style={{
          position: 'absolute', top: 9, right: 9,
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--coral)', border: '2.5px solid var(--white)',
        }} />
      )}

      {/* "Tú" tag */}
      {m.isCurrentUser && (
        <div style={{
          position: 'absolute', top: -8, right: -8,
          background: 'var(--green)', color: 'var(--navy)',
          fontSize: 10, fontWeight: 800, padding: '2px 8px',
          borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.03em',
        }}>
          Tú
        </div>
      )}

      {/* Avatar */}
      <div style={{
        width: 46, height: 46, borderRadius: '50%',
        background: avatarBg,
        color: '#fff', fontWeight: 800, fontSize: 15,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 9px',
        position: 'relative',
      }}>
        {initials(m.fullName, m.nickname)}
        {/* Activity dot */}
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: activityDotColor(m),
          border: '2.5px solid var(--white)',
          position: 'absolute', bottom: 0, right: 0,
        }} />
      </div>

      {/* Name */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
        {name}
      </div>

      {/* Sub: country · role */}
      <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 7 }}>
        {[
          m.country,
          m.isPodLeader ? 'Pod Leader ✦' : null,
          isBuddy && !m.isCurrentUser ? 'Tu buddy' : null,
        ].filter(Boolean).join(' · ')}
      </div>

      {/* Status chip */}
      <div style={{
        display: 'inline-block',
        fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.04em',
        padding: '3px 10px', borderRadius: 20,
        background: chip.bg, color: chip.color,
      }}>
        {chip.label}
      </div>

      {/* Activity label */}
      <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 5 }}>
        {activityLabel(m)}
      </div>
    </div>
  )
}

// ── Pod leader summary form ───────────────────────────────────────────────────

function PodLeaderSummaryForm({
  podId, cohortId, weekNumber,
}: {
  podId: string
  cohortId: string
  weekNumber: number
}) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/pod-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podId, cohortId, weekNumber, summaryText: text }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Error enviando el resumen')
      }
      setStatus('success')
      setText('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado')
      setStatus('error')
    }
  }

  return (
    <div style={{
      background: 'var(--gold-l)',
      border: '1.5px solid var(--gold)',
      borderRadius: 16, padding: 20,
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>⭐</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
            Resumen semanal del Pod
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>
            Solo tú podés enviarlo como Pod Leader · Semana {weekNumber}
          </div>
        </div>
      </div>

      {status === 'success' ? (
        <div style={{
          background: 'var(--green-l)', color: 'var(--green-d)',
          borderRadius: 10, padding: '12px 16px',
          fontSize: 14, fontWeight: 600,
        }}>
          ✓ Resumen enviado al mentor — ¡bien hecho!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={'Escribe 3 líneas:\n1. Lo que el pod logró esta semana\n2. Quién necesita apoyo\n3. El plan para la próxima semana'}
            rows={4}
            maxLength={1000}
            style={{
              width: '100%', boxSizing: 'border-box',
              border: '1.5px solid rgba(224,163,38,0.4)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, lineHeight: 1.55,
              fontFamily: 'inherit', resize: 'vertical',
              background: 'var(--white)',
              color: 'var(--ink)',
              outline: 'none',
              marginBottom: 10,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(224,163,38,0.4)' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>
              {text.length}/1000 caracteres
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {status === 'error' && (
                <span style={{ fontSize: 12, color: 'var(--coral)' }}>{errorMsg}</span>
              )}
              <button
                type="submit"
                disabled={!text.trim() || status === 'loading'}
                style={{
                  background: text.trim() && status !== 'loading' ? 'var(--gold)' : 'var(--ink4)',
                  color: text.trim() && status !== 'loading' ? 'var(--navy)' : 'var(--white)',
                  border: 'none', borderRadius: 10,
                  padding: '9px 20px', fontSize: 13, fontWeight: 700,
                  cursor: text.trim() && status !== 'loading' ? 'pointer' : 'default',
                  transition: 'background .2s, color .2s',
                }}
              >
                {status === 'loading' ? 'Enviando…' : 'Enviar resumen'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Weekly rhythm card ────────────────────────────────────────────────────────

function WeeklyRhythm({ weekNumber }: { weekNumber: number | null }) {
  const RHYTHM = [
    { day: 'Lunes', icon: '📩', task: 'Escribile a tu buddy: "Mi plan esta semana es…"' },
    { day: 'Miércoles', icon: '🤝', task: 'Buddy mid-week: "¿Cómo vas?"' },
    { day: 'Viernes', icon: '🎙', task: 'Check-in del pod (20 min de voz — sin mentor)' },
    { day: 'Domingo', icon: '📬', task: 'Entregar entregable + reflexión · Buddy da primer feedback' },
  ]
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 20, marginBottom: 24,
    }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 14 }}>
        📅 Ritmo semanal{weekNumber ? ` — Semana ${weekNumber}` : ''}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {RHYTHM.map(({ day, icon, task }) => (
          <div key={day} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
            <div>
              <span style={{
                fontWeight: 800, fontSize: 11, color: 'var(--teal)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                display: 'block', marginBottom: 1,
              }}>{day}</span>
              <span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>{task}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pod leader duties ─────────────────────────────────────────────────────────

function PodLeaderDuties() {
  return (
    <div style={{
      background: 'var(--gold-l)', border: '1px solid var(--gold)',
      borderRadius: 16, padding: 20, marginBottom: 24,
    }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', marginBottom: 10 }}>
        ⭐ Eres el Pod Leader esta semana
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[
          'Coordina el check-in del viernes (20 min por voz)',
          'Recuerda a tus buddies sus check-ins diarios',
          'El domingo: envía el resumen de 3 líneas al canal del mentor',
          'Si alguien está bloqueado, escala al mentor',
        ].map(duty => (
          <div key={duty} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--ink2)' }}>
            <span style={{ color: 'var(--gold)', marginTop: 1 }}>✦</span>
            <span>{duty}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0 }
          100% { background-position: 400px 0 }
        }
        .sk { background: linear-gradient(90deg, var(--bg2) 25%, var(--bg) 50%, var(--bg2) 75%);
              background-size: 800px 100%; animation: shimmer 1.4s infinite; border-radius: 10px; }
      `}</style>
      <div className="sk" style={{ height: 110, borderRadius: 16, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="sk" style={{ height: 140, borderRadius: 14 }} />
        ))}
      </div>
      <div className="sk" style={{ height: 80, borderRadius: 16, marginBottom: 16 }} />
    </div>
  )
}

// ── Buddy chat ───────────────────────────────────────────────────────────────

const DAY_PROMPTS: Record<number, string> = {
  1: 'Mi plan esta semana es…',
  3: '¿Cómo vas? ¿Necesitas algo?',
  5: '¿Qué vas a mostrar mañana en el check-in?',
  0: 'Vi tu entregable. Lo que más me gustó fue…',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 36e5
  if (diffH < 24) return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  if (diffH < 48) return 'Ayer'
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function BuddyChat({ buddy }: { buddy: PodMemberData }) {
  const [data, setData]       = useState<BuddyMessagesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')
  const bottomRef             = useRef<HTMLDivElement>(null)
  const todayPrompt           = DAY_PROMPTS[new Date().getDay()] ?? null

  const buddyName = buddy.nickname || buddy.fullName.split(' ')[0]

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/buddy/messages`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setError('No se pudo cargar la conversación'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.messages])

  async function send(content: string) {
    if (!content.trim() || sending) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/buddy/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setData(prev => prev
        ? { ...prev, messages: [...prev.messages, json.message as BuddyMessageItem] }
        : prev
      )
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error enviando')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      background: 'var(--white)',
      border: '1.5px solid var(--teal)',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--teal-l)',
        borderBottom: '1px solid rgba(0,140,165,0.15)',
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: buddy.isInactive ? 'var(--ink4)' : avatarColor(buddy.fullName),
          color: '#fff', fontWeight: 800, fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {initials(buddy.fullName, buddy.nickname)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
            Mensajes con {buddyName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--teal)' }}>Tu buddy</div>
        </div>
        {data && data.unreadCount > 0 && (
          <div style={{
            background: 'var(--coral)', color: '#fff',
            fontSize: 11, fontWeight: 800,
            padding: '2px 8px', borderRadius: 20,
          }}>
            {data.unreadCount} nuevo{data.unreadCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{
        height: 280, overflowY: 'auto',
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--ink4)', fontSize: 13, marginTop: 80 }}>
            Cargando…
          </div>
        )}

        {!loading && data?.messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
            <div style={{ fontSize: 13, color: 'var(--ink3)', fontWeight: 600 }}>
              Todavía no hay mensajes con {buddyName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 4 }}>
              Mandá el primer mensaje hoy
            </div>
          </div>
        )}

        {!loading && data?.messages.map(m => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              justifyContent: m.isMine ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '75%',
              background: m.isMine ? 'var(--teal)' : 'var(--bg2)',
              color: m.isMine ? '#fff' : 'var(--ink)',
              borderRadius: m.isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              padding: '9px 13px',
              fontSize: 13,
              lineHeight: 1.55,
            }}>
              <div>{m.content}</div>
              <div style={{
                fontSize: 10,
                color: m.isMine ? 'rgba(255,255,255,0.6)' : 'var(--ink4)',
                marginTop: 4,
                textAlign: 'right',
              }}>
                {formatTime(m.createdAt)}
                {m.isMine && <span style={{ marginLeft: 4 }}>{m.isRead ? '✓✓' : '✓'}</span>}
              </div>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompt */}
      {todayPrompt && data && data.messages.length === 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sugerencia de hoy
          </div>
          <button
            onClick={() => setText(todayPrompt)}
            style={{
              background: 'var(--teal-l)', color: 'var(--teal)',
              border: '1px solid rgba(0,140,165,0.25)',
              borderRadius: 20, padding: '5px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            &ldquo;{todayPrompt}&rdquo;
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 14px',
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text) }
          }}
          placeholder={`Escribile a ${buddyName}…`}
          rows={2}
          maxLength={500}
          style={{
            flex: 1,
            border: '1.5px solid var(--border)',
            borderRadius: 10, padding: '8px 12px',
            fontSize: 13, lineHeight: 1.5,
            fontFamily: 'inherit', resize: 'none',
            outline: 'none', background: 'var(--bg)',
            color: 'var(--ink)',
            transition: 'border-color .15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--teal)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 10, color: text.length > 450 ? 'var(--coral)' : 'var(--ink4)' }}>
            {text.length}/500
          </span>
          <button
            onClick={() => send(text)}
            disabled={!text.trim() || sending}
            style={{
              background: text.trim() && !sending ? 'var(--teal)' : 'var(--ink4)',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 18px', fontSize: 13, fontWeight: 700,
              cursor: text.trim() && !sending ? 'pointer' : 'default',
              transition: 'background .15s',
              flexShrink: 0,
            }}
          >
            {sending ? '…' : 'Enviar'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0 16px 12px', fontSize: 12, color: 'var(--coral)' }}>
          {error}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PodPage() {
  const [podData, setPodData] = useState<PodResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // For pod summary form: we need current week number from the cohort
  const [weekNumber, setWeekNumber] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/pod`)
        if (!res.ok) {
          const d = await res.json()
          setError(d.error || 'Error cargando el pod')
          return
        }
        const data: PodResponse = await res.json()
        setPodData(data)

        // Also get week number for the summary form
        if (data.currentWeekId) {
          const dashRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/student/dashboard`)
          if (dashRes.ok) {
            const dash = await dashRes.json()
            setWeekNumber(dash.data?.currentWeek?.week_number ?? null)
          }
        }
      } catch {
        setError('No se pudo conectar con el servidor')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🫂</div>
        <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
          {error === 'No estás asignado a ningún pod todavía'
            ? 'Todavía no tienes un pod'
            : 'No se pudo cargar el pod'}
        </h2>
        <p style={{ color: 'var(--ink3)', fontSize: 14 }}>
          {error === 'No estás asignado a ningún pod todavía'
            ? 'Tu mentor te asignará a un pod pronto. Mientras tanto, explora el contenido de esta semana.'
            : error}
        </p>
      </div>
    )
  }

  if (!podData) return null

  const { pod, members } = podData

  const me = members.find(m => m.isCurrentUser)
  const myBuddyId = me?.buddyId ?? null
  const amPodLeader = me?.isPodLeader ?? false

  // Separate buddy from others for display purposes
  const buddy = myBuddyId ? members.find(m => m.userId === myBuddyId && !m.isCurrentUser) : null

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
      <style>{`
        @keyframes pod-up {
          from { opacity: 0; transform: translateY(10px) }
          to   { opacity: 1; transform: none }
        }
        .pod-section { animation: pod-up .35s ease both; }
        .pod-section:nth-child(1) { animation-delay: .04s }
        .pod-section:nth-child(2) { animation-delay: .09s }
        .pod-section:nth-child(3) { animation-delay: .14s }
        .pod-section:nth-child(4) { animation-delay: .19s }
        .pod-section:nth-child(5) { animation-delay: .23s }
      `}</style>

      {/* ── Header banner ── */}
      <div
        className="pod-section"
        style={{
          background: 'var(--navy)', color: 'white',
          borderRadius: 18, padding: '22px 24px',
          marginBottom: 24,
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, opacity: 0.5,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5,
          }}>
            Tu Pod
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>
              {pod.name} {pod.timezoneRegion ? '🌎' : ''}
            </h1>
            {amPodLeader && (
              <span style={{
                background: 'var(--gold)', color: 'var(--navy)',
                fontWeight: 800, fontSize: 11,
                padding: '4px 12px', borderRadius: 20,
              }}>
                ⭐ Pod Leader
              </span>
            )}
          </div>
          {pod.timezoneRegion && (
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 14 }}>
              {pod.timezoneRegion}
            </div>
          )}
          {pod.discordChannelUrl && (
            <a
              href={pod.discordChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.12)', color: 'white',
                padding: '7px 14px', borderRadius: 10,
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                transition: 'background .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.12)' }}
            >
              💬 Abrir canal en Discord
            </a>
          )}
        </div>

        {/* Pod faces preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex' }}>
            {members.slice(0, 5).map((m, i) => (
              <div
                key={m.userId}
                title={m.nickname || m.fullName.split(' ')[0]}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: m.isInactive ? 'var(--ink3)' : avatarColor(m.fullName),
                  color: '#fff', fontWeight: 800, fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2.5px solid var(--navy)',
                  marginLeft: i > 0 ? -8 : 0,
                  zIndex: members.length - i,
                  position: 'relative',
                }}
              >
                {initials(m.fullName, m.nickname)}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
            {members.filter(m => !m.isInactive).length} activos
            {members.some(m => m.isInactive) && ` · ${members.filter(m => m.isInactive).length} sin actividad`}
          </div>
        </div>
      </div>

      {/* ── Section header + member grid ── */}
      <div className="pod-section">
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 12,
        }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
            Miembros del pod ({members.length})
          </div>
          {pod.discordChannelUrl && (
            <a
              href={pod.discordChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}
            >
              Abrir canal en Discord →
            </a>
          )}
        </div>

        {/* 4-column card grid, responsive */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(members.length, 4)}, 1fr)`,
          gap: 10,
          marginBottom: 24,
        }}>
          {members.map(m => (
            <MemberCard key={m.userId} m={m} myBuddyId={myBuddyId} />
          ))}
        </div>
      </div>

      {/* ── Buddy highlight + chat ── */}
      {buddy && (
        <div className="pod-section" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 10 }}>
            Tu buddy esta semana
          </div>
          <div style={{
            background: 'var(--white)',
            border: '2px solid var(--teal)',
            borderRadius: 14, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              background: buddy.isInactive ? 'var(--ink4)' : avatarColor(buddy.fullName),
              color: '#fff', fontWeight: 800, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, position: 'relative',
            }}>
              {initials(buddy.fullName, buddy.nickname)}
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: activityDotColor(buddy),
                border: '2.5px solid var(--white)',
                position: 'absolute', bottom: 0, right: 0,
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {buddy.nickname || buddy.fullName.split(' ')[0]}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 2 }}>
                {[buddy.country, activityLabel(buddy)].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div style={{
              background: 'var(--teal-l)', color: 'var(--teal)',
              fontSize: 11, fontWeight: 700, padding: '4px 12px',
              borderRadius: 20, flexShrink: 0,
            }}>
              Buddy
            </div>
          </div>

          {/* Buddy chat thread */}
          <div style={{ marginTop: 16 }}>
            <BuddyChat buddy={buddy} />
          </div>
        </div>
      )}

      {/* ── Pod leader duties ── */}
      {amPodLeader && (
        <div className="pod-section">
          <PodLeaderDuties />
        </div>
      )}

      {/* ── Pod leader summary form ── */}
      {amPodLeader && pod.cohortId && weekNumber && (
        <div className="pod-section">
          <PodLeaderSummaryForm
            podId={pod.id}
            cohortId={pod.cohortId}
            weekNumber={weekNumber}
          />
        </div>
      )}

      {/* ── Weekly rhythm ── */}
      <div className="pod-section">
        <WeeklyRhythm weekNumber={weekNumber} />
      </div>

      {/* ── Inactive members warning ── */}
      {members.some(m => m.isInactive && !m.isCurrentUser) && (
        <div
          className="pod-section"
          style={{
            background: 'var(--coral-l)', border: '1px solid var(--coral)',
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--coral)', marginBottom: 4 }}>
              {members.filter(m => m.isInactive && !m.isCurrentUser).length === 1
                ? 'Un miembro sin actividad por +48hs'
                : `${members.filter(m => m.isInactive && !m.isCurrentUser).length} miembros sin actividad por +48hs`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink2)' }}>
              {amPodLeader
                ? 'Como Pod Leader, escríbeles hoy y escala al mentor si no responden.'
                : 'Tu buddy o el Pod Leader se está encargando. Si puedes, escríbeles tú también.'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
