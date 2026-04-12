'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserSnippet {
  id: string
  full_name: string
  nickname: string | null
  country: string | null
  timezone: string | null
}

interface PodMember extends UserSnippet {
  member_id: string
  user_id: string
  buddy_id: string | null
  is_pod_leader_this_week: boolean
}

interface Pod {
  id: string
  name: string
  timezone_region: string | null
  discord_channel_url: string | null
  members: PodMember[]
}

interface Cohort {
  id: string
  name: string
  status: string
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// ── Helpers ────────────────────────────────────────────────────────────────────

function displayName(u: UserSnippet) {
  return u.nickname ?? u.full_name
}

function flag(country: string | null) {
  if (!country) return ''
  try {
    return country.toUpperCase().replace(/./g, c =>
      String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
    )
  } catch { return '' }
}

// ── Cohort selector ────────────────────────────────────────────────────────────

function CohortSelect({
  value, onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const [cohorts, setCohorts] = useState<Cohort[]>([])

  useEffect(() => {
    fetch(`${BASE}/api/admin/cohorts`)
      .then(r => r.json())
      .then(d => setCohorts(d.cohorts ?? []))
      .catch(() => {})
  }, [])

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '8px 12px', borderRadius: 8, fontSize: 14,
        border: '1px solid var(--border)', background: 'var(--bg)',
        color: 'var(--ink)', cursor: 'pointer', minWidth: 220,
      }}
    >
      <option value="">Seleccionar cohorte…</option>
      {cohorts.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  )
}

// ── New pod form ───────────────────────────────────────────────────────────────

function NewPodForm({
  cohortId,
  onCreated,
}: {
  cohortId: string
  onCreated: (pod: Pod) => void
}) {
  const [name, setName] = useState('')
  const [tz, setTz] = useState('')
  const [discord, setDiscord] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setSaving(true)
    const res = await fetch(`${BASE}/api/admin/pods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cohort_id: cohortId,
        name: name.trim(),
        timezone_region: tz.trim() || null,
        discord_channel_url: discord.trim() || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setName(''); setTz(''); setDiscord('')
    onCreated(data.pod)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 600 }}>Nombre del pod *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Pod Andes"
          required
          style={{
            padding: '8px 10px', borderRadius: 8, fontSize: 13,
            border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--ink)', width: 160,
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 600 }}>Zona horaria</label>
        <input
          value={tz}
          onChange={e => setTz(e.target.value)}
          placeholder="Ej: GMT-5"
          style={{
            padding: '8px 10px', borderRadius: 8, fontSize: 13,
            border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--ink)', width: 120,
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 600 }}>Discord URL</label>
        <input
          value={discord}
          onChange={e => setDiscord(e.target.value)}
          placeholder="https://discord.com/…"
          style={{
            padding: '8px 10px', borderRadius: 8, fontSize: 13,
            border: '1px solid var(--border)', background: 'var(--bg)',
            color: 'var(--ink)', width: 200,
          }}
        />
      </div>
      <button
        type="submit"
        disabled={saving || !name.trim()}
        style={{
          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: 'var(--gold)', color: 'var(--navy)',
          border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Creando…' : '+ Crear pod'}
      </button>
      {error && <span style={{ fontSize: 12, color: 'var(--coral)', alignSelf: 'center' }}>{error}</span>}
    </form>
  )
}

// ── Unassigned student card ────────────────────────────────────────────────────

function UnassignedCard({
  student,
  pods,
  onAssigned,
}: {
  student: UserSnippet
  pods: Pod[]
  onAssigned: (userId: string, podId: string, memberId: string) => void
}) {
  const [podId, setPodId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function assign() {
    if (!podId) return
    setError('')
    setSaving(true)
    const res = await fetch(`${BASE}/api/admin/pods/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pod_id: podId, user_id: student.id }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    onAssigned(student.id, podId, data.member.id)
  }

  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--teal-l)', color: 'var(--teal)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 12, flexShrink: 0,
        }}>
          {displayName(student).charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
            {displayName(student)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
            {flag(student.country)} {student.timezone ?? ''}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <select
          value={podId}
          onChange={e => setPodId(e.target.value)}
          style={{
            flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 12,
            border: '1px solid var(--border)', background: 'var(--bg2)',
            color: 'var(--ink)', cursor: 'pointer',
          }}
        >
          <option value="">Elegir pod…</option>
          {pods.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={assign}
          disabled={!podId || saving}
          style={{
            padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
            background: podId ? 'var(--gold)' : 'var(--bg2)',
            color: podId ? 'var(--navy)' : 'var(--ink3)',
            border: 'none', cursor: podId && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? '…' : 'Asignar'}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: 'var(--coral)' }}>{error}</div>}
    </div>
  )
}

