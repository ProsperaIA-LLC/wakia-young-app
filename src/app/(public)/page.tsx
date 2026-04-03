'use client'

import Link from 'next/link'
import { useState } from 'react'

// ── Data ──────────────────────────────────────────────────────────────────────

const PHASES = [
  {
    num: '01',
    label: 'DESPERTAR',
    weeks: 'Semanas 1–2',
    title: 'Encuentras el problema real',
    description: 'Sales a hablar con personas reales. Validas que el problema existe antes de construir nada.',
    color: '#008ca5',
    bg: 'linear-gradient(135deg, #e0f4f8 0%, #f0fafc 100%)',
    icon: '🔍',
  },
  {
    num: '02',
    label: 'CONSTRUIR',
    weeks: 'Semanas 3–5',
    title: 'Construyes algo que funciona',
    description: 'Haces un prototipo funcional con IA. Un extraño lo puede usar sin que tú lo expliques.',
    color: '#00c896',
    bg: 'linear-gradient(135deg, #d6faf2 0%, #edfff9 100%)',
    icon: '⚡',
  },
  {
    num: '03',
    label: 'LANZAR',
    weeks: 'Semana 6',
    title: 'Demo Day en público',
    description: 'Muestras tu producto, tu modelo de negocio y tu pitch ante mentores y la comunidad.',
    color: '#e0a326',
    bg: 'linear-gradient(135deg, #fef3d7 0%, #fffbef 100%)',
    icon: '🚀',
  },
]

const WEEKS = [
  { num: 1, phase: 'Despertar', title: 'El problema que te duele', color: '#008ca5' },
  { num: 2, phase: 'Despertar', title: 'IA como forma de pensar', color: '#008ca5' },
  { num: 3, phase: 'Construir', title: 'Algo real en 5 días', color: '#00c896' },
  { num: 4, phase: 'Construir', title: 'Las 3 preguntas del negocio', color: '#00c896' },
  { num: 5, phase: 'Construir', title: 'Agentes que trabajan mientras duermes', color: '#00c896' },
  { num: 6, phase: 'Lanzar', title: 'Demo Day: tu primer hito público', color: '#e0a326' },
]

const INCLUDED = [
  { icon: '🤖', title: 'Luna, tu tutora de IA', desc: 'Disponible 24/7. Te guía sin hacerte el trabajo.', color: '#a5086b', bg: 'var(--mag-l)' },
  { icon: '👥', title: 'Pod de 4–5 estudiantes', desc: 'Tu grupo de accountability. De toda LATAM, misma zona horaria.', color: '#008ca5', bg: 'var(--teal-l)' },
  { icon: '🎯', title: 'Mentoría semanal', desc: 'Mentores que revisan tu trabajo y te dan feedback real.', color: '#0E2A47', bg: '#e8eef5' },
  { icon: '🏆', title: 'Certificación FGU', desc: 'Certificado internacional avalado por FGU al completar el programa.', color: '#e0a326', bg: 'var(--gold-l)' },
  { icon: '💡', title: '1 proyecto tuyo, real', desc: 'No un ejercicio. Un producto que resuelve un problema que tú elegiste.', color: '#00c896', bg: 'var(--green-l)' },
  { icon: '♾️', title: 'Comunidad vitalicia', desc: 'Acceso permanente a la red de builders de Prospera Young.', color: '#ff5c35', bg: 'var(--coral-l)' },
]

const FAQS = [
  {
    q: '¿Necesito saber programar?',
    a: 'No. Usas herramientas de IA como Claude Code, Glide y n8n que no requieren código. Si ya sabes programar, vas a ir más rápido — pero no es requisito.',
  },
  {
    q: '¿En qué idioma es el programa?',
    a: 'Todo en español. Si estás en USA, puedes participar igualmente — la comunidad es bilingüe.',
  },
  {
    q: '¿Qué horario requiere?',
    a: 'Calcula unas 8–10 horas por semana. La sesión en vivo es los sábados (1 hora). El resto es trabajo asincrónico a tu ritmo.',
  },
  {
    q: '¿Qué pasa si me atraso?',
    a: 'Tu buddy y tu Pod te sostienen. Los mentores reciben alerta si no entras en 48hs. No estás solo/a.',
  },
  {
    q: '¿Puedo acceder a una beca?',
    a: 'Sí. Tenemos becas parciales y completas para estudiantes que lo necesiten. El proceso es rápido.',
  },
  {
    q: '¿Qué obtengo al terminar?',
    a: 'Un producto publicado, tu pitch grabado, el certificado FGU y una red de builders latinos. Eso es tu portafolio.',
  },
]

