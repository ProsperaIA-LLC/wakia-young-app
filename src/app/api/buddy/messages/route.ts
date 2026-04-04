/**
 * GET  /api/buddy/messages — fetch thread between caller and their buddy
 * POST /api/buddy/messages — send a message to caller's buddy
 *
 * Security: buddy_id is always derived from the DB (pod_members),
 * never trusted from the client — prevents IDOR.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface BuddyMessageItem {
  id: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: string
  isMine: boolean
}

export interface BuddyMessagesResponse {
  buddy: {
    id: string
    fullName: string
    nickname: string | null
    country: string | null
  } | null
  messages: BuddyMessageItem[]
  unreadCount: number
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 1. Get caller's buddy_id and cohort from pod_members
  const { data: membership, error: memberErr } = await supabase
    .from('pod_members')
    .select('buddy_id, cohort_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberErr) {
    return NextResponse.json({ error: 'Error buscando tu pod' }, { status: 500 })
  }
  if (!membership?.buddy_id) {
    // No buddy assigned yet — return empty state, not an error
    return NextResponse.json({ buddy: null, messages: [], unreadCount: 0 } satisfies BuddyMessagesResponse)
  }

  const buddyId   = membership.buddy_id
  const cohortId  = membership.cohort_id

  // 2. Fetch buddy info + messages in parallel
  const [buddyRes, messagesRes] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, nickname, country')
      .eq('id', buddyId)
      .single(),

    supabase
      .from('buddy_messages')
      .select('id, sender_id, content, is_read, created_at')
      .eq('cohort_id', cohortId)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${buddyId}),and(sender_id.eq.${buddyId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(100),
  ])

  // 3. Mark unread received messages as read (fire-and-forget)
  supabase
    .from('buddy_messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('sender_id', buddyId)
    .eq('is_read', false)
    .then(() => {/* ignore result */})

  const buddy = buddyRes.data
  const rawMessages = messagesRes.data ?? []

  const messages: BuddyMessageItem[] = rawMessages.map(m => ({
    id:        m.id,
    senderId:  m.sender_id,
    content:   m.content,
    isRead:    m.is_read,
    createdAt: m.created_at,
    isMine:    m.sender_id === user.id,
  }))

  const unreadCount = rawMessages.filter(m => !m.is_read && m.sender_id !== user.id).length

  return NextResponse.json({
    buddy: buddy
      ? { id: buddy.id, fullName: buddy.full_name, nickname: buddy.nickname, country: buddy.country }
      : null,
    messages,
    unreadCount,
  } satisfies BuddyMessagesResponse)
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 1. Parse + validate body
  let body: { content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const content = body.content?.trim() ?? ''
  if (!content) {
    return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }
  if (content.length > 500) {
    return NextResponse.json({ error: 'Máximo 500 caracteres' }, { status: 400 })
  }

  // 2. Derive buddy from DB — never trust client
  const { data: membership, error: memberErr } = await supabase
    .from('pod_members')
    .select('buddy_id, cohort_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberErr) {
    return NextResponse.json({ error: 'Error buscando tu pod' }, { status: 500 })
  }
  if (!membership?.buddy_id) {
    return NextResponse.json({ error: 'No tenés un buddy asignado todavía' }, { status: 400 })
  }

  const buddyId   = membership.buddy_id
  const cohortId  = membership.cohort_id

  // 3. Insert message
  const { data: message, error: insertErr } = await supabase
    .from('buddy_messages')
    .insert({
      sender_id:   user.id,
      receiver_id: buddyId,
      cohort_id:   cohortId,
      content,
    })
    .select('id, sender_id, content, is_read, created_at')
    .single()

  if (insertErr || !message) {
    console.error('[/api/buddy/messages POST]', insertErr?.message)
    return NextResponse.json({ error: 'No se pudo enviar el mensaje' }, { status: 500 })
  }

  // 4. Log activity (non-blocking)
  supabase
    .from('activity_log')
    .insert({ user_id: user.id, cohort_id: cohortId, action: 'buddy_message_sent' })
    .then(() => {/* ignore */})

  const result: BuddyMessageItem = {
    id:        message.id,
    senderId:  message.sender_id,
    content:   message.content,
    isRead:    message.is_read,
    createdAt: message.created_at,
    isMine:    true,
  }

  return NextResponse.json({ message: result }, { status: 201 })
}
