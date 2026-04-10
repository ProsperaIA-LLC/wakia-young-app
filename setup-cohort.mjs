// node setup-cohort.mjs
// Creates: cohort + 6 weeks + enrolls jessicajanecolmenarespaz@gmail.com

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()] })
)

const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// ── 1. Create cohort ──────────────────────────────────────────────────────────
const startDate = new Date('2026-04-14') // Monday next week
const endDate   = new Date('2026-05-25') // 6 weeks later

const { data: cohort, error: cohortErr } = await service
  .from('cohorts')
  .insert({
    name:         'Wakia Cohorte 1',
    market:       'LATAM',
    status:       'active',
    current_week: 1,
    start_date:   startDate.toISOString().split('T')[0],
    end_date:     endDate.toISOString().split('T')[0],
    max_students: 30,
  })
  .select('*')
  .single()

if (cohortErr) { console.error('Error creando cohorte:', cohortErr.message); process.exit(1) }
console.log(`✅ Cohorte creada: ${cohort.name} (${cohort.id})`)

// ── 2. Create 6 weeks ─────────────────────────────────────────────────────────
const WEEKS = [
  { week_number: 1, phase: 'Despertar', title: 'El problema que te duele',          deliverable_description: 'Describe un problema real que hayas observado en tu comunidad o entorno. ¿Cómo lo resolverías con IA?', success_signal: 'Problema claramente definido con contexto real' },
  { week_number: 2, phase: 'Despertar', title: 'IA como forma de pensar',            deliverable_description: 'Explora cómo la IA puede transformar tu forma de abordar el problema identificado. Documenta tu proceso de pensamiento.', success_signal: 'Conexión clara entre IA y tu problema' },
  { week_number: 3, phase: 'Construir', title: 'Algo real en 5 días',                deliverable_description: 'Construye un prototipo simple usando herramientas de IA. Puede ser un prompt, un flujo o una demo básica.', success_signal: 'Prototipo funcional documentado con capturas' },
  { week_number: 4, phase: 'Construir', title: 'Las 3 preguntas del negocio',        deliverable_description: 'Responde: ¿Quién paga? ¿Cuánto paga? ¿Por qué ahora? Valida tu propuesta con al menos 3 personas reales.', success_signal: '3 entrevistas documentadas con insights clave' },
  { week_number: 5, phase: 'Construir', title: 'Agentes que trabajan mientras duermes', deliverable_description: 'Implementa un agente o automatización que resuelva una parte de tu problema sin intervención manual.', success_signal: 'Agente documentado con evidencia de funcionamiento' },
  { week_number: 6, phase: 'Lanzar',   title: 'Demo Day: tu primer hito público',   deliverable_description: 'Prepara una presentación de 3 minutos de tu proyecto. Graba un video demo y comparte el link.', success_signal: 'Video demo publicado y presentación completada' },
]

for (const w of WEEKS) {
  const weekStart = new Date(startDate)
  weekStart.setDate(weekStart.getDate() + (w.week_number - 1) * 7)
  const dueDate = new Date(weekStart)
  dueDate.setDate(dueDate.getDate() + 6) // Saturday

  const { error: weekErr } = await service.from('weeks').insert({
    cohort_id:               cohort.id,
    week_number:             w.week_number,
    phase:                   w.phase,
    title:                   w.title,
    opening_question:        '¿Qué aprendiste esta semana?',
    deliverable_description: w.deliverable_description,
    success_signal:          w.success_signal,
    reflection_q1:           '¿Qué fue lo más importante que aprendiste?',
    reflection_q2:           '¿Qué harías diferente la próxima semana?',
    unlock_date:             weekStart.toISOString().split('T')[0],
    due_date:                dueDate.toISOString().split('T')[0],
  })
  if (weekErr) { console.error(`Error semana ${w.week_number}:`, weekErr.message); process.exit(1) }
  console.log(`   ✓ Semana ${w.week_number}: ${w.title}`)
}

// ── 3. Enroll Jessica ─────────────────────────────────────────────────────────
const { data: jessica, error: userErr } = await service
  .from('users')
  .select('id, email')
  .eq('email', 'jessicajanecolmenarespaz@gmail.com')
  .single()

if (userErr || !jessica) { console.error('Usuario no encontrado'); process.exit(1) }

const { error: enrollErr } = await service.from('enrollments').insert({
  user_id:       jessica.id,
  cohort_id:     cohort.id,
  market:        'LATAM',
  status:        'active',
  is_scholarship: false,
  price_paid_usd: 0,
})

if (enrollErr) { console.error('Error enrollment:', enrollErr.message); process.exit(1) }
console.log(`\n✅ Jessica enrollada en ${cohort.name}`)
console.log(`\n🚀 Listo! Recarga campus.wakia.app/young/dashboard`)