// ── Pod card ───────────────────────────────────────────────────────────────────

function PodCard({
  pod,
  allMembers,
  onRemoveMember,
  onSetBuddy,
  onSetLeader,
  onDelete,
  onUpdate,
}: {
  pod: Pod
  allMembers: PodMember[]
  onRemoveMember: (memberId: string) => void
  onSetBuddy: (memberId: string, buddyId: string | null) => void
  onSetLeader: (memberId: string, isLeader: boolean) => void
  onDelete: (podId: string) => void
  onUpdate: (podId: string, patch: Partial<Pod>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(pod.name)
  const [editTz, setEditTz] = useState(pod.timezone_region ?? '')
  const [editDiscord, setEditDiscord] = useState(pod.discord_channel_url ?? '')
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function saveEdit() {
    setSaving(true)
    const res = await fetch(`${BASE}/api/admin/pods`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pod_id: pod.id,
        name: editName.trim(),
        timezone_region: editTz.trim() || null,
        discord_channel_url: editDiscord.trim() || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      onUpdate(pod.id, {
        name: editName.trim(),
        timezone_region: editTz.trim() || null,
        discord_channel_url: editDiscord.trim() || null,
      })
      setEditing(false)
    }
  }

  async function removeMember(memberId: string) {
    setRemovingId(memberId)
    const res = await fetch(`${BASE}/api/admin/pods/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId }),
    })
    setRemovingId(null)
    if (res.ok) onRemoveMember(memberId)
  }

  async function deletePod() {
    if (!confirm(`¿Eliminar el pod "${pod.name}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`${BASE}/api/admin/pods`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pod_id: pod.id }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data.error); return }
    onDelete(pod.id)
  }

  async function setBuddy(memberId: string, buddyId: string | null) {
    await fetch(`${BASE}/api/admin/pods/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, buddy_id: buddyId }),
    })
    onSetBuddy(memberId, buddyId)
  }

  async function toggleLeader(memberId: string, current: boolean) {
    await fetch(`${BASE}/api/admin/pods/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, is_pod_leader_this_week: !current }),
    })
    onSetLeader(memberId, !current)
  }

  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Pod header */}
      <div style={{
        background: 'var(--navy)', padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {editing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              style={{
                padding: '5px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)',
                color: '#fff', width: '100%',
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={editTz}
                onChange={e => setEditTz(e.target.value)}
                placeholder="Zona horaria"
                style={{
                  flex: 1, padding: '4px 8px', borderRadius: 6, fontSize: 12,
                  border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
              <input
                value={editDiscord}
                onChange={e => setEditDiscord(e.target.value)}
                placeholder="Discord URL"
                style={{
                  flex: 2, padding: '4px 8px', borderRadius: 6, fontSize: 12,
                  border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={saveEdit}
                disabled={saving || !editName.trim()}
                style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: 'var(--gold)', color: 'var(--navy)', border: 'none', cursor: 'pointer',
                }}
              >
                {saving ? '…' : 'Guardar'}
              </button>
              <button
                onClick={() => { setEditing(false); setEditName(pod.name); setEditTz(pod.timezone_region ?? ''); setEditDiscord(pod.discord_channel_url ?? '') }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12,
                  background: 'transparent', color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{pod.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                {[pod.timezone_region, pod.members.length + ' miembros'].filter(Boolean).join(' · ')}
              </div>
            </div>
            {pod.discord_channel_url && (
              <a
                href={pod.discord_channel_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 18, textDecoration: 'none', lineHeight: 1 }}
                title="Canal Discord"
              >
                💬
              </a>
            )}
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '4px 8px', borderRadius: 6, fontSize: 11,
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
                border: 'none', cursor: 'pointer',
              }}
            >
              Editar
            </button>
            <button
              onClick={deletePod}
              style={{
                padding: '4px 8px', borderRadius: 6, fontSize: 11,
                background: 'rgba(255,80,80,0.15)', color: 'rgba(255,120,120,0.9)',
                border: 'none', cursor: 'pointer',
              }}
            >
              Eliminar
            </button>
          </>
        )}
      </div>

      {/* Members */}
      <div style={{ padding: 12 }}>
        {pod.members.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', padding: '12px 0' }}>
            Sin miembros asignados
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pod.members.map(m => (
              <div
                key={m.member_id}
                style={{
                  background: m.is_pod_leader_this_week ? 'rgba(224,163,38,0.07)' : 'var(--bg2)',
                  border: `1px solid ${m.is_pod_leader_this_week ? 'rgba(224,163,38,0.3)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '8px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                      {displayName(m)}
                    </span>
                    {m.is_pod_leader_this_week && (
                      <span style={{
                        marginLeft: 6, fontSize: 10, fontWeight: 800,
                        background: 'rgba(224,163,38,0.15)', color: 'var(--gold)',
                        padding: '1px 6px', borderRadius: 10,
                      }}>
                        LÍDER
                      </span>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>
                      {flag(m.country)} {m.timezone ?? ''}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleLeader(m.member_id, m.is_pod_leader_this_week)}
                    title={m.is_pod_leader_this_week ? 'Quitar como líder' : 'Hacer líder esta semana'}
                    style={{
                      padding: '3px 7px', borderRadius: 6, fontSize: 11,
                      background: m.is_pod_leader_this_week ? 'rgba(224,163,38,0.15)' : 'var(--bg)',
                      color: m.is_pod_leader_this_week ? 'var(--gold)' : 'var(--ink3)',
                      border: `1px solid ${m.is_pod_leader_this_week ? 'rgba(224,163,38,0.3)' : 'var(--border)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    ★
                  </button>
                  <button
                    onClick={() => removeMember(m.member_id)}
                    disabled={removingId === m.member_id}
                    style={{
                      padding: '3px 7px', borderRadius: 6, fontSize: 11,
                      background: 'rgba(255,80,80,0.08)', color: 'rgba(200,60,60,0.9)',
                      border: '1px solid rgba(200,60,60,0.2)', cursor: 'pointer',
                    }}
                  >
                    {removingId === m.member_id ? '…' : '✕'}
                  </button>
                </div>
                {/* Buddy picker */}
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink3)', flexShrink: 0 }}>Buddy:</span>
                  <select
                    value={m.buddy_id ?? ''}
                    onChange={e => setBuddy(m.member_id, e.target.value || null)}
                    style={{
                      flex: 1, padding: '3px 6px', borderRadius: 6, fontSize: 12,
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--ink)', cursor: 'pointer',
                    }}
                  >
                    <option value="">Sin buddy</option>
                    {allMembers
                      .filter(other => other.user_id !== m.user_id)
                      .map(other => (
                        <option key={other.user_id} value={other.user_id}>
                          {displayName(other)}
                        </option>
                      ))
                    }
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PodsPage() {
  const [cohortId, setCohortId] = useState('')
  const [pods, setPods] = useState<Pod[]>([])
  const [unassigned, setUnassigned] = useState<UserSnippet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadPods = useCallback(async (cId: string) => {
    if (!cId) { setPods([]); setUnassigned([]); return }
    setLoading(true)
    setError('')
    const res = await fetch(`${BASE}/api/admin/pods?cohort_id=${cId}`)
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setPods(data.pods ?? [])
    setUnassigned(data.unassigned ?? [])
  }, [])

  useEffect(() => { loadPods(cohortId) }, [cohortId, loadPods])

  // All pod members flattened — for buddy dropdown
  const allMembers = pods.flatMap(p => p.members)

  function handleCreated(pod: Pod) {
    setPods(prev => [...prev, pod])
  }

  function handleAssigned(userId: string, podId: string, memberId: string) {
    const student = unassigned.find(u => u.id === userId)
    if (!student) return
    setUnassigned(prev => prev.filter(u => u.id !== userId))
    setPods(prev => prev.map(p => p.id !== podId ? p : {
      ...p,
      members: [...p.members, {
        ...student,
        member_id: memberId,
        user_id: userId,
        buddy_id: null,
        is_pod_leader_this_week: false,
      }],
    }))
  }

  function handleRemoveMember(podId: string, memberId: string) {
    const pod = pods.find(p => p.id === podId)
    const member = pod?.members.find(m => m.member_id === memberId)
    if (!member) return
    setPods(prev => prev.map(p => p.id !== podId ? p : {
      ...p,
      members: p.members.filter(m => m.member_id !== memberId),
    }))
    const { member_id: _mid, buddy_id: _bid, is_pod_leader_this_week: _l, ...snippet } = member
    setUnassigned(prev => [...prev, snippet].sort((a, b) => a.full_name.localeCompare(b.full_name)))
  }

  function handleSetBuddy(podId: string, memberId: string, buddyId: string | null) {
    setPods(prev => prev.map(p => p.id !== podId ? p : {
      ...p,
      members: p.members.map(m => m.member_id !== memberId ? m : { ...m, buddy_id: buddyId }),
    }))
  }

  function handleSetLeader(podId: string, memberId: string, isLeader: boolean) {
    setPods(prev => prev.map(p => p.id !== podId ? p : {
      ...p,
      members: p.members.map(m => m.member_id !== memberId ? m : { ...m, is_pod_leader_this_week: isLeader }),
    }))
  }

  function handleDeletePod(podId: string) {
    const pod = pods.find(p => p.id === podId)
    const freed = (pod?.members ?? []).map(m => {
      const { member_id: _mid, buddy_id: _bid, is_pod_leader_this_week: _l, ...snippet } = m
      return snippet
    })
    setPods(prev => prev.filter(p => p.id !== podId))
    setUnassigned(prev => [...prev, ...freed].sort((a, b) => a.full_name.localeCompare(b.full_name)))
  }

  function handleUpdatePod(podId: string, patch: Partial<Pod>) {
    setPods(prev => prev.map(p => p.id !== podId ? p : { ...p, ...patch }))
  }

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Pods</h1>
        <p style={{ fontSize: 14, color: 'var(--ink3)', margin: '4px 0 0' }}>
          Organiza estudiantes en pods y asigna buddies.
        </p>
      </div>

      {/* Cohort selector */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, color: 'var(--ink3)', fontWeight: 600 }}>Cohorte:</span>
        <CohortSelect value={cohortId} onChange={setCohortId} />
      </div>

      {!cohortId && (
        <div style={{
          background: 'var(--bg2)', borderRadius: 12, padding: '32px',
          textAlign: 'center', color: 'var(--ink3)', fontSize: 14,
        }}>
          Seleccioná una cohorte para ver y gestionar sus pods.
        </div>
      )}

      {cohortId && loading && (
        <div style={{ textAlign: 'center', color: 'var(--ink3)', padding: 40, fontSize: 14 }}>
          Cargando…
        </div>
      )}

      {cohortId && error && (
        <div style={{
          background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)',
          borderRadius: 8, padding: '10px 14px', color: 'var(--coral)', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {cohortId && !loading && !error && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Left column: unassigned + create ── */}
          <div style={{ width: 280, flexShrink: 0 }}>

            {/* Create pod */}
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 16, marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginBottom: 12 }}>
                Nuevo pod
              </div>
              <NewPodForm cohortId={cohortId} onCreated={handleCreated} />
            </div>

            {/* Unassigned students */}
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 14px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
                  Sin asignar
                </span>
                <span style={{
                  background: unassigned.length > 0 ? 'var(--coral)' : 'var(--bg2)',
                  color: unassigned.length > 0 ? '#fff' : 'var(--ink3)',
                  fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
                }}>
                  {unassigned.length}
                </span>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {unassigned.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--ink3)', textAlign: 'center', padding: '12px 0' }}>
                    Todos los estudiantes están asignados ✓
                  </div>
                ) : (
                  unassigned.map(s => (
                    <UnassignedCard
                      key={s.id}
                      student={s}
                      pods={pods}
                      onAssigned={handleAssigned}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Right column: pods grid ── */}
          <div style={{ flex: 1, minWidth: 300 }}>
            {pods.length === 0 ? (
              <div style={{
                background: 'var(--bg2)', borderRadius: 12, padding: '32px',
                textAlign: 'center', color: 'var(--ink3)', fontSize: 14,
              }}>
                No hay pods en esta cohorte. Crea el primero →
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}>
                {pods.map(pod => (
                  <PodCard
                    key={pod.id}
                    pod={pod}
                    allMembers={allMembers}
                    onRemoveMember={memberId => handleRemoveMember(pod.id, memberId)}
                    onSetBuddy={(memberId, buddyId) => handleSetBuddy(pod.id, memberId, buddyId)}
                    onSetLeader={(memberId, isLeader) => handleSetLeader(pod.id, memberId, isLeader)}
                    onDelete={handleDeletePod}
                    onUpdate={handleUpdatePod}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
