'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CohortData {
  id: string
  name: string
  market: string
  status: string
  current_week: number
  start_date: string
  end_date: string
  max_students: number
  price_usd: number | null
}

interface WeekRow {
  id: string
  week_number: number
  phase: string
  title: string
  unlock_date: string
  due_date: string
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  upcoming:  { label: 'Próxima',   bg: 'var(--gold-l)',  color: '#b07a10' },
  active:    { label: 'Activa',    bg: 'var(--green-l)', color: 'var(--green-d)' },
  completed: { label: 'Completada', bg: 'var(--bg2)',    color: 'var(--ink3)' },
}

export default function SettingsPage() {
  const router = useRouter()
  const [cohort, setCohort]   = useState<CohortData | null>(null)
  const [weeks, setWeeks]     = useState<WeekRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  // Editable fields
  const [cohortName, setCohortName]     = useState('')
  const [currentWeek, setCurrentWeek]   = useState(1)
  const [status, setStatus]             = useState('active')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/mentor/cohort`)
      .then(r => r.json())
      .then(d => {
        if (d.cohort) {
          setCohort(d.cohort)
          setCohortName(d.cohort.name)
          setCurrentWeek(d.cohort.current_week)
          setStatus(d.cohort.status)
        }
        setWeeks(d.weeks ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!cohort) return
    setError('')
    setSaving(true)
    setSaved(false)

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/mentor/cohort`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cohortId: cohort.id,
        name: cohortName,
        current_week: currentWeek,
        status,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al guardar')
      setSaving(false)
      return
    }

    setCohort(data.cohort)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--magenta)', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!cohort) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink3)' }}>
        No hay ninguna cohorte activa.
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: '1px solid var(--border)', borderRadius: 10,
    fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit',
    background: 'var(--white)', outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 700, fontSize: 12,
    color: 'var(--ink2)', marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  const st = STATUS_LABELS[cohort.status] ?? STATUS_LABELS.active

  return (
    <div style={{ padding: '22px 24px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 4px', color: 'var(--ink)' }}>
          Configuración
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: st.bg, color: st.color, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {st.label}
          </span>
          <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{cohort.name}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Left: editable settings */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 20 }}>
            Cohorte activa
          </div>

          {/* Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Nombre de la cohorte</label>
            <input
              type="text"
              value={cohortName}
              onChange={e => setCohortName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Current week */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Semana actual del programa</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--white)', fontSize: 18, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink2)', flexShrink: 0,
                }}
              >−</button>
              <div style={{
                flex: 1, textAlign: 'center', fontWeight: 800, fontSize: 22,
                color: 'var(--magenta)',
              }}>
                {currentWeek} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink3)' }}>de 6</span>
              </div>
              <button
                onClick={() => setCurrentWeek(w => Math.min(6, w + 1))}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--white)', fontSize: 18, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink2)', flexShrink: 0,
                }}
              >+</button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 6 }}>
              Avanzar la semana desbloquea el contenido del siguiente reto para todos los estudiantes.
            </p>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Estado de la cohorte</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              <option value="upcoming">Próxima</option>
              <option value="active">Activa</option>
              <option value="completed">Completada</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--coral-l)', color: 'var(--coral)',
              border: '1px solid rgba(255,92,53,0.25)', borderRadius: 10,
              padding: '10px 14px', fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Save button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: saving ? 'var(--ink4)' : 'var(--magenta)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '11px 24px', fontWeight: 800, fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && (
              <span style={{ fontSize: 13, color: 'var(--green-d)', fontWeight: 600 }}>
                ✓ Guardado
              </span>
            )}
          </div>
        </div>

        {/* Right: weeks overview + add week */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Weeks list */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                Semanas ({weeks.length}/6)
              </div>
              <button
                onClick={() => router.push('/mentor/weeks/new')}
                style={{
                  background: 'var(--mag-l)', color: 'var(--magenta)',
                  border: '1px solid rgba(165,8,107,0.2)', borderRadius: 8,
                  padding: '5px 12px', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                + Agregar
              </button>
            </div>

            {weeks.length === 0 ? (
              <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--ink3)', textAlign: 'center' }}>
                No hay semanas creadas aún.
              </div>
            ) : (
              weeks.map((w, idx) => {
                const isCurrent = w.week_number === cohort.current_week
                return (
                  <div key={w.id} style={{
                    padding: '11px 16px',
                    borderBottom: idx < weeks.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: isCurrent ? 'var(--mag-l)' : 'transparent',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: isCurrent ? 'var(--magenta)' : 'var(--bg2)',
                      color: isCurrent ? '#fff' : 'var(--ink3)',
                      fontWeight: 800, fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {w.week_number}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: isCurrent ? 700 : 600,
                        color: isCurrent ? 'var(--magenta)' : 'var(--ink)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {w.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                        {w.phase} · {new Date(w.unlock_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    {isCurrent && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                        background: 'var(--magenta)', color: '#fff',
                        textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                      }}>
                        Actual
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Info card */}
          <div style={{
            background: 'var(--gold-l)', border: '1px solid rgba(224,163,38,0.25)',
            borderRadius: 14, padding: '14px 16px',
          }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#b07a10', marginBottom: 6 }}>
              📅 Fechas de la cohorte
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.6 }}>
              <div>Inicio: {new Date(cohort.start_date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div>Cierre: {new Date(cohort.end_date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div>Mercado: {cohort.market}</div>
              <div>Máx. estudiantes: {cohort.max_students}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