const PRICE_FEATURES = [
  'Acceso completo a las 6 semanas',
  'Pod de 4–5 estudiantes',
  'Luna, tutora de IA 24/7',
  'Mentoría semanal con expertos',
  'Certificación FGU',
  'Comunidad vitalicia',
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--ink)' }}>

      <style>{`
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(14,42,71,0.12); }
        .btn-green { transition: background 0.15s, transform 0.15s; }
        .btn-green:hover { background: var(--green-d) !important; transform: translateY(-1px); }
        .btn-ghost:hover { background: rgba(255,255,255,0.18) !important; }
        .week-row { transition: all 0.15s; }
        .week-row:hover { background: #f0fdf9 !important; border-color: rgba(0,200,150,0.3) !important; }
        .faq-btn:hover { background: var(--bg) !important; }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .pulse { animation: pulse-dot 2s ease-in-out infinite; }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(245,244,240,0.94)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto', padding: '0 24px',
          height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 900, fontSize: '19px', color: 'var(--navy)', letterSpacing: '-0.03em' }}>
            Prospera Young <span style={{ color: 'var(--green)' }}>AI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/login" style={{
              color: 'var(--ink2)', fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', padding: '8px 14px', borderRadius: '8px',
            }}>
              Iniciar sesión
            </Link>
            <Link href="/apply" className="btn-green" style={{
              background: 'var(--green)', color: 'var(--white)', fontWeight: 700,
              fontSize: '14px', textDecoration: 'none', padding: '10px 20px',
              borderRadius: 'var(--radius-btn)', whiteSpace: 'nowrap',
              display: 'inline-block',
            }}>
              Aplicar ahora →
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section style={{
          background: 'linear-gradient(135deg, #0E2A47 0%, #163857 55%, #0e3350 100%)',
          borderRadius: '24px', padding: '72px 56px 64px',
          marginTop: '20px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,150,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '25%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(165,8,107,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40%', right: '10%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,140,165,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto', gap: '48px', alignItems: 'center' }}>
            {/* Left: text */}
            <div style={{ maxWidth: '620px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,92,53,0.18)', border: '1px solid rgba(255,92,53,0.35)',
                borderRadius: '20px', padding: '7px 16px', marginBottom: '28px',
              }}>
                <span className="pulse" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff5c35', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ff5c35', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Próxima cohorte · Mayo 2025
                </span>
              </div>

              <h1 style={{
                fontWeight: 900, fontSize: 'clamp(34px, 4.5vw, 54px)',
                color: '#ffffff', margin: '0 0 22px', lineHeight: 1.08,
                letterSpacing: '-0.03em',
              }}>
                Construye tu primer<br />
                producto con IA.
                <span style={{
                  display: 'block', marginTop: '4px',
                  background: 'linear-gradient(90deg, #00c896, #00e8b0)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  En 6 semanas.
                </span>
              </h1>

              <p style={{
                fontSize: '18px', color: 'rgba(255,255,255,0.7)',
                margin: '0 0 36px', lineHeight: 1.65, maxWidth: '520px',
              }}>
                El programa intensivo para jóvenes latinos de{' '}
                <strong style={{ color: '#ffffff' }}>14 a 18 años</strong>{' '}
                que aprenden haciendo — no leyendo. Sales con un proyecto real, validado y publicado.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/apply" className="btn-green" style={{
                  background: 'var(--green)', color: '#ffffff',
                  fontWeight: 800, fontSize: '16px', textDecoration: 'none',
                  padding: '15px 32px', borderRadius: 'var(--radius-btn)',
                  display: 'inline-block', boxShadow: '0 4px 20px rgba(0,200,150,0.35)',
                }}>
                  Aplicar ahora →
                </Link>
                <Link href="/scholarship" className="btn-ghost" style={{
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)',
                  fontWeight: 600, fontSize: '15px', textDecoration: 'none',
                  padding: '15px 24px', borderRadius: 'var(--radius-btn)',
                  border: '1px solid rgba(255,255,255,0.15)', display: 'inline-block',
                }}>
                  Ver becas
                </Link>
              </div>
            </div>

            {/* Right: outcome cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
              {[
                { icon: '📱', text: 'Producto publicado', sub: 'que un extraño puede usar' },
                { icon: '🎤', text: 'Pitch grabado', sub: 'listo para tu portafolio' },
                { icon: '🏆', text: 'Certificación FGU', sub: 'reconocida internacionalmente' },
              ].map(card => (
                <div key={card.text} style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px', padding: '14px 16px',
                  display: 'flex', gap: '12px', alignItems: 'center',
                  backdropFilter: 'blur(8px)',
                }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>{card.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>{card.text}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>{card.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats bar ─────────────────────────────────────────────────────── */}
        <section style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          marginTop: '16px', background: 'var(--navy)',
          borderRadius: '16px', overflow: 'hidden',
        }}>
          {[
            { value: '6', label: 'semanas', color: '#00c896' },
            { value: '1', label: 'proyecto real', color: '#00c896' },
            { value: '4–5', label: 'compañeros en tu pod', color: '#008ca5' },
            { value: '100%', label: 'en español', color: '#e0a326' },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              padding: '22px 16px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ fontWeight: 900, fontSize: '30px', color: stat.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '5px', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* ── 3 Phases ──────────────────────────────────────────────────────── */}
        <section style={{ marginTop: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink3)', marginBottom: '12px' }}>
              Estructura del programa
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(26px, 3vw, 38px)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
              Tres fases. Un proyecto. Resultados reales.
            </h2>
            <p style={{ color: 'var(--ink3)', fontSize: '16px', margin: 0, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
              No aprendes sobre IA. Aprendes <em>con</em> IA, construyendo algo que importa.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            {PHASES.map((phase) => (
              <div key={phase.label} className="card-hover" style={{
                background: phase.bg,
                borderRadius: '20px', padding: '32px',
                border: `1px solid ${phase.color}22`,
                position: 'relative', overflow: 'hidden', cursor: 'default',
              }}>
                {/* Big background number */}
                <div style={{
                  position: 'absolute', top: '-10px', right: '16px',
                  fontWeight: 900, fontSize: '100px', lineHeight: 1,
                  color: `${phase.color}12`, letterSpacing: '-0.04em',
                  pointerEvents: 'none', userSelect: 'none',
                }}>
                  {phase.num}
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '16px',
                    background: `${phase.color}20`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px', marginBottom: '20px',
                  }}>
                    {phase.icon}
                  </div>
                  <div style={{
                    display: 'inline-block', background: `${phase.color}18`,
                    color: phase.color, fontWeight: 700, fontSize: '11px',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: '20px', marginBottom: '10px',
                  }}>
                    {phase.label} · {phase.weeks}
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '21px', margin: '0 0 12px', color: 'var(--ink)', lineHeight: 1.2 }}>
                    {phase.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--ink2)', margin: 0, lineHeight: 1.65 }}>
                    {phase.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Week by week ──────────────────────────────────────────────────── */}
        <section style={{ marginTop: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink3)', marginBottom: '12px' }}>
              Semana a semana
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 3vw, 34px)', margin: 0, letterSpacing: '-0.02em' }}>
              Lo que construyes cada semana
            </h2>
          </div>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: '27px', top: '20px', bottom: '20px',
              width: '2px',
              background: 'linear-gradient(to bottom, #008ca5, #008ca5, #00c896, #00c896, #00c896, #e0a326)',
              borderRadius: '2px', zIndex: 0,
            }} />

            {WEEKS.map(week => (
              <div key={week.num} className="week-row" style={{
                background: 'var(--white)', borderRadius: '14px',
                padding: '16px 20px 16px 68px', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '20px',
                flexWrap: 'wrap', position: 'relative', cursor: 'default',
              }}>
                {/* Circle number */}
                <div style={{
                  position: 'absolute', left: '8px',
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: week.color, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '15px', flexShrink: 0,
                  boxShadow: `0 0 0 4px white, 0 0 0 5px ${week.color}40`,
                  zIndex: 1,
                }}>
                  {week.num}
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{
                    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.07em', color: week.color, marginBottom: '3px',
                  }}>
                    {week.phase}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                    {week.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── What's included ───────────────────────────────────────────────── */}
        <section style={{ marginTop: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink3)', marginBottom: '12px' }}>
              Todo incluido
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 3vw, 34px)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
              Lo que recibes en el programa
            </h2>
            <p style={{ color: 'var(--ink3)', fontSize: '16px', margin: 0 }}>
              No hay extras ni sorpresas. Todo lo que necesitas para construir está incluido.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            {INCLUDED.map(item => (
              <div key={item.title} className="card-hover" style={{
                background: 'var(--white)', borderRadius: '18px',
                padding: '24px', border: '1px solid var(--border)',
                display: 'flex', gap: '18px', alignItems: 'flex-start',
                cursor: 'default',
              }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '14px',
                  background: item.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '24px', flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ink)', marginBottom: '5px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink3)', lineHeight: 1.6 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Luna callout ──────────────────────────────────────────────────── */}
        <section style={{
          marginTop: '80px',
          background: 'linear-gradient(135deg, #0E2A47 0%, #2a0a1e 100%)',
          borderRadius: '24px', padding: '56px 52px',
          display: 'flex', gap: '48px', alignItems: 'center', flexWrap: 'wrap',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(165,8,107,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #a5086b, #d10d8a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '42px', flexShrink: 0,
            boxShadow: '0 0 40px rgba(165,8,107,0.4)',
          }}>
            🤖
          </div>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: '#d94da0', marginBottom: '10px',
            }}>
              Tutora de IA · Disponible 24/7
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 2.5vw, 30px)', color: '#ffffff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
              Luna está cuando la necesitas
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', margin: '0 0 24px', lineHeight: 1.65, maxWidth: '480px' }}>
              Luna sabe en qué semana estás, qué tienes que entregar y cómo va tu proyecto.
              No te da las respuestas — te hace las preguntas correctas para que tú llegues.
            </p>
            {/* Fake chat bubble */}
            <div style={{
              background: 'rgba(255,255,255,0.07)', borderRadius: '14px',
              padding: '14px 18px', maxWidth: '380px',
              border: '1px solid rgba(165,8,107,0.3)',
            }}>
              <div style={{ fontSize: '12px', color: '#d94da0', fontWeight: 700, marginBottom: '6px' }}>Luna</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                "¿Ya hablaste con alguien que tenga ese problema? ¿Qué te dijo exactamente?"
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────────────── */}
        <section style={{ marginTop: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink3)', marginBottom: '12px' }}>
              Inversión
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 3vw, 34px)', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Precios por mercado
            </h2>
            <p style={{ color: 'var(--ink3)', fontSize: '15px', margin: 0 }}>
              El early bird cierra cuando se llenan los cupos. No hay lista de espera.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
            {/* LATAM */}
            <div className="card-hover" style={{
              background: 'var(--white)', borderRadius: '20px',
              padding: '36px', border: '1px solid var(--border)', cursor: 'default',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌎</div>
              <div style={{ fontWeight: 800, fontSize: '20px', marginBottom: '4px' }}>Latinoamérica</div>
              <div style={{ color: 'var(--ink3)', fontSize: '13px', marginBottom: '24px' }}>
                MX · CO · AR · PE · CL y más
              </div>
              <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontWeight: 900, fontSize: '44px', color: 'var(--navy)', letterSpacing: '-0.03em' }}>$197</span>
                <span style={{ color: 'var(--ink3)', fontSize: '14px' }}>USD</span>
              </div>
              <div style={{ display: 'inline-block', background: 'var(--green-l)', color: 'var(--green-d)', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', marginBottom: '24px' }}>
                Early bird — ahorra $100
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                {PRICE_FEATURES.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: 'var(--ink2)' }}>
                    <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '14px' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/apply?market=LATAM" className="btn-green" style={{
                display: 'block', textAlign: 'center', background: 'var(--green)',
                color: '#ffffff', fontWeight: 700, textDecoration: 'none',
                padding: '14px', borderRadius: 'var(--radius-btn)', fontSize: '15px',
              }}>
                Aplicar — LATAM →
              </Link>
            </div>

            {/* USA */}
            <div style={{
              background: 'linear-gradient(160deg, #0E2A47 0%, #163857 100%)',
              borderRadius: '20px', padding: '36px',
              border: '2px solid var(--green)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,150,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{
                position: 'absolute', top: '18px', right: '18px',
                background: 'var(--green)', color: '#ffffff',
                fontSize: '11px', fontWeight: 700, padding: '5px 12px',
                borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Early bird
              </div>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🇺🇸</div>
              <div style={{ fontWeight: 800, fontSize: '20px', color: '#ffffff', marginBottom: '4px' }}>Estados Unidos</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '24px' }}>Para estudiantes en USA</div>
              <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontWeight: 900, fontSize: '44px', color: 'var(--green)', letterSpacing: '-0.03em' }}>$497</span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>USD</span>
              </div>
              <div style={{ display: 'inline-block', background: 'rgba(0,200,150,0.15)', color: 'var(--green)', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', marginBottom: '24px' }}>
                Ahorra $300 vs. precio regular
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                {PRICE_FEATURES.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
                    <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '14px' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/apply?market=USA" className="btn-green" style={{
                display: 'block', textAlign: 'center', background: 'var(--green)',
                color: '#ffffff', fontWeight: 700, textDecoration: 'none',
                padding: '14px', borderRadius: 'var(--radius-btn)', fontSize: '15px',
                boxShadow: '0 4px 20px rgba(0,200,150,0.3)',
              }}>
                Aplicar — USA →
              </Link>
            </div>
          </div>

          {/* Scholarship banner */}
          <div style={{
            marginTop: '16px',
            background: 'linear-gradient(135deg, var(--gold-l), #fffdf0)',
            borderRadius: '16px', padding: '22px 28px',
            display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap',
            border: '1px solid rgba(224,163,38,0.25)',
          }}>
            <span style={{ fontSize: '32px' }}>🎓</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ink)', marginBottom: '3px' }}>
                ¿No puedes pagar? Hay becas disponibles.
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ink2)' }}>
                Tenemos becas parciales y completas. Si el dinero es el único obstáculo, aplica igual.
              </div>
            </div>
            <Link href="/scholarship" style={{
              background: 'var(--gold)', color: '#ffffff', fontWeight: 700,
              fontSize: '14px', textDecoration: 'none', padding: '11px 22px',
              borderRadius: 'var(--radius-btn)', whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(224,163,38,0.3)',
            }}>
              Ver becas →
            </Link>
          </div>
        </section>

        {/* ── Who it's for ──────────────────────────────────────────────────── */}
        <section style={{ marginTop: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink3)', marginBottom: '12px' }}>
              ¿Es para mí?
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 3vw, 34px)', margin: 0, letterSpacing: '-0.02em' }}>
              Para ti si...
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
            {[
              { check: true,  text: 'Tienes entre 14 y 18 años' },
              { check: true,  text: 'Vives en LATAM o en USA' },
              { check: true,  text: 'Quieres construir algo real, no solo aprender teoría' },
              { check: true,  text: 'No sabes programar (o sí sabes, da igual)' },
              { check: true,  text: 'Puedes dedicar 8–10 horas por semana' },
              { check: false, text: 'Buscas un curso de videos para ver a tu ritmo sin compromiso' },
            ].map((item, i) => (
              <div key={i} style={{
                background: item.check ? 'var(--white)' : 'transparent',
                borderRadius: '14px', padding: '16px 20px',
                border: `1.5px solid ${item.check ? 'var(--border)' : 'rgba(17,17,16,0.05)'}`,
                display: 'flex', gap: '14px', alignItems: 'center',
              }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                  background: item.check ? 'var(--green)' : 'var(--coral-l)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                  color: item.check ? '#ffffff' : 'var(--coral)',
                }}>
                  {item.check ? '✓' : '✕'}
                </div>
                <span style={{
                  fontSize: '14px', fontWeight: item.check ? 600 : 400,
                  color: item.check ? 'var(--ink)' : 'var(--ink3)',
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section style={{ marginTop: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink3)', marginBottom: '12px' }}>
              Preguntas frecuentes
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 3vw, 34px)', margin: 0, letterSpacing: '-0.02em' }}>
              Lo que más nos preguntan
            </h2>
          </div>

          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                background: 'var(--white)', borderRadius: '14px',
                border: `1.5px solid ${openFaq === i ? 'var(--teal)' : 'var(--border)'}`,
                overflow: 'hidden', transition: 'border-color 0.2s',
              }}>
                <button
                  className="faq-btn"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '20px 22px', background: 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '16px',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                    {faq.q}
                  </span>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: openFaq === i ? 'var(--teal)' : 'var(--bg2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: openFaq === i ? '#ffffff' : 'var(--ink3)',
                    fontSize: '18px', fontWeight: 300, transition: 'all 0.2s',
                    transform: openFaq === i ? 'rotate(45deg)' : 'none',
                  }}>
                    +
                  </div>
                </button>
                {openFaq === i && (
                  <div style={{
                    padding: '0 22px 20px',
                    fontSize: '14px', color: 'var(--ink2)', lineHeight: 1.7,
                    borderTop: '1px solid var(--border)',
                    paddingTop: '16px',
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────────── */}
        <section style={{
          marginTop: '80px', marginBottom: '64px',
          background: 'linear-gradient(135deg, #0E2A47 0%, #163857 50%, #0d3048 100%)',
          borderRadius: '24px', padding: '72px 52px', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,150,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(165,8,107,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌟</div>
            <h2 style={{
              fontWeight: 900, fontSize: 'clamp(28px, 4vw, 44px)',
              color: '#ffffff', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.1,
            }}>
              Tu próximo paso es construir.
            </h2>
            <p style={{
              fontSize: '17px', color: 'rgba(255,255,255,0.6)',
              margin: '0 auto 40px', lineHeight: 1.65, maxWidth: '460px',
            }}>
              Los cupos son limitados. La próxima cohorte empieza en mayo.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/apply" className="btn-green" style={{
                background: 'var(--green)', color: '#ffffff',
                fontWeight: 800, fontSize: '17px', textDecoration: 'none',
                padding: '16px 36px', borderRadius: 'var(--radius-btn)',
                display: 'inline-block',
                boxShadow: '0 6px 28px rgba(0,200,150,0.4)',
              }}>
                Aplicar ahora →
              </Link>
              <Link href="/scholarship" className="btn-ghost" style={{
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)',
                fontWeight: 600, fontSize: '15px', textDecoration: 'none',
                padding: '16px 28px', borderRadius: 'var(--radius-btn)',
                border: '1px solid rgba(255,255,255,0.15)', display: 'inline-block',
              }}>
                Ver becas disponibles
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '28px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px',
        maxWidth: '1100px', margin: '0 auto',
      }}>
        <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--navy)', letterSpacing: '-0.02em' }}>
          Prospera Young <span style={{ color: 'var(--green)' }}>AI</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/apply" style={{ fontSize: '13px', color: 'var(--ink3)', textDecoration: 'none', fontWeight: 500 }}>Aplicar</Link>
          <Link href="/scholarship" style={{ fontSize: '13px', color: 'var(--ink3)', textDecoration: 'none', fontWeight: 500 }}>Becas</Link>
          <Link href="/login" style={{ fontSize: '13px', color: 'var(--ink3)', textDecoration: 'none', fontWeight: 500 }}>Iniciar sesión</Link>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ink4)' }}>
          © 2025 Prospera Young AI · Todos los derechos reservados
        </div>
      </footer>

    </div>
  )
}
