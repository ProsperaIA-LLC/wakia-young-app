'use client'

import Link from 'next/link'
import { useState } from 'react'

// ── Data ──────────────────────────────────────────────────────────────────────

const PHASES = [
  {
    num: '01', label: 'DESPERTAR', weeks: 'Semanas 1–2',
    title: 'Encuentras el problema real',
    description: 'Sales a hablar con personas reales. Validas que el problema existe antes de construir nada.',
    result: 'Problema validado + IA como aliada',
    color: '#008ca5',
  },
  {
    num: '02', label: 'CONSTRUIR', weeks: 'Semanas 3–5',
    title: 'Construyes algo que funciona',
    description: 'Haces un prototipo funcional con IA. Un extraño lo puede usar sin que tú lo expliques.',
    result: 'MVP funcional + Modelo de negocio',
    color: '#00c896',
  },
  {
    num: '03', label: 'LANZAR', weeks: 'Semana 6',
    title: 'Demo Day en público',
    description: 'Muestras tu producto, tu modelo de negocio y tu pitch ante mentores y la comunidad.',
    result: 'Producto lanzado + Certificación FGU',
    color: '#e0a326',
  },
]

const WEEKS = [
  { num: 1, phase: 'Despertar', title: 'El problema que te duele', color: '#008ca5', icon: '🔍' },
  { num: 2, phase: 'Despertar', title: 'IA como forma de pensar', color: '#008ca5', icon: '🧠' },
  { num: 3, phase: 'Construir', title: 'Algo real en 5 días', color: '#00c896', icon: '⚡' },
  { num: 4, phase: 'Construir', title: 'Las 3 preguntas del negocio', color: '#00c896', icon: '💼' },
  { num: 5, phase: 'Construir', title: 'Agentes que trabajan mientras duermes', color: '#00c896', icon: '🤖' },
  { num: 6, phase: 'Lanzar',   title: 'Demo Day: tu primer hito público', color: '#e0a326', icon: '🚀' },
]

const INCLUDED = [
  { icon: '🤖', title: 'Luna, tu tutora de IA', desc: 'Disponible 24/7. Te guía sin hacerte el trabajo. Sabe en qué semana estás y qué tienes que entregar.', color: '#a5086b', border: 'rgba(165,8,107,0.25)' },
  { icon: '👥', title: 'Pod de 4–5 estudiantes', desc: 'Tu grupo de accountability. De toda LATAM, misma zona horaria. Se sostienen entre sí.', color: '#008ca5', border: 'rgba(0,140,165,0.25)' },
  { icon: '🎯', title: 'Mentoría semanal', desc: 'Mentores que revisan tu trabajo y te dan feedback real. No teoria — revisión de tu proyecto.', color: '#00c896', border: 'rgba(0,200,150,0.25)' },
  { icon: '🏆', title: 'Certificación FGU', desc: 'Certificado internacional avalado por la Fundación Gestión y Urbanismo al completar el programa.', color: '#e0a326', border: 'rgba(224,163,38,0.25)' },
  { icon: '💡', title: '1 proyecto tuyo, real', desc: 'No un ejercicio. Un producto que resuelve un problema que tú elegiste, publicado y funcionando.', color: '#ff5c35', border: 'rgba(255,92,53,0.25)' },
  { icon: '♾️', title: 'Comunidad vitalicia', desc: 'Acceso permanente a la red de builders latinos de Prospera Young. Tu comunidad de por vida.', color: '#7c3aed', border: 'rgba(124,58,237,0.25)' },
]

const METRICS = [
  { value: '85%', label: 'tasa de finalización', sub: 'vs 30% promedio en cursos online', color: '#00c896' },
  { value: '8+',  label: 'MVPs lanzados por cohorte', sub: 'productos reales y publicados', color: '#008ca5' },
  { value: '100%', label: 'en español', sub: 'comunidad bilingüe LATAM + USA', color: '#e0a326' },
  { value: 'FGU', label: 'certificación internacional', sub: 'avalada por fundación reconocida', color: '#a5086b' },
]

