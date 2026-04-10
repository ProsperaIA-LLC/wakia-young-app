'use client'

import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Application {
  id: string
  full_name: string
  email: string
  age: number | null
  country: string | null
  motivation_letter: string | null
  video_url: string | null
  reference_name: string | null
  reference_contact: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const STATUS_META = {
  pending:  { label: 'Pendiente', bg: 'var(--gold-l)',  color: '#a07000' },
  approved: { label: 'Aprobada',  bg: 'var(--green-l)', color: 'var(--green-d)' },
  rejected: { label: 'Rechazada', bg: 'var(--coral-l)', color: 'var(--coral)' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Application card ───────────────────────────────────────────────────────────

function AppCard({
  app, onUpdate,
}: {
  app: Application
  onUpdate: (id: string, status: 'approved' | 'rejected') => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [processing, setProcessing] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState('')

  const meta = STATUS_META[app.status]

  async function act(action: 'approve' | 'reject') {
    setProcessing(action)
    setError('')
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/admin/scholarships`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, action }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al procesar')
      setProcessing(null)
      return
    }
    onUpdate(app.id, action === 'approve' ? 'approved' : 'rejected')
    setProcessing(null)
  }

  const letterPreview = app.motivation_letter
    ? (app.motivation_letter.length > 200 && !expanded
      ? app.motivation_letter.slice(0, 200) + '...'
      : app.motivation_letter)
    : null

  return (
    <div style={{
      background: 'var(--white)',
      border: `1.5px solid ${app.status === 'pending' ? 'var(--border)' : app.status === 'approved' ? 'var(--green)' : 'rgba(255,92,53,0.3)'}`,
      borderRadius: 16, padding: '20px 22px',
      opacity: app.status !== 'pending' ? 0.75 : 1,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>{app.full_name}</h3>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 3 }}>
            {app.email}
            {app.age && <span style={{ marginLeft: 6 }}>· {app.age} años</span>}
            {app.country && <span style={{ marginLeft: 6 }}>· {app.country}</span>}
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--ink4)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {fmtDate(app.created_at)}
        </span>
      </div>

      {/* Motivation letter */}
      {letterPreview && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
            Carta de motivación
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.6, margin: '0 0 4px', whiteSpace: 'pre-wrap' }}>
            {letterPreview}
          </p>
          {(app.motivation_letter?.length ?? 0) > 200 && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              {expanded ? 'Ver menos ↑' : 'Ver completo ↓'}
            </button>
          )}
        </div>
      )}

      {/* Extra info */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: app.status === 'pending' ? 14 : 0 }}>
        {app.video_url && (
          <a href={app.video_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>
            ▷ Ver video
          </a>
        )}
        {app.reference_name && (
          <span style={{ fontSize: 12, color: 'var(--ink3)' }}>
            Referencia: <strong>{app.reference_name}</strong>
            {app.reference_contact && <span style={{ marginLeft: 4 }}>({app.reference_contact})</span>}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--coral-l)', color: 'var(--coral)', borderRadius: 8, padding: '7px 12px', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Action buttons (pending only) */}
      {app.status === 'pending' && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => act('approve')}
            disabled={processing !== null}
            style={{
              background: processing === 'approve' ? 'var(--ink4)' : 'var(--green)',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 20px', fontWeight: 700, fontSize: 13,
              cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {processing === 'approve' ? 'Procesando...' : '✓ Aprobar beca'}
          </button>
          <button
            onClick={() => act('reject')}
            disabled={processing !== null}
            style={{
              background: 'none', border: '1.5px solid var(--coral)', color: 'var(--coral)',
              borderRadius: 10, padding: '9px 20px', fontWeight: 700, fontSize: 13,
              cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {processing === 'reject' ? 'Procesando...' : 'Rechazar'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminScholarshipsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/admin/scholarships`)
      .then(r => r.json())
      .then(d => { setApps(d.applications ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleUpdate(id: string, status: 'approved' | 'rejected') {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const counts = {
    all:      apps.length,
    pending:  apps.filter(a => a.status === 'pending').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
    total:    apps.length,
  }

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--gold)', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 4px' }}>Becas</h1>
        <p style={{ color: 'var(--ink3)', fontSize: 13, margin: 0 }}>
          {counts.total} solicitudes · {counts.pending} pendientes
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {([
          { key: 'pending',  label: 'Pendientes' },
          { key: 'approved', label: 'Aprobadas'  },
          { key: 'rejected', label: 'Rechazadas' },
          { key: 'all',      label: 'Todas'      },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '6px 16px', borderRadius: 99,
              border: `1.5px solid ${filter === key ? 'var(--navy)' : 'var(--border)'}`,
              background: filter === key ? 'var(--navy)' : 'var(--white)',
              color: filter === key ? '#fff' : 'var(--ink)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            {label}
            <span style={{ marginLeft: 6, opacity: 0.65 }}>({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: 14, padding: '48px 0' }}>
            {filter === 'pending' ? 'Sin solicitudes pendientes ✓' : 'Sin solicitudes en esta categoría'}
          </div>
        ) : (
          filtered.map(a => (
            <AppCard key={a.id} app={a} onUpdate={handleUpdate} />
          ))
        )}
      </div>
    </div>
  )
}
