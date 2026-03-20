// ============================================================
// /lib/anthropic/prospero.ts
// Próspero AI Tutor — Complete chat logic for Prospera Young AI
//
// Usage:
//   import { buildProsperoMessages, PROSPERO_SYSTEM_PROMPT } from '@/lib/anthropic/prospero'
//   import { checkDailyLimit, saveChatMessage, getChatHistory } from '@/lib/anthropic/prospero'
//
// The API route at /app/api/chat/route.ts calls these functions.
// NEVER import this file on the client — it uses ANTHROPIC_API_KEY.
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type {
  ChatMessage,
  User,
  Week,
  Pod,
  PodMember,
  Deliverable,
  ChatRequest,
  ChatResponse,
} from '@/types'

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const MAX_DAILY_MESSAGES = 15          // hard limit per student per day
const MAX_HISTORY_MESSAGES = 20        // how many past messages to send as context
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1000

// ── ANTHROPIC CLIENT (singleton) ─────────────────────────────────────────────

let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables')
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicClient
}

// ── TYPES ────────────────────────────────────────────────────────────────────

export interface ProsperoContext {
  student: Pick<User, 'id' | 'full_name' | 'nickname' | 'country' | 'age'>
  currentWeek: Pick<Week,
    | 'week_number'
    | 'phase'
    | 'title'
    | 'opening_question'
    | 'deliverable_description'
    | 'success_signal'
    | 'tools'
  >
  currentDeliverable: Pick<Deliverable, 'status' | 'content'> | null
  pod: Pick<Pod, 'name'> | null
  buddy: Pick<User, 'full_name' | 'nickname' | 'country'> | null
  cohortId: string
  weekId: string
  market: 'LATAM' | 'USA'
}

export interface DailyLimitResult {
  count: number
  limitReached: boolean
  remaining: number
}

export interface ChatResult {
  reply: string
  dailyCount: number
  limitReached: boolean
  tokensUsed: number
}

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
// This is built dynamically per request with student context injected.
// The static base is here — context is injected via buildSystemPrompt().

export const PROSPERO_SYSTEM_PROMPT_BASE = `
Sos Próspero, el tutor IA del programa Prospera Young AI.

QUIÉN SOS:
Acompañás a estudiantes latinoamericanos de 14 a 18 años — tanto en Latinoamérica como hijos de latinos en Estados Unidos — durante un programa intensivo de 6 semanas donde construyen productos reales con inteligencia artificial.

TU MÉTODO PEDAGÓGICO:
- Usás el método socrático adaptado: guiás con preguntas, nunca hacés el trabajo por el estudiante
- Cuando alguien te pregunta "¿cómo hago X?", tu primera respuesta es una pregunta que los lleva a pensar: "¿Qué ya probaste? ¿Qué parte específica te trabó?"
- Solo después de que el estudiante piensa, ofrecés pistas concretas
- Siempre conectás la respuesta con el entregable de la semana actual
- Celebrás los avances reales, normalizás los bloqueos como parte del proceso

TU PERSONALIDAD:
- Hablás como alguien de su misma generación: directo, sin tecnicismos innecesarios
- Usás voseo latinoamericano (vos, tenés, podés, hacés, llegaste, construís)
- Sos cálido y genuino — nada de corporativo o robótico
- Usás algún emoji ocasional (máximo 1–2 por mensaje) — no exagerado
- Respuestas cortas: máximo 3–4 oraciones o bullets breves
- Cuando algo es técnico, primero una analogía simple, después el concepto
- Si no sabés algo, lo decís con honestidad: "No tengo certeza de eso — verificalo vos directamente"

TU AUDIENCIA (importante para el tono):
- Latinos en LATAM: entienden el contexto de emprender con recursos limitados, referentes como Rappi, Nubank, Mercado Libre
- Latinos en USA (segunda generación): pueden mezclar español e inglés, tienen contexto bicultural
- Todos: 14–18 años, Gen Z, nativos digitales, aprenden haciendo más que leyendo
- No usés jerga de Silicon Valley — buscá referentes LATAM cuando puedas

REGLAS ESTRICTAS:
1. Máximo 3–4 oraciones por respuesta. Si necesitás más, usá bullets cortos
2. Nunca hacés el trabajo por el estudiante — nunca escribís su entregable, su código completo, ni su pitch
3. Siempre conectás con el entregable de la semana actual
4. Si el estudiante menciona sentirse muy mal emocionalmente, abrumado, o en crisis → decile que hable con el mentor directamente y no sigas el tema vos
5. Si el estudiante pregunta algo médico, legal, o de salud mental → redirigí al mentor o a un adulto de confianza
6. Podés responder en inglés si el estudiante escribe en inglés — pero siempre preferís el español
7. No reproduzcás código completo de soluciones — mostrá fragmentos cortos que ilustren un concepto
`.trim()

// ── BUILD SYSTEM PROMPT WITH CONTEXT ─────────────────────────────────────────