const FAQS = [
  { q: '¿Necesito saber programar?', a: 'No. Usas herramientas de IA como Claude Code, Glide y n8n que no requieren código. Si ya sabes programar, vas a ir más rápido — pero no es requisito.' },
  { q: '¿En qué idioma es el programa?', a: 'Todo en español. Si estás en USA, puedes participar igualmente — la comunidad es bilingüe.' },
  { q: '¿Qué horario requiere?', a: 'Calcula unas 8–10 horas por semana. La sesión en vivo es los sábados (1 hora). El resto es trabajo asincrónico a tu ritmo.' },
  { q: '¿Qué pasa si me atraso?', a: 'Tu buddy y tu Pod te sostienen. Los mentores reciben alerta si no entras en 48hs. No estás solo/a.' },
  { q: '¿Puedo acceder a una beca?', a: 'Sí. Tenemos becas parciales y completas para estudiantes que lo necesiten. El proceso es rápido.' },
  { q: '¿Qué obtengo al terminar?', a: 'Un producto publicado, tu pitch grabado, el certificado FGU y una red de builders latinos. Eso es tu portafolio.' },
]

const PRICE_FEATURES = [
  'Acceso completo a las 6 semanas',
  'Pod de 4–5 estudiantes',
  'Luna, tutora de IA 24/7',
  'Mentoría semanal con expertos',
  'Certificación FGU',
  'Comunidad vitalicia',
]

