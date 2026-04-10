'use client'

import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface CohortRow {
  id: string
  name: string
  market: string
  status: string
  current_week: number
  start_date: string
  end_date: string
  price_usd: number | null
  max_students: number
  created_at: string
  studentCount: number
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  upcoming:  { label: 'Próxima',   bg: 'var(--teal-l)',  color: 'var(--teal)'    },
  active:    { label: 'Activa',    bg: 'var(--green-l)', color: 'var(--green-d)' },
  completed: { label: 'Terminada', bg: 'var(--bg2)',     color: 'var(--ink3)'    },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── New cohort form ────────────────────────────────────────────────────────────

function NewCohortForm({ onCreated }: { onCreated: (c: CohortRow) => void }) {
  const [form, setForm] = useState({
    name: '', market: 'LATAM', start_date: '', end_date: '',
    price_usd: '', max_students: '30',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      setError('Nombre, fecha de inicio y fecha de fin son obligatorios')
      return
    }
    setSaving(true)
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/admin/cohorts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        market: form.market,
        start_date: form.start_date,
        end_date: form.end_date,
        price_usd: form.price_usd ? Number(form.price_usd) : null,
        max_students: Number(form.max_students) || 30,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error creando la cohorte'); setSaving(false); return }
    onCreated({ ...data.cohort, studentCount: 0 })
    setForm({ name: '', market: 'LATAM', start_date: '', end_date: '', price_usd: '', max_students: '30' })
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', boxSizing: 'border-box',
    border: '1.5px solid var(--border)', borderRadius: 10,
    fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)',
    background: 'var(--bg)', outline: 'none',
  }

  return (
    <div style={{
      background: 'var(--white)', border: '1.5px solid var(--border)',
      borderRadius: 16, padding: '24px', marginBottom: 28,
    }}>
      <h2 style={{ fontWeight: 800, fontSize: 16, margin: '0 0 20px' }}>Nueva cohorte</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nombre *
            </label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Cohorte 2 — Agosto 2025" style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mercado *
            </label>
            <select value={form.market} onChange={e => set('market', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="LATAM">LATAM</option>
              <option value="USA">USA</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Capacidad
            </label>
            <input type="number" value={form.max_students} onChange={e => set('max_students', e.target.value)}
              min={1} max={100} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fecha de inicio *
            </label>
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fecha de fin *
            </label>
            <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Precio USD
            </label>
            <input type="number" value={form.price_usd} onChange={e => set('price_usd', e.target.value)}
              placeholder="297" min={0} style={inputStyle} />
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--coral-l)', color: 'var(--coral)', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            background: saving ? 'var(--ink4)' : 'var(--navy)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '11px 24px', fontWeight: 800, fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {saving ? 'Creando...' : 'Crear cohorte'}
        </button>
      </form>
    </div>
  )
}

// ── Cohort card ────────────────────────────────────────────────────────────────

function CohortCard({ cohort, onUpdate }: { cohort: CohortRow; onUpdate: (id: string, patch: Partial<CohortRow>) => void }) {
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingWeek, setSavingWeek] = useState(false)
  const meta = STATUS_META[cohort.status] ?? STATUS_META.upcoming

  async function changeStatus(newStatus: string) {
    setSavingStatus(true)
    await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/admin/cohorts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cohortId: cohort.id, status: newStatus }),
    })
    onUpdate(cohort.id, { status: newStatus })
    setSavingStatus(false)
  }

  async function changeWeek(w: number) {
    setSavingWeek(true)
    await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/admin/cohorts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cohortId: cohort.id, current_week: w }),
    })
    onUpdate(cohort.id, { current_week: w })
    setSavingWeek(false)
  }

  return (
    <div style={{
      background: 'var(--white)', border: '1.5px solid var(--border)',
      borderRadius: 16, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: 16, margin: '0 0 4px' }}>{cohort.name}</h3>
          <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
            {cohort.market} · {fmtDate(cohort.start_date)} → {fmtDate(cohort.end_date)}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: meta.bg, color: meta.color, flexShrink: 0 }}>
          {meta.label}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--teal)' }}>{cohort.studentCount}</div>
          <div style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estudiantes</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>{cohort.max_students}</div>
          <div style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capacidad</div>
        </div>
        {cohort.price_usd && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-d)' }}>${cohort.price_usd}</div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Precio USD</div>
          </div>
        )}
        {cohort.status === 'active' && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)' }}>S{cohort.current_week}</div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Semana actual</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Status transitions */}
        {cohort.status === 'upcoming' && (
          <button
            onClick={() => changeStatus('active')}
            disabled={savingStatus}
            style={{
              background: 'var(--green)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', opacity: savingStatus ? 0.6 : 1,
            }}
          >
            {savingStatus ? '...' : '▷ Activar'}
          </button>
        )}
        {cohort.status === 'active' && (
          <button
            onClick={() => changeStatus('completed')}
            disabled={savingStatus}
            style={{
              background: 'var(--ink3)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', opacity: savingStatus ? 0.6 : 1,
            }}
          >
            {savingStatus ? '...' : '✓ Marcar terminada'}
          </button>
        )}

        {/* Week selector (active cohorts only) */}
        {cohort.status === 'active' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink3)', fontWeight: 600 }}>Semana:</span>
            <select
              value={cohort.current_week}
              disabled={savingWeek}
              onChange={e => changeWeek(Number(e.target.value))}
              style={{
                padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--ink)', background: 'var(--white)',
                cursor: 'pointer', opacity: savingWeek ? 0.6 : 1,
              }}
            >
              {[1,2,3,4,5,6].map(w => (
                <option key={w} value={w}>Semana {w}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCohortsPage() {
  const [cohorts, setCohorts] = useState<CohortRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/admin/cohorts`)
      .then(r => r.json())
      .then(d => { setCohorts(d.cohorts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleUpdate(id: string, patch: Partial<CohortRow>) {
    setCohorts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 4px' }}>Cohortes</h1>
        <p style={{ color: 'var(--ink3)', fontSize: 13, margin: 0 }}>
          {cohorts.length} cohorte{cohorts.length !== 1 ? 's' : ''} en total
        </p>
      </div>

      <NewCohortForm onCreated={c => setCohorts(prev => [c, ...prev])} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {cohorts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: 14, padding: 40 }}>
            No hay cohortes todavía
          </div>
        ) : (
          cohorts.map(c => (
            <CohortCard key={c.id} cohort={c} onUpdate={handleUpdate} />
          ))
        )}
      </div>
    </div>
  )
}