export function buildSystemPrompt(ctx: ProsperoContext): string {
  const studentName = ctx.student.nickname || ctx.student.full_name.split(' ')[0]
  const buddyName = ctx.buddy?.nickname || ctx.buddy?.full_name?.split(' ')[0] || 'sin buddy asignado aún'
  const podName = ctx.pod?.name || 'pod por asignar'
  const tools = ctx.currentWeek.tools?.join(', ') || 'herramientas de la semana'

  const deliverableStatus = ctx.currentDeliverable?.status === 'submitted'
    ? 'Ya entregó el entregable de esta semana ✓'
    : 'Todavía no entregó el entregable de esta semana'

  const marketContext = ctx.market === 'USA'
    ? 'El estudiante está en Estados Unidos (latino o hijo de latinos).'
    : 'El estudiante está en Latinoamérica.'

  return `
${PROSPERO_SYSTEM_PROMPT_BASE}

---

CONTEXTO DEL ESTUDIANTE CON QUIEN HABLÁS AHORA:
- Nombre: ${studentName}
- País: ${ctx.student.country || 'no especificado'}
- Edad: ${ctx.student.age || 'no especificada'}
- ${marketContext}
- Pod: ${podName}
- Buddy (compañero asignado): ${buddyName}${ctx.buddy?.country ? ` (${ctx.buddy.country})` : ''}

SEMANA ACTUAL:
- Semana ${ctx.currentWeek.week_number} de 6 — Fase ${ctx.currentWeek.phase}
- Título: "${ctx.currentWeek.title}"
- Fenómeno de apertura: "${ctx.currentWeek.opening_question}"
- Entregable: ${ctx.currentWeek.deliverable_description}
- Señal de éxito: ${ctx.currentWeek.success_signal}
- Herramientas de esta semana: ${tools}
- Estado: ${deliverableStatus}

FOCO DE TUS RESPUESTAS:
Cada respuesta debe ayudar a ${studentName} a avanzar en su entregable de esta semana.
Si la pregunta no está relacionada con el programa, conectala de vuelta al trabajo de la semana.
`.trim()
}

// ── DAILY LIMIT CHECK ─────────────────────────────────────────────────────────

export async function checkDailyLimit(userId: string): Promise<DailyLimitResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_daily_message_count', { p_user_id: userId })

  if (error) {
    console.error('[Próspero] Error checking daily limit:', error)
    // Fail open — don't block the student if the check fails
    return { count: 0, limitReached: false, remaining: MAX_DAILY_MESSAGES }
  }

  const count = data as number
  return {
    count,
    limitReached: count >= MAX_DAILY_MESSAGES,
    remaining: Math.max(0, MAX_DAILY_MESSAGES - count),
  }
}

// ── GET CHAT HISTORY ──────────────────────────────────────────────────────────

export async function getChatHistory(
  userId: string,
  weekId: string,
  limit = MAX_HISTORY_MESSAGES
): Promise<Anthropic.MessageParam[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error || !data) {
    console.error('[Próspero] Error fetching chat history:', error)
    return []
  }

  return data.map((msg: Pick<ChatMessage, 'role' | 'content'>) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }))
}

// ── SAVE CHAT MESSAGE ─────────────────────────────────────────────────────────

export async function saveChatMessage(
  userId: string,
  cohortId: string,
  weekId: string,
  role: 'user' | 'assistant',
  content: string,
  tokensUsed?: number
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      cohort_id: cohortId,
      week_id: weekId,
      role,
      content,
      tokens_used: tokensUsed ?? null,
    })

  if (error) {
    console.error('[Próspero] Error saving chat message:', error)
    // Don't throw — saving failure shouldn't crash the chat
  }
}

// ── LOG CHAT ACTIVITY ─────────────────────────────────────────────────────────

async function logChatActivity(userId: string, cohortId: string): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('activity_log')
    .insert({
      user_id: userId,
      cohort_id: cohortId,
      action: 'chat_message',
      metadata: { tutor: 'prospero' },
    })
}

// ── BUILD MESSAGE ARRAY ───────────────────────────────────────────────────────

export function buildProsperoMessages(
  history: Anthropic.MessageParam[],
  newMessage: string
): Anthropic.MessageParam[] {
  return [
    ...history,
    { role: 'user', content: newMessage },
  ]
}

// ── MAIN CHAT FUNCTION ────────────────────────────────────────────────────────
// This is the function called from /app/api/chat/route.ts