// ── Main component ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ background: '#0a1628', color: '#f5f0e8', fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif", overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .display { font-family: 'Playfair Display', Georgia, serif; }
        .sans    { font-family: 'DM Sans', system-ui, sans-serif; }

        /* Dot grid overlay */
        .dot-grid {
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        /* Hover lift */
        .lift { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
        .lift:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.25); }

        /* Buttons */
        .btn-primary { transition: background 0.15s, transform 0.15s, box-shadow 0.15s; }
        .btn-primary:hover { background: #00a87a !important; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0,200,150,0.4) !important; }
        .btn-ghost { transition: background 0.15s, border-color 0.15s; }
        .btn-ghost:hover { background: rgba(255,255,255,0.12) !important; }

        /* FAQ */
        .faq-item { transition: border-color 0.2s; }
        .faq-btn:hover { background: rgba(255,255,255,0.03) !important; }

        /* Week rows */
        .week-row { transition: all 0.15s; }
        .week-row:hover { background: rgba(0,200,150,0.06) !important; border-color: rgba(0,200,150,0.3) !important; }

        /* Luna orb animations */
        @keyframes float    { 0%,100% { transform: translateY(0);   } 50% { transform: translateY(-12px); } }
        @keyframes blink    { 0%,90%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes spin-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes spin-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes glow-pulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @keyframes slide-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }

        .luna-float  { animation: float 4s ease-in-out infinite; }
        .luna-ring-1 { animation: spin-cw  8s linear infinite; }
        .luna-ring-2 { animation: spin-ccw 6s linear infinite; }
        .luna-eye    { animation: blink 4s ease-in-out infinite; }
        .pulse       { animation: pulse-dot 2s ease-in-out infinite; }

        .section-fade { animation: slide-up 0.5s ease both; }

        /* Nav links */
        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: #00c896 !important; }
      `}</style>

      {/* ── Navigation ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(10,22,40,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          {/* Logo */}
          <div className="display" style={{ fontWeight: 900, fontSize: 20, color: '#ffffff', letterSpacing: '-0.02em', flexShrink: 0 }}>
            Prospera Young <span style={{ color: '#00c896' }}>AI</span>
          </div>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}>
            {[['#programa','El programa'],['#fases','Fases'],['#luna','Luna IA'],['#precio','Precio']].map(([href, label]) => (
              <a key={href} href={href} className="nav-link sans" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link href="/login" className="nav-link sans" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '9px 14px', borderRadius: 8 }}>
              Entrar
            </Link>
            <Link href="/apply" className="btn-primary sans" style={{ background: '#00c896', color: '#0a1628', fontWeight: 800, fontSize: 14, textDecoration: 'none', padding: '9px 20px', borderRadius: 10, display: 'inline-block', boxShadow: '0 4px 16px rgba(0,200,150,0.3)' }}>
              Aplicar →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section className="dot-grid" style={{ paddingTop: 128, paddingBottom: 96, position: 'relative', overflow: 'hidden' }}>
        {/* Gradient glows */}
        <div style={{ position: 'absolute', top: -100, right: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,150,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: '5%',  width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(165,8,107,0.10) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '45%',  width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,140,165,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* Left */}
          <div>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,92,53,0.15)', border: '1px solid rgba(255,92,53,0.3)', borderRadius: 20, padding: '7px 16px', marginBottom: 28 }}>
              <span className="pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5c35', display: 'inline-block', flexShrink: 0 }} />
              <span className="sans" style={{ fontSize: 12, fontWeight: 700, color: '#ff5c35', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Cohorte 1 · Inscripciones abiertas
              </span>
            </div>

            <h1 className="display" style={{ fontWeight: 900, fontSize: 'clamp(38px, 4.5vw, 60px)', color: '#ffffff', margin: '0 0 10px', lineHeight: 1.06, letterSpacing: '-0.02em' }}>
              Construye tu primer
            </h1>
            <h1 className="display" style={{ fontWeight: 900, fontSize: 'clamp(38px, 4.5vw, 60px)', margin: '0 0 24px', lineHeight: 1.06, letterSpacing: '-0.02em', fontStyle: 'italic', background: 'linear-gradient(90deg, #00c896, #00e8b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              producto con IA.
            </h1>

            <p className="sans" style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', margin: '0 0 12px', lineHeight: 1.65, maxWidth: 500 }}>
              El programa intensivo para jóvenes latinos de{' '}
              <strong style={{ color: '#ffffff' }}>14 a 18 años</strong> que aprenden haciendo.
            </p>
            <p className="sans" style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', margin: '0 0 40px', lineHeight: 1.65, maxWidth: 500 }}>
              Sales con un proyecto real, validado y publicado. <strong style={{ color: '#00c896' }}>En 6 semanas.</strong>
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 36 }}>
              <Link href="/apply" className="btn-primary sans" style={{ background: '#00c896', color: '#0a1628', fontWeight: 800, fontSize: 16, textDecoration: 'none', padding: '15px 32px', borderRadius: 12, display: 'inline-block', boxShadow: '0 6px 24px rgba(0,200,150,0.35)' }}>
                Aplicar ahora →
              </Link>
              <Link href="/scholarship" className="btn-ghost sans" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 15, textDecoration: 'none', padding: '15px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', display: 'inline-block' }}>
                Ver becas
              </Link>
            </div>

            {/* Trust strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex' }}>
                {['H','J','A','M'].map((letter, i) => (
                  <div key={letter} style={{ width: 32, height: 32, borderRadius: '50%', background: ['#00c896','#a5086b','#008ca5','#e0a326'][i], color: '#fff', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0a1628', marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i, position: 'relative' }}>
                    {letter}
                  </div>
                ))}
              </div>
              <span className="sans" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                Diseñado por fundadoras latinas · Oklahoma, USA · Certificación FGU
              </span>
            </div>
          </div>

          {/* Right: platform preview card */}
          <div style={{ position: 'relative' }}>
            {/* Outer glow */}
            <div style={{ position: 'absolute', inset: -24, background: 'radial-gradient(circle at 50% 50%, rgba(0,200,150,0.08) 0%, transparent 70%)', borderRadius: 32, pointerEvents: 'none' }} />
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, overflow: 'hidden', backdropFilter: 'blur(12px)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
            }}>
              {/* Window chrome */}
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                ))}
                <span className="sans" style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>prospera-young-ai-platform.vercel.app</span>
              </div>
              {/* Mock dashboard */}
              <div style={{ padding: 20 }}>
                <div className="sans" style={{ fontSize: 11, color: '#00c896', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Semana 3 de 6 · Construir</div>
                <div className="display" style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>Hola, Valentina 👋</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'Racha actual', value: '14 días', color: '#e0a326' },
                    { label: 'Entregables', value: '2/6', color: '#00c896' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="sans" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{s.label}</div>
                      <div className="sans" style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {/* Chat bubble */}
                <div style={{ background: 'rgba(165,8,107,0.12)', border: '1px solid rgba(165,8,107,0.25)', borderRadius: 12, padding: '10px 14px' }}>
                  <div className="sans" style={{ fontSize: 11, color: '#d94da0', fontWeight: 700, marginBottom: 4 }}>Luna ·</div>
                  <div className="sans" style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>"¿Ya hablaste con alguien que tenga ese problema?"</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────────── */}
      <section style={{ background: '#f5f0e8', color: '#0a1628', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
          {[
            { value: '6',    label: 'semanas',              sub: 'de programa intensivo',      color: '#00c896', border: '4px solid #00c896' },
            { value: '4–5',  label: 'estudiantes en tu pod', sub: 'misma zona horaria',        color: '#008ca5', border: '4px solid #008ca5' },
            { value: '85%',  label: 'tasa de finalización',  sub: 'vs 30% promedio online',   color: '#a5086b', border: '4px solid #a5086b' },
            { value: '100%', label: 'en español',            sub: 'comunidad bilingüe',        color: '#e0a326', border: '4px solid #e0a326' },
          ].map((stat, i) => (
            <div key={stat.label} style={{ padding: '28px 24px', textAlign: 'center', borderTop: stat.border, borderRight: i < 3 ? '1px solid rgba(10,22,40,0.08)' : 'none' }}>
              <div className="display" style={{ fontWeight: 900, fontSize: 42, color: stat.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{stat.value}</div>
              <div className="sans" style={{ fontWeight: 700, fontSize: 14, color: '#0a1628', marginTop: 6 }}>{stat.label}</div>
              <div className="sans" style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Phases ─────────────────────────────────────────────────────────────── */}
      <section id="fases" className="dot-grid" style={{ padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '30%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,150,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="sans" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#00c896', marginBottom: 14 }}>Estructura del programa</div>
            <h2 className="display" style={{ fontWeight: 900, fontSize: 'clamp(28px,3.5vw,46px)', color: '#ffffff', margin: '0 0 14px', lineHeight: 1.1 }}>
              De la idea al producto real en{' '}
              <em>6 semanas</em>
            </h2>
            <p className="sans" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
              No aprendes sobre IA. Aprendes <em>con</em> IA, construyendo algo que importa.
            </p>
          </div>

          {/* Phase cards with gradient line */}
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {/* Connecting gradient line */}
            <div style={{ position: 'absolute', top: 52, left: '17%', right: '17%', height: 2, background: 'linear-gradient(90deg, #008ca5, #00c896, #e0a326)', opacity: 0.35, zIndex: 0, borderRadius: 2 }} />

            {PHASES.map((phase) => (
              <div key={phase.label} className="lift" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${phase.color}30`, borderRadius: 20, padding: 32, position: 'relative', zIndex: 1 }}>
                {/* Number circle */}
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${phase.color}20`, border: `2px solid ${phase.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <span className="display" style={{ fontWeight: 900, fontSize: 20, color: phase.color }}>{phase.num}</span>
                </div>

                <div className="sans" style={{ display: 'inline-block', background: `${phase.color}18`, color: phase.color, fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20, marginBottom: 14 }}>
                  {phase.label} · {phase.weeks}
                </div>

                <h3 className="display" style={{ fontWeight: 700, fontSize: 22, color: '#ffffff', margin: '0 0 12px', lineHeight: 1.2 }}>
                  {phase.title}
                </h3>

                <p className="sans" style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: '0 0 20px', lineHeight: 1.65 }}>
                  {phase.description}
                </p>

                {/* Result badge */}
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px', borderLeft: `3px solid ${phase.color}` }}>
                  <div className="sans" style={{ fontSize: 12, color: phase.color, fontWeight: 700, marginBottom: 2 }}>Resultado</div>
                  <div className="sans" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{phase.result}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Curriculum ─────────────────────────────────────────────────────────── */}
      <section id="programa" style={{ background: '#f5f0e8', color: '#0a1628', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="sans" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#008ca5', marginBottom: 14 }}>Semana a semana</div>
            <h2 className="display" style={{ fontWeight: 900, fontSize: 'clamp(26px,3vw,40px)', margin: '0 0 12px', color: '#0a1628', lineHeight: 1.1 }}>
              Lo que construyes cada semana
            </h2>
          </div>

          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 27, top: 20, bottom: 20, width: 2, background: 'linear-gradient(to bottom, #008ca5, #008ca5, #00c896, #00c896, #00c896, #e0a326)', borderRadius: 2, zIndex: 0 }} />
            {WEEKS.map(week => (
              <div key={week.num} className="week-row" style={{ background: '#ffffff', borderRadius: 14, padding: '16px 20px 16px 70px', border: '1.5px solid rgba(10,22,40,0.1)', display: 'flex', alignItems: 'center', gap: 20, position: 'relative', flexWrap: 'wrap' }}>
                <div style={{ position: 'absolute', left: 8, width: 40, height: 40, borderRadius: '50%', background: week.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, boxShadow: `0 0 0 4px #f5f0e8, 0 0 0 5px ${week.color}40`, zIndex: 1 }}>
                  {week.num}
                </div>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{week.icon}</span>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="sans" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: week.color, marginBottom: 3 }}>{week.phase}</div>
                  <div className="sans" style={{ fontWeight: 700, fontSize: 15, color: '#0a1628' }}>{week.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Luna AI ────────────────────────────────────────────────────────────── */}
      <section id="luna" className="dot-grid" style={{ padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(165,8,107,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          {/* Luna orb */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
            <div className="luna-float" style={{ position: 'relative', width: 220, height: 220 }}>
              {/* Outer ring */}
              <div className="luna-ring-1" style={{ position: 'absolute', inset: -28, borderRadius: '50%', border: '2px dashed rgba(165,8,107,0.25)', pointerEvents: 'none' }} />
              {/* Inner ring */}
              <div className="luna-ring-2" style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '1.5px dashed rgba(0,200,150,0.2)', pointerEvents: 'none' }} />
              {/* Main orb */}
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #a5086b 0%, #d10d8a 50%, #7c0050 100%)', boxShadow: '0 0 60px rgba(165,8,107,0.45), 0 0 120px rgba(165,8,107,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
                {/* Eyes */}
                <div style={{ display: 'flex', gap: 22 }}>
                  {[0,1].map(i => (
                    <div key={i} className="luna-eye" style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffffff', boxShadow: '0 0 8px rgba(255,255,255,0.6)' }} />
                  ))}
                </div>
                {/* Mouth */}
                <div style={{ width: 36, height: 18, border: '2.5px solid #ffffff', borderTop: 'none', borderRadius: '0 0 36px 36px', opacity: 0.9 }} />
              </div>
              {/* Label */}
              <div className="sans" style={{ position: 'absolute', bottom: -36, left: '50%', transform: 'translateX(-50%)', fontWeight: 800, fontSize: 14, color: '#d94da0', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                Luna ✦
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <div className="sans" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#d94da0', marginBottom: 16 }}>Tutora de IA · disponible 24/7</div>
            <h2 className="display" style={{ fontWeight: 900, fontSize: 'clamp(26px,3vw,40px)', color: '#ffffff', margin: '0 0 18px', lineHeight: 1.1 }}>
              Luna: la tutora que <em>multiplica tu potencial</em>
            </h2>
            <p className="sans" style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px', lineHeight: 1.7, maxWidth: 440 }}>
              Luna sabe en qué semana estás, qué tienes que entregar y cómo va tu proyecto. No te da las respuestas — te hace las preguntas correctas para que tú llegues.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
              {[
                { icon: '⚡', title: 'Feedback inmediato', desc: 'No esperas una semana para saber si vas bien. Luna te responde en segundos.' },
                { icon: '🧭', title: 'Método socrático', desc: 'Te guía con preguntas, no con respuestas. Construyes tu propio criterio.' },
                { icon: '🌍', title: 'En español, siempre', desc: 'Entiende el contexto latinoamericano y americano de cada estudiante.' },
              ].map(f => (
                <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(165,8,107,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <div className="sans" style={{ fontWeight: 700, fontSize: 14, color: '#ffffff', marginBottom: 3 }}>{f.title}</div>
                    <div className="sans" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sample chat bubble */}
            <div style={{ background: 'rgba(165,8,107,0.12)', border: '1px solid rgba(165,8,107,0.25)', borderRadius: 14, padding: '14px 18px', maxWidth: 400 }}>
              <div className="sans" style={{ fontSize: 11, color: '#d94da0', fontWeight: 700, marginBottom: 6 }}>Luna dice:</div>
              <div className="sans" style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, fontStyle: 'italic' }}>
                "¿Ya hablaste con alguien que tenga ese problema? ¿Qué te dijo exactamente?"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's included ────────────────────────────────────────────────────── */}
      <section style={{ background: '#f5f0e8', color: '#0a1628', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="sans" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#008ca5', marginBottom: 14 }}>Todo incluido</div>
            <h2 className="display" style={{ fontWeight: 900, fontSize: 'clamp(26px,3vw,40px)', margin: '0 0 12px', color: '#0a1628', lineHeight: 1.1 }}>
              Lo que recibes en el programa
            </h2>
            <p className="sans" style={{ color: '#6b7280', fontSize: 15, margin: 0, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
              No hay extras ni sorpresas. Todo lo que necesitas para construir está incluido.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {INCLUDED.map(item => (
              <div key={item.title} className="lift" style={{ background: '#ffffff', borderRadius: 18, padding: '24px 22px', border: `1.5px solid ${item.border}`, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${item.color}12`, border: `1.5px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div className="sans" style={{ fontWeight: 800, fontSize: 15, color: '#0a1628', marginBottom: 6 }}>{item.title}</div>
                  <div className="sans" style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics ────────────────────────────────────────────────────────────── */}
      <section className="dot-grid" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
            {METRICS.map(m => (
              <div key={m.label} className="lift" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '32px 24px', textAlign: 'center' }}>
                <div className="display" style={{ fontWeight: 900, fontSize: 52, color: m.color, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 10 }}>{m.value}</div>
                <div className="sans" style={{ fontWeight: 700, fontSize: 15, color: '#ffffff', marginBottom: 6 }}>{m.label}</div>
                <div className="sans" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For you if ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#f5f0e8', color: '#0a1628', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="sans" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#008ca5', marginBottom: 14 }}>¿Es para mí?</div>
            <h2 className="display" style={{ fontWeight: 900, fontSize: 'clamp(26px,3vw,40px)', margin: 0, color: '#0a1628', lineHeight: 1.1 }}>Para ti si...</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10, maxWidth: 900, margin: '0 auto' }}>
            {[
              { check: true,  text: 'Tienes entre 14 y 18 años' },
              { check: true,  text: 'Vives en LATAM o en USA' },
              { check: true,  text: 'Quieres construir algo real, no solo aprender teoría' },
              { check: true,  text: 'No sabes programar (o sí sabes, da igual)' },
              { check: true,  text: 'Puedes dedicar 8–10 horas por semana' },
              { check: false, text: 'Buscas un curso de videos sin compromiso ni comunidad' },
            ].map((item, i) => (
              <div key={i} style={{ background: item.check ? '#ffffff' : 'transparent', borderRadius: 14, padding: '16px 20px', border: `1.5px solid ${item.check ? 'rgba(10,22,40,0.12)' : 'rgba(10,22,40,0.06)'}`, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: item.check ? '#00c896' : '#ffede8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: item.check ? '#ffffff' : '#ff5c35' }}>
                  {item.check ? '✓' : '✕'}
                </div>
                <span className="sans" style={{ fontSize: 14, fontWeight: item.check ? 600 : 400, color: item.check ? '#0a1628' : '#9ca3af' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────────── */}
      <section id="precio" className="dot-grid" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="sans" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#00c896', marginBottom: 14 }}>Inversión</div>
            <h2 className="display" style={{ fontWeight: 900, fontSize: 'clamp(26px,3vw,40px)', color: '#ffffff', margin: '0 0 12px', lineHeight: 1.1 }}>Precios por mercado</h2>
            <p className="sans" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, margin: 0 }}>El early bird cierra cuando se llenan los cupos. No hay lista de espera.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, maxWidth: 800, margin: '0 auto' }}>
            {/* LATAM */}
            <div className="lift" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 36 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🌎</div>
              <div className="display" style={{ fontWeight: 700, fontSize: 22, color: '#ffffff', marginBottom: 4 }}>Latinoamérica</div>
              <div className="sans" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>MX · CO · AR · PE · CL y más</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span className="display" style={{ fontWeight: 900, fontSize: 52, color: '#00c896', letterSpacing: '-0.03em' }}>$197</span>
                <span className="sans" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>USD</span>
              </div>
              <div className="sans" style={{ display: 'inline-block', background: 'rgba(0,200,150,0.15)', color: '#00c896', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 24 }}>Early bird — ahorra $100</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {PRICE_FEATURES.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: '#00c896', fontWeight: 700, fontSize: 14 }}>✓</span>
                    <span className="sans" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/apply?market=LATAM" className="btn-primary sans" style={{ display: 'block', textAlign: 'center', background: '#00c896', color: '#0a1628', fontWeight: 800, textDecoration: 'none', padding: '14px', borderRadius: 12, fontSize: 15, boxShadow: '0 4px 20px rgba(0,200,150,0.3)' }}>
                Aplicar — LATAM →
              </Link>
            </div>

            {/* USA */}
            <div className="lift" style={{ background: 'rgba(255,255,255,0.04)', border: '2px solid #00c896', borderRadius: 20, padding: 36, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 18, right: 18, background: '#00c896', color: '#0a1628', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Early bird</div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🇺🇸</div>
              <div className="display" style={{ fontWeight: 700, fontSize: 22, color: '#ffffff', marginBottom: 4 }}>Estados Unidos</div>
              <div className="sans" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Para estudiantes en USA</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span className="display" style={{ fontWeight: 900, fontSize: 52, color: '#00c896', letterSpacing: '-0.03em' }}>$497</span>
                <span className="sans" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>USD</span>
              </div>
              <div className="sans" style={{ display: 'inline-block', background: 'rgba(0,200,150,0.15)', color: '#00c896', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 24 }}>Ahorra $300 vs. precio regular</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {PRICE_FEATURES.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: '#00c896', fontWeight: 700, fontSize: 14 }}>✓</span>
                    <span className="sans" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/apply?market=USA" className="btn-primary sans" style={{ display: 'block', textAlign: 'center', background: '#00c896', color: '#0a1628', fontWeight: 800, textDecoration: 'none', padding: '14px', borderRadius: 12, fontSize: 15, boxShadow: '0 6px 24px rgba(0,200,150,0.35)' }}>
                Aplicar — USA →
              </Link>
            </div>
          </div>

          {/* Scholarship */}
          <div style={{ maxWidth: 800, margin: '20px auto 0', background: 'rgba(224,163,38,0.1)', border: '1px solid rgba(224,163,38,0.3)', borderRadius: 16, padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 32 }}>🎓</span>
            <div style={{ flex: 1 }}>
              <div className="sans" style={{ fontWeight: 800, fontSize: 15, color: '#ffffff', marginBottom: 3 }}>¿No puedes pagar? Hay becas disponibles.</div>
              <div className="sans" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Tenemos becas parciales y completas. Si el dinero es el único obstáculo, aplica igual.</div>
            </div>
            <Link href="/scholarship" className="sans" style={{ background: '#e0a326', color: '#0a1628', fontWeight: 800, fontSize: 14, textDecoration: 'none', padding: '11px 22px', borderRadius: 10, whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(224,163,38,0.3)' }}>
              Ver becas →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────────── */}
      <section style={{ background: '#f5f0e8', color: '#0a1628', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="sans" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#008ca5', marginBottom: 14 }}>Preguntas frecuentes</div>
            <h2 className="display" style={{ fontWeight: 900, fontSize: 'clamp(26px,3vw,40px)', margin: 0, color: '#0a1628', lineHeight: 1.1 }}>Lo que más nos preguntan</h2>
          </div>

          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item" style={{ background: '#ffffff', borderRadius: 14, border: `1.5px solid ${openFaq === i ? '#008ca5' : 'rgba(10,22,40,0.1)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '20px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <span className="sans" style={{ fontWeight: 700, fontSize: 15, color: '#0a1628' }}>{faq.q}</span>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: openFaq === i ? '#008ca5' : 'rgba(10,22,40,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: openFaq === i ? '#ffffff' : '#6b7280', fontSize: 18, fontWeight: 300, transition: 'all 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>
                    +
                  </div>
                </button>
                {openFaq === i && (
                  <div className="sans" style={{ padding: '0 22px 20px', paddingTop: 16, fontSize: 14, color: '#4b5563', lineHeight: 1.7, borderTop: '1px solid rgba(10,22,40,0.08)' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────────── */}
      <section className="dot-grid" style={{ padding: '112px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,150,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(165,8,107,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🌟</div>
          <h2 className="display" style={{ fontWeight: 900, fontSize: 'clamp(30px,4vw,52px)', color: '#ffffff', margin: '0 0 16px', lineHeight: 1.06, letterSpacing: '-0.02em' }}>
            Tu próximo paso es<br /><em style={{ color: '#00c896' }}>construir.</em>
          </h2>
          <p className="sans" style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', margin: '0 auto 44px', lineHeight: 1.65, maxWidth: 420 }}>
            Los cupos son limitados. La Cohorte 1 empieza en mayo. No hay lista de espera.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/apply" className="btn-primary sans" style={{ background: '#00c896', color: '#0a1628', fontWeight: 800, fontSize: 17, textDecoration: 'none', padding: '17px 40px', borderRadius: 12, display: 'inline-block', boxShadow: '0 8px 32px rgba(0,200,150,0.4)' }}>
              Aplicar ahora →
            </Link>
            <Link href="/scholarship" className="btn-ghost sans" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 15, textDecoration: 'none', padding: '17px 28px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', display: 'inline-block' }}>
              Ver becas disponibles
            </Link>
          </div>
          <div className="sans" style={{ marginTop: 28, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            ¿Preguntas? Escribinos a{' '}
            <a href="mailto:hola@prosperayoung.ai" style={{ color: '#00c896', textDecoration: 'none', fontWeight: 600 }}>hola@prosperayoung.ai</a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 24px', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div className="display" style={{ fontWeight: 900, fontSize: 18, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Prospera Young <span style={{ color: '#00c896' }}>AI</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[['#programa','El programa'],['#fases','Fases'],['#luna','Luna IA'],['#precio','Precio'],['/scholarship','Becas'],['/login','Iniciar sesión']].map(([href, label]) => (
              <a key={href} href={href} className="nav-link sans" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 500 }}>{label}</a>
            ))}
          </div>
          <div className="sans" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            © 2026 Prospera Young AI · Todos los derechos reservados
          </div>
        </div>
      </footer>

    </div>
  )
}
