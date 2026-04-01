'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string
  email: string
  full_name: string
  nickname: string | null
  role: string
  country: string | null
  age: number | null
  parent_consent: boolean
  created_at: string
  enrollments: Array<{
    cohort_id: string
    status: string
    market: string
    is_scholarship: boolean
    enrolled_at: string
    cohorts: { name: string } | null
  }>
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  student: { bg: 'var(--teal-l)',  color: 'var(--teal)'    },
  mentor:  { bg: 'var(--mag-l)',   color: 'var(--magenta)' },
  admin:   { bg: 'var(--gold-l)',  color: '#a07000'        },
}

function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'mentor' | 'admin'>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateRole(userId: string, newRole: string) {
    setUpdating(userId)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setUpdating(null)
  }

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.nickname?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  const counts = {
    all:     users.length,
    student: users.filter(u => u.role === 'student').length,
    mentor:  users.filter(u => u.role === 'mentor').length,
    admin:   users.filter(u => u.role === 'admin').length,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--gold)', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 4px' }}>Usuarios</h1>
          <p style={{ color: 'var(--ink3)', fontSize: 13, margin: 0 }}>
            {users.length} usuarios registrados
          </p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '9px 14px', border: '1px solid var(--border)',
            borderRadius: 10, fontSize: 13, background: 'var(--white)',
            color: 'var(--ink)', outline: 'none', width: 240,
          }}
        />
      </div>

      {/* Role filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'student', 'mentor', 'admin'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            style={{
              padding: '5px 14px', borderRadius: 99,
              border: `1.5px solid ${roleFilter === r ? 'var(--gold)' : 'var(--border)'}`,
              background: roleFilter === r ? 'var(--gold)' : 'var(--white)',
              color: roleFilter === r ? 'var(--navy)' : 'var(--ink)',
              fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}
          >
            {r === 'all' ? 'Todos' : r.charAt(0).toUpperCase() + r.slice(1)}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>({counts[r]})</span>
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink3)', alignSelf: 'center' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* User table */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)', fontSize: 14 }}>
            No hay usuarios con este filtro
          </div>
        ) : (
          filtered.map((u, i) => {
            const rc = ROLE_COLORS[u.role] ?? ROLE_COLORS.student
            const displayName = u.nickname || u.full_name.split(' ')[0]
            const enrollment = u.enrollments?.[0]

            return (
              <div
                key={u.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '42px 1fr auto auto auto',
                  alignItems: 'center', gap: 14, padding: '12px 18px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: rc.bg, color: rc.color,
                  fontWeight: 800, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {initials(u.full_name)}
                </div>

                {/* Name + email */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                    {u.full_name !== displayName && (
                      <span style={{ fontWeight: 400, color: 'var(--ink3)', fontSize: 12, marginLeft: 5 }}>
                        {u.full_name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.email}
                    {u.country && <span style={{ marginLeft: 5 }}>· {u.country}</span>}
                    {enrollment?.cohorts?.name && (
                      <span style={{ marginLeft: 5 }}>· {enrollment.cohorts.name}</span>
                    )}
                  </div>
                </div>

                {/* Role selector */}
                <select
                  value={u.role}
                  disabled={updating === u.id}
                  onChange={e => updateRole(u.id, e.target.value)}
                  style={{
                    padding: '5px 10px', borderRadius: 8,
                    border: `1.5px solid ${rc.bg}`,
                    background: rc.bg, color: rc.color,
                    fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    opacity: updating === u.id ? 0.5 : 1,
                  }}
                >
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </select>

                {/* Scholarship / consent */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  {enrollment?.is_scholarship && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', background: 'var(--gold-l)', padding: '2px 7px', borderRadius: 20 }}>
                      ✦ Beca
                    </span>
                  )}
                  {!u.parent_consent && u.role === 'student' && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--coral)', background: 'var(--coral-l)', padding: '2px 7px', borderRadius: 20 }}>
                      Sin consentimiento
                    </span>
                  )}
                </div>

                {/* Joined date */}
                <span style={{ fontSize: 12, color: 'var(--ink4)', whiteSpace: 'nowrap' }}>
                  {fmtDate(u.created_at)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