export async function chat(
  userId: string,
  request: ChatRequest,
  context: ProsperoContext
): Promise<ChatResult> {

  // 1. Check daily limit
  const limitCheck = await checkDailyLimit(userId)

  if (limitCheck.limitReached) {
    return {
      reply: `Ya llegaste al límite de mensajes por hoy (${MAX_DAILY_MESSAGES}) 😄 Próspero necesita descansar también. Volvé mañana con energía renovada — mientras tanto, ¿qué podés avanzar sola/solo en tu entregable?`,
      dailyCount: limitCheck.count,
      limitReached: true,
      tokensUsed: 0,
    }
  }

  // 2. Get chat history for context
  const history = await getChatHistory(userId, request.weekId)

  // 3. Build messages array
  const messages = buildProsperoMessages(history, request.message)

  // 4. Build dynamic system prompt with student context
  const systemPrompt = buildSystemPrompt(context)

  // 5. Call Anthropic API
  const client = getAnthropicClient()

  let reply: string
  let tokensUsed = 0

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
    })

    const textBlock = response.content.find(block => block.type === 'text')
    reply = textBlock?.type === 'text' ? textBlock.text : 'No pude generar una respuesta. ¿Podés intentarlo de nuevo?'
    tokensUsed = response.usage?.output_tokens ?? 0

  } catch (error) {
    console.error('[Próspero] Anthropic API error:', error)

    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        reply = 'Hay mucho tráfico en este momento. Esperá un minuto y volvé a intentarlo.'
      } else if (error.status === 503) {
        reply = 'El servicio está temporalmente no disponible. Intentá en unos minutos.'
      } else {
        reply = 'Hubo un problema de conexión. ¿Podés intentarlo de nuevo?'
      }
    } else {
      reply = 'Hubo un error inesperado. ¿Podés intentarlo de nuevo?'
    }

    // Still save the user message even if AI failed
    await saveChatMessage(userId, request.cohortId, request.weekId, 'user', request.message)
    await logChatActivity(userId, request.cohortId)

    return {
      reply,
      dailyCount: limitCheck.count + 1,
      limitReached: false,
      tokensUsed: 0,
    }
  }

  // 6. Save both messages to database
  await Promise.all([
    saveChatMessage(userId, request.cohortId, request.weekId, 'user', request.message),
    saveChatMessage(userId, request.cohortId, request.weekId, 'assistant', reply, tokensUsed),
    logChatActivity(userId, request.cohortId),
  ])

  // 7. Get updated count
  const updatedLimit = await checkDailyLimit(userId)

  return {
    reply,
    dailyCount: updatedLimit.count,
    limitReached: updatedLimit.limitReached,
    tokensUsed,
  }
}

// ── LOAD CONTEXT FROM DATABASE ────────────────────────────────────────────────
// Helper used in the API route to build ProsperoContext from DB data

export async function loadProsperoContext(
  userId: string,
  cohortId: string,
  weekId: string
): Promise<ProsperoContext | null> {
  const supabase = await createClient()

  // Parallel queries for performance
  const [studentRes, weekRes, deliverableRes, podMemberRes, enrollmentRes] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, nickname, country, age')
      .eq('id', userId)
      .single(),

    supabase
      .from('weeks')
      .select('week_number, phase, title, opening_question, deliverable_description, success_signal, tools')
      .eq('id', weekId)
      .single(),

    supabase
      .from('deliverables')
      .select('status, content')
      .eq('user_id', userId)
      .eq('week_id', weekId)
      .maybeSingle(),

    supabase
      .from('pod_members')
      .select('buddy_id, pod_id, pods(name)')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
      .maybeSingle(),

    supabase
      .from('enrollments')
      .select('market')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
      .single(),
  ])

  if (studentRes.error || weekRes.error || enrollmentRes.error) {
    console.error('[Próspero] Error loading context:', {
      student: studentRes.error,
      week: weekRes.error,
      enrollment: enrollmentRes.error,
    })
    return null
  }

  // Load buddy info if exists
  let buddy: ProsperoContext['buddy'] = null
  const buddyId = podMemberRes.data?.buddy_id

  if (buddyId) {
    const { data: buddyData } = await supabase
      .from('users')
      .select('full_name, nickname, country')
      .eq('id', buddyId)
      .single()
    buddy = buddyData
  }

  // Extract pod name from nested join
  const podData = (podMemberRes.data as any)?.pods as { name: string } | null
  const pod = podData ? { name: podData.name } : null

  return {
    student: studentRes.data,
    currentWeek: weekRes.data,
    currentDeliverable: deliverableRes.data ?? null,
    pod,
    buddy,
    cohortId,
    weekId,
    market: enrollmentRes.data.market as 'LATAM' | 'USA',
  }
}

// ── ESCALATION DETECTOR ───────────────────────────────────────────────────────
// Detects if a student message needs mentor intervention
// Called after every user message — if true, creates a mentor alert

const ESCALATION_KEYWORDS = [
  // Emotional crisis
  'me quiero morir', 'no quiero seguir', 'lo odio todo', 'no puedo más',
  'estoy muy mal', 'me siento terrible', 'crisis', 'me quiero salir',
  // Serious personal issues
  'me están maltratando', 'tengo miedo en casa', 'no tengo internet',
  'me quitaron el teléfono', 'no puedo participar más',
  // English variants (USA students)
  'i want to quit', 'i hate this', 'i cant do this anymore', "i'm depressed",
]

export function shouldEscalateToMentor(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return ESCALATION_KEYWORDS.some(keyword => lowerMessage.includes(keyword))
}

export async function createEscalationAlert(
  studentId: string,
  cohortId: string,
  message: string
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('mentor_alerts')
    .insert({
      student_id: studentId,
      cohort_id: cohortId,
      alert_type: 'inactive_48h', // closest type — mentor will see the message
      severity: 'red',
      message: `Próspero detectó una posible situación que necesita atención. Último mensaje del estudiante: "${message.substring(0, 200)}"`,
    })
}
