'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { DashboardResponse, User, Week, PodMemberWithUser, ActivityFeedItem } from '@/types'
import { Button, Badge, Avatar, StatCard } from '@/components/ui'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function todayLabel() {
  const d = new Date()
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const day = DAYS[d.getDay()]
  return `${day.charAt(0).toUpperCase() + day.slice(1)} · ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

const LEVEL: Record<string, string> = {
  Despertar: 'Nivel Explorer 🔍',
  Construir: 'Nivel Builder ⚡',
  Lanzar:    'Nivel Launcher 🚀',
}

const PHASE_EMOJI: Record<string, string> = {
  Despertar: '💡',
  Construir: '🛠',
  Lanzar:    '🚀',
}

const AVATAR_COLORS = [
  'var(--green)', 'var(--coral)', 'var(--teal)', 'var(--gold)', 'var(--magenta)',
]

// ── Tag chip for activity feed ────────────────────────────────────────────────

function FeedTag({ type, label }: { type?: string; label?: string }) {
  if (!label) return null
  const styles: Record<string, { bg: string; color: string }> = {
    pod:     { bg: 'var(--green-l)',  color: 'var(--green-d)' },
    wins:    { bg: 'var(--gold-l)',   color: '#b07a10' },
    general: { bg: 'var(--teal-l)',   color: 'var(--teal)' },
  }
  const s = styles[type ?? 'general'] ?? styles.general
  return (
    <span style={{
      display: 'inline-block', fontSize: '11px', padding: '1px 7px',
      borderRadius: '5px', fontWeight: 700, margin: '0 2px',
      background: s.bg, color: s.color,
    }}>
      #{label}
    </span>
  )
}

// ── Próspero Chat Panel ───────────────────────────────────────────────────────

function ProsperoPanel({ user, week }: { user: User | null; week: Week | null }) {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [msgs, setMsgs] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([{
    role: 'assistant',
    content: `¡Hola ${user?.nickname || 'estudiante'}! Soy Próspero, tu tutor IA. Estoy acá para ayudarte con lo que necesités esta semana. ¿Por dónde empezamos? 🚀`,
  }])
  const msgsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  async function send(text?: string) {
    const message = (text ?? input).trim()
    if (!message || loading) return
    setInput('')
    setLoading(true)
    setMsgs(prev => [...prev, { role: 'user', content: message }])
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, weekId: week?.id ?? '', cohortId: '' }),
      })
      const data = await res.json()
      setMsgs(prev => [...prev, { role: 'assistant', content: data.reply ?? 'Ups, algo salió mal. ¿Lo intentás de nuevo?' }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Hubo un problema de conexión. ¿Lo intentás de nuevo?' }])
    }
    setLoading(false)
  }

  const CHIPS: Record<string, string> = {
    '🛠 Prototipo':  '¿Cómo empiezo a construir mi prototipo esta semana?',
    '✦ Prompting':   'Enséñame prompting con Claude paso a paso',
    '🎯 Validación': '¿Cómo valido que mi problema es real?',
    '📋 Entregable': '¿Qué necesita tener mi entregable esta semana?',
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Cerrar Próspero' : 'Abrir Próspero'}
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 200,
          width: '60px', height: '60px', borderRadius: '50%',
          background: open ? 'var(--ink2)' : 'var(--magenta)',
          border: 'none', cursor: 'pointer',
          boxShadow: open ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 22px rgba(165,8,107,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .2s', color: '#fff', fontSize: '26px',
          fontFamily: 'inherit',
        }}
      >
        {!open && (
          <div style={{
            position: 'absolute', top: '-3px', right: '-3px',
            width: '14px', height: '14px', borderRadius: '50%',
            background: 'var(--green)', border: '2.5px solid var(--bg)',
          }} />
        )}
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      <div style={{
        position: 'fixed', bottom: '102px', right: '28px', zIndex: 199,
        width: '388px', height: '570px', background: 'var(--white)',
        borderRadius: '22px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        border: '1px solid var(--border)', overflow: 'hidden',
        transform: open ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(24px)',
        transformOrigin: 'bottom right',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        transition: 'all .28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{ background: 'var(--navy)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--magenta)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, position: 'relative', color: '#fff' }}>
            ✦
            <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '11px', height: '11px', borderRadius: '50%', background: 'var(--green)', border: '2.5px solid var(--navy)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>Próspero · Tutor IA</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '1px' }}>
              Disponible ahora · Semana {week?.week_number ?? '?'}
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
        </div>

        {/* Chips */}
        <div style={{ padding: '10px 14px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {Object.entries(CHIPS).map(([label, msg]) => (
            <button key={label} onClick={() => send(msg)} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 11px', borderRadius: '20px', background: 'var(--bg)', color: 'var(--ink2)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#fff', background: m.role === 'user' ? 'var(--teal)' : 'var(--magenta)' }}>
                {m.role === 'user' ? getInitials(user?.nickname || user?.full_name || 'Yo') : '✦'}
              </div>
              <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ padding: '10px 13px', borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', fontSize: '13px', lineHeight: 1.55, background: m.role === 'user' ? 'var(--magenta)' : 'var(--bg)', color: m.role === 'user' ? '#fff' : 'var(--ink)' }}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--magenta)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>✦</div>
              <div style={{ background: 'var(--bg)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                {[0, 200, 400].map(delay => (
                  <div key={delay} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--ink4)', animation: `tdBounce 1.2s infinite ${delay}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={msgsEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Preguntale algo a Próspero..."
            rows={1}
            style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: '12px', padding: '9px 13px', fontSize: '13px', color: 'var(--ink)', fontFamily: 'inherit', resize: 'none', outline: 'none', background: 'var(--bg)', maxHeight: '90px', lineHeight: 1.5, transition: 'border-color .15s' }}
            onFocus={e => { e.target.style.borderColor = 'var(--magenta)'; e.target.style.background = '#fff' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg)' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: !input.trim() || loading ? 'var(--ink4)' : 'var(--magenta)', border: 'none', color: '#fff', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s', fontFamily: 'inherit' }}
          >
            ➤
          </button>
        </div>
      </div>
    </>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ height: '57px', background: 'rgba(245,244,240,0.96)', borderBottom: '1px solid var(--border)' }} />
      <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[80, 200, 100, 260].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: '16px', background: 'var(--bg2)', animation: 'pulse 1.6s ease-in-out infinite' }} />
        ))}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

function NoCohortScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', background: 'var(--bg)',
    }}>
      <div style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'var(--navy)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px',
        }}>🚀</div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', marginBottom: '10px' }}>
          Tu lugar está confirmado
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--ink3)', lineHeight: 1.65, marginBottom: '28px' }}>
          Tu cohorte todavía no está activa. Te vamos a avisar por email cuando arranque el programa y tu dashboard se active.
        </p>
        <div style={{
          background: 'var(--white)', borderRadius: '14px', padding: '18px 20px',
          border: '1.5px solid var(--border)', textAlign: 'left',
        }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Mientras tanto podés
          </p>
          {[
            '📩 Revisar el email de bienvenida',
            '📅 Guardar las fechas del programa',
            '🤝 Unirte al Discord del programa',
          ].map(item => (
            <p key={item} style={{ fontSize: '14px', color: 'var(--ink2)', marginBottom: '6px', fontWeight: 500 }}>
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [resp, setResp]       = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [noCohort, setNoCohort] = useState(false)

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        if (r.status === 404) { setNoCohort(true); return null }
        return r.json()
      })
      .then(d => { if (d) setResp(d) })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <LoadingScreen />
  if (noCohort) return <NoCohortScreen />
  if (!resp) return null

  const { data, isReflectionUnlocked, daysUntilDeadline } = resp
  const { user, cohort, currentWeek, currentDeliverable, currentReflection,
          pod, podMembers, buddy, recentActivity, streakDays, isPodLeader } = data

  const nickname   = user.nickname || user.full_name.split(' ')[0]
  const avatarChar = user.avatar_url && user.avatar_url.length <= 2 ? user.avatar_url : null
  const isSubmitted = currentDeliverable?.status === 'submitted' || currentDeliverable?.status === 'reviewed'
  const isSunday   = new Date().getDay() === 0
  const reflectionAvailable = isReflectionUnlocked && isSubmitted

  // Greeting sub-text
  const greetingSub = isSubmitted
    ? '¡Ya entregaste esta semana! Mirá cómo va tu pod 👀'
    : currentWeek
      ? `Tenés ${daysUntilDeadline} día${daysUntilDeadline !== 1 ? 's' : ''} para entregar tu entregable. ¡Vamos!`
      : 'Bienvenido/a al programa. ¡Empecemos!'

  return (
    <>
      {/* ── TOPBAR ── */}
      <div style={{
        background: 'rgba(245,244,240,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--navy)', color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '20px' }}>
            Semana{' '}
            <span style={{ color: 'var(--green)', fontWeight: 800 }}>{cohort.current_week}</span>
            {' '}de 6 · {new Date().toLocaleDateString('es', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase())}
          </div>
          {currentWeek && (
            <span style={{ fontSize: '12px', color: 'var(--ink3)', fontWeight: 500 }}>
              Fase {currentWeek.phase} {PHASE_EMOJI[currentWeek.phase] ?? ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {streakDays > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gold-l)', border: '1px solid rgba(224,163,38,0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: 'var(--ink2)' }}>
              🔥 {streakDays} día{streakDays !== 1 ? 's' : ''} seguido{streakDays !== 1 ? 's' : ''}
            </div>
          )}
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: avatarChar ? '18px' : '13px', fontWeight: 800, color: '#fff', cursor: 'default', userSelect: 'none' }}>
            {avatarChar ?? getInitials(nickname)}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '24px 28px 40px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '22px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--ink3)', marginBottom: '3px' }}>{todayLabel()}</p>
            <h1 style={{ fontWeight: 800, fontSize: '28px', color: 'var(--ink)', lineHeight: 1.1, margin: 0 }}>
              Hola, {nickname} 👋
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--ink3)', marginTop: '4px' }}>{greetingSub}</p>
          </div>
          {currentWeek && (
            <div style={{ flexShrink: 0, background: 'var(--navy)', color: 'var(--green)', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
              {LEVEL[currentWeek.phase] ?? 'Nivel Explorer 🔍'}
            </div>
          )}
        </div>

        {/* Hero Banner */}
        {currentWeek && (
          <div style={{ background: 'var(--navy)', borderRadius: '18px', padding: '26px 28px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', overflow: 'hidden' }}>
            {/* Glows */}
            <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '250px', height: '250px', background: 'radial-gradient(circle,rgba(0,200,150,0.15) 0%,transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: '40%', bottom: '-40px', width: '180px', height: '180px', background: 'radial-gradient(circle,rgba(0,140,165,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
            {/* Ghost week number */}
            <div style={{ position: 'absolute', right: '155px', top: '-18px', fontSize: '170px', fontWeight: 900, color: 'rgba(255,255,255,0.03)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
              {cohort.current_week}
            </div>

            {/* Left */}
            <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--green)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '6px', height: '6px', background: 'var(--green)', borderRadius: '50%', flexShrink: 0 }} />
                Fase {currentWeek.phase} · Semana {cohort.current_week} de 6
              </div>
              <h2 style={{ fontWeight: 800, fontSize: '24px', color: '#fff', lineHeight: 1.15, marginBottom: '10px', margin: '0 0 10px' }}>
                {currentWeek.title}
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.65, fontStyle: 'italic', maxWidth: '400px', margin: 0 }}>
                "{currentWeek.opening_question}"
              </p>
            </div>

            {/* Right: days countdown + week dots */}
            <div style={{ textAlign: 'right', flexShrink: 0, position: 'relative', zIndex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: '58px', color: 'var(--green)', lineHeight: 1 }}>
                {daysUntilDeadline}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
                día{daysUntilDeadline !== 1 ? 's' : ''} para entregar
              </div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '14px' }}>
                {Array.from({ length: 6 }).map((_, i) => {
                  const done  = i < cohort.current_week - 1
                  const now   = i === cohort.current_week - 1
                  return (
                    <div key={i} style={{ height: '5px', borderRadius: '3px', width: now || done ? '22px' : '16px', background: done ? 'var(--green)' : now ? 'rgba(0,200,150,0.45)' : 'rgba(255,255,255,0.14)' }} />
                  )
                })}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textAlign: 'right', marginTop: '4px' }}>
                Semana {cohort.current_week} de 6
              </div>
            </div>
          </div>
        )}

        {/* 3 Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <StatCard
            label="Entregable esta semana"
            value={isSubmitted ? '✓' : '0'}
            color={isSubmitted ? 'green' : 'coral'}
            sublabel={isSubmitted ? 'entregado y listo' : 'aún sin entregar'}
          />
          <StatCard
            label="Días seguidos activo/a"
            value={streakDays > 0 ? `${streakDays} 🔥` : '—'}
            color="gold"
            sublabel="en el programa"
          />
          <StatCard
            label="Progreso del programa"
            value={`${cohort.current_week}/6`}
            color="green"
            sublabel={`Semana ${cohort.current_week} de ${cohort.current_week === 6 ? '6 · ¡Última!' : '6'}`}
          />
        </div>

        {/* Deliverable + Video 2-col */}
        {currentWeek && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

            {/* Deliverable card */}
            <div style={{ background: 'var(--white)', borderRadius: '16px', border: `2px ${isSubmitted ? 'solid' : 'dashed'} ${isSubmitted ? 'var(--green)' : 'var(--bg2)'}`, padding: '20px', transition: 'border-color .2s, background .2s', cursor: 'default' }}
              onMouseEnter={e => { if (!isSubmitted) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--green)'; (e.currentTarget as HTMLElement).style.background = '#f0fef9' } }}
              onMouseLeave={e => { if (!isSubmitted) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg2)'; (e.currentTarget as HTMLElement).style.background = 'var(--white)' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Badge variant={isSubmitted ? 'green' : 'coral'} dot>
                  {isSubmitted ? 'Entregado ✓' : 'Pendiente'}
                </Badge>
                {!isSubmitted && (
                  <span style={{ fontSize: '12px', color: 'var(--coral)', fontWeight: 700 }}>
                    ⏱ Dom 23:59 · {daysUntilDeadline} día{daysUntilDeadline !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)', marginBottom: '10px', lineHeight: 1.3, margin: '0 0 10px' }}>
                {currentWeek.deliverable_description}
              </h3>

              <div style={{ fontSize: '13px', color: 'var(--ink2)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', borderLeft: '3px solid var(--green)' }}>
                <strong style={{ color: 'var(--ink)' }}>Señal de éxito:</strong>{' '}
                {currentWeek.success_signal}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link href="/deliverables" style={{ textDecoration: 'none' }}>
                  <Button variant={isSubmitted ? 'teal' : 'primary'} size="md">
                    {isSubmitted ? '✓ Ver entregable' : '↑ Subir entregable'}
                  </Button>
                </Link>
                {currentWeek.notion_guide_url && (
                  <a href={currentWeek.notion_guide_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" size="md">Ver guía técnica</Button>
                  </a>
                )}
              </div>
            </div>

            {/* Video card */}
            <div style={{ background: 'var(--navy)', borderRadius: '16px', padding: '22px', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform .2s, box-shadow .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(14,42,71,0.22)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
            >
              <div style={{ position: 'absolute', right: '14px', bottom: '14px', fontSize: '52px', color: 'rgba(0,200,150,0.1)', userSelect: 'none' }}>▶</div>
              <p style={{ fontSize: '11px', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '8px', margin: '0 0 8px' }}>
                Video del mentor · Semana {cohort.current_week}
              </p>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: '#fff', lineHeight: 1.3, marginBottom: '6px', margin: '0 0 6px' }}>
                {currentWeek.title}
              </h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginBottom: '16px', margin: '0 0 16px' }}>
                {currentWeek.tools?.join(' + ') || 'Herramientas de la semana'}
              </p>
              {currentWeek.mentor_video_url ? (
                <a href={currentWeek.mentor_video_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm">▶ Ver ahora</Button>
                </a>
              ) : (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Video disponible pronto</p>
              )}
            </div>
          </div>
        )}

        {/* Reflection card */}
        <div style={{ background: 'var(--mag-l)', border: '1px solid rgba(165,8,107,0.15)', borderRadius: '16px', padding: '18px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '38px', height: '38px', background: 'var(--magenta)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, color: '#fff' }}>
              ✦
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ink)', margin: 0 }}>
                Reflexión del domingo — Método finlandés
              </p>
              <p style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '1px', margin: '1px 0 0' }}>
                Se activa junto al entregable · No se puede saltear · Forma parte del cierre de semana
              </p>
            </div>
          </div>

          <div style={{ background: 'rgba(165,8,107,0.07)', borderRadius: '9px', padding: '11px 14px', fontSize: '13px', color: 'var(--ink2)', display: 'flex', alignItems: 'center', gap: '9px' }}>
            {reflectionAvailable ? (
              <Link href="/deliverables" style={{ color: 'var(--magenta)', fontWeight: 700, textDecoration: 'none' }}>
                ✦ Reflexión disponible — respondé las dos preguntas →
              </Link>
            ) : !isSunday ? (
              '🔒 Disponible el domingo — dos preguntas de aprendizaje que aparecen al subir tu entregable'
            ) : !isSubmitted ? (
              '🔒 Primero subí tu entregable — luego se habilita la reflexión'
            ) : (
              '🔒 Disponible el domingo — dos preguntas de aprendizaje que aparecen al subir tu entregable'
            )}
          </div>
        </div>

        {/* Pod section */}
        {pod && podMembers.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)', margin: 0 }}>
                Mi Pod · {pod.name} 🌎
              </h2>
              {pod.discord_channel_url && (
                <a href={pod.discord_channel_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>
                  Abrir canal en Discord →
                </a>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(podMembers.length, 4)}, 1fr)`, gap: '10px', marginBottom: '24px' }}>
              {podMembers.map((m: PodMemberWithUser, i: number) => {
                const isMe    = m.user.id === user.id
                const isBuddy = m.user.id === buddy?.id
                const nick    = m.user.nickname || m.user.full_name.split(' ')[0]
                const emojiAv = m.user.avatar_url && m.user.avatar_url.length <= 2 ? m.user.avatar_url : null
                const inactive = (m as any).hoursInactive > 48
                const submitted = (m as any).hasSubmittedThisWeek
                const online   = (m as any).isOnline

                return (
                  <div
                    key={m.user.id}
                    style={{
                      background: isMe ? '#fafffe' : 'var(--white)',
                      borderRadius: '14px', padding: '16px 12px',
                      border: `1.5px solid ${isMe ? 'var(--green)' : 'var(--border)'}`,
                      textAlign: 'center', cursor: 'default', position: 'relative',
                      transition: 'border-color .2s, transform .2s, box-shadow .2s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      if (!isMe) el.style.borderColor = 'var(--teal)'
                      el.style.transform = 'translateY(-2px)'
                      el.style.boxShadow = '0 5px 18px rgba(14,42,71,0.07)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      if (!isMe) el.style.borderColor = 'var(--border)'
                      el.style.transform = ''
                      el.style.boxShadow = ''
                    }}
                  >
                    {/* "Tú" tag */}
                    {isMe && (
                      <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--green)', color: 'var(--navy)', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Tú
                      </div>
                    )}

                    {/* Alert pip for inactive */}
                    {inactive && !isMe && (
                      <div style={{ position: 'absolute', top: '9px', right: '9px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--coral)', border: '2.5px solid var(--white)' }} />
                    )}

                    {/* Avatar with online dot */}
                    <div style={{ margin: '0 auto 9px', width: 'fit-content' }}>
                      <Avatar
                        name={nick}
                        emoji={emojiAv ?? undefined}
                        size="lg"
                        isOnline={online}
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] } as React.CSSProperties}
                      />
                    </div>

                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 2px' }}>{nick}</p>
                    <p style={{ fontSize: '11px', color: 'var(--ink3)', margin: '0 0 7px' }}>
                      {m.user.country}
                      {m.podMember.is_pod_leader_this_week ? ' · Pod Leader ✦' : ''}
                      {isBuddy ? ' · Tu buddy' : ''}
                    </p>

                    {/* Status chip */}
                    {isMe ? (
                      <Badge variant="green" size="sm">{isPodLeader ? 'Pod Leader' : 'Activo/a'}</Badge>
                    ) : isBuddy ? (
                      <Badge variant="coral" size="sm">Buddy</Badge>
                    ) : submitted ? (
                      <Badge variant="teal" size="sm">Entregó ✓</Badge>
                    ) : inactive ? (
                      <Badge variant="coral" size="sm">Sin actividad</Badge>
                    ) : (
                      <Badge variant="teal" size="sm">Activo/a</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Activity Feed */}
        {recentActivity && recentActivity.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--ink)', margin: 0 }}>
                Lo que está pasando 👀
              </h2>
              <Link href="/pod" style={{ fontSize: '13px', color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>
                Ver todo →
              </Link>
            </div>

            <div style={{ background: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '24px' }}>
              {(recentActivity as ActivityFeedItem[]).map((item, i) => {
                const feedName = item.user.nickname || item.user.full_name?.split(' ')[0] || 'Alguien'
                const emojiAv  = item.user.avatar_url && item.user.avatar_url.length <= 2 ? item.user.avatar_url : null
                const colors   = ['var(--coral)', 'var(--teal)', 'var(--magenta)', 'var(--navy2)', 'var(--gold)', 'var(--green)']
                const color    = colors[i % colors.length]
                const isLast   = i === recentActivity.length - 1

                return (
                  <div
                    key={item.id}
                    style={{ display: 'grid', gridTemplateColumns: '40px 1fr 64px', gap: '12px', alignItems: 'start', padding: '13px 18px', borderBottom: isLast ? 'none' : '1px solid var(--border)', cursor: 'default', transition: 'background .12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    {/* Avatar */}
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: emojiAv ? '18px' : '13px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {emojiAv ?? getInitials(feedName)}
                    </div>

                    {/* Text */}
                    <div style={{ fontSize: '13px', color: 'var(--ink2)', lineHeight: 1.55, paddingTop: '2px' }}>
                      <strong style={{ color: 'var(--ink)' }}>{feedName}</strong>{' '}
                      {item.message.replace(feedName, '').trim()}
                      {item.tagLabel && (
                        <FeedTag type={item.tagType} label={item.tagLabel} />
                      )}
                    </div>

                    {/* Time */}
                    <div style={{ fontSize: '11px', color: 'var(--ink4)', whiteSpace: 'nowrap', paddingTop: '4px', textAlign: 'right' }}>
                      {item.timeAgo}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>

      {/* Próspero FAB */}
      <ProsperoPanel user={user} week={currentWeek} />

      <style>{`
        @keyframes tdBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      `}</style>
    </>
  )
}
