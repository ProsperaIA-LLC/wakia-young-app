'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PodData {
  id: string
  name: string
  timezone_region: string | null
  discord_channel_url: string | null
  cohort_id: string
  cohortName: string
  members: Array<{
    user_id: string
    user: { id: string; full_name: string; nickname: string | null; country: string | null } | null
    is_pod_leader_this_week: boolean
    hasSubmitted: boolean
    hoursInactive: number
    isOnline: boolean
  }>
}

export default function PodsPage() {
  const router = useRouter()
  const [pods, setPods] = useState<PodData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/mentor/dashboard')
      .then(r => r.json())
      .then(data => {
        const currentWeek = data.cohort?.current_week ?? 1
        const cohortName  = data.cohort?.name ?? ''

        // Group students by pod_id
        const podMap = new Map<string, PodData>()
        for (const s of (data.students ?? [])) {
          if (!s.pod_id) continue
          if (!podMap.has(s.pod_id)) {
            podMap.set(s.pod_id, {
              id: s.pod_id,
              name: s.pod_name ?? 'Pod',
              timezone_region: null,
              discord_channel_url: null,
              cohort_id: s.cohort_id,
              cohortName,
              members: [],
            })
          }
          podMap.get(s.pod_id)!.members.push({
            user_id: s.user_id,
            user: {
              id: s.user_id,
              full_name: s.full_name ?? 'Estudiante',
              nickname: s.nickname ?? null,
              country: s.country ?? null,
            },
            is_pod_leader_this_week: s.is_pod_leader_this_week ?? false,
            hasSubmitted: (s.deliverables_submitted ?? 0) >= currentWeek,
            hoursInactive: s.hours_since_activity ?? 0,
            isOnline: (s.hours_since_activity ?? 999) < 0.25,
          })
        }
        setPods([...podMap.values()])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--magenta)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontWeight: 800, fontSize: '22px', margin: '0 0 4px' }}>Pods</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
          {pods.length} pod{pods.length !== 1 ? 's' : ''} activo{pods.length !== 1 ? 's' : ''}
        </p>
      </div>

      {pods.length === 0 && (
        <div style={{
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '48px',
          textAlign: 'center', color: '#6B7280', fontSize: '14px',
        }}>
          No hay pods configurados en cohortes activas.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
        {pods.map(pod => {
          const submittedCount = pod.members.filter(m => m.hasSubmitted).length
          const leader = pod.members.find(m => m.is_pod_leader_this_week)
          const hasAlerts = pod.members.some(m => m.hoursInactive >= 48)

          return (
            <div
              key={pod.id}
              style={{
                background: 'white',
                border: `1px solid ${hasAlerts ? 'rgba(255,92,53,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {/* Pod header */}
              <div style={{
                background: hasAlerts ? '#FFF1F0' : 'var(--navy)',
                color: hasAlerts ? 'var(--coral)' : 'white',
                padding: '16px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '15px', margin: '0 0 2px' }}>{pod.name}</p>
                    <p style={{ fontSize: '11px', opacity: hasAlerts ? 0.7 : 0.5, margin: 0 }}>
                      {pod.cohortName}{pod.timezone_region ? ` · ${pod.timezone_region}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hasAlerts && <span style={{ fontSize: '14px' }}>⚠️</span>}
                    <span style={{
                      background: hasAlerts ? 'var(--coral)' : 'rgba(255,255,255,0.15)',
                      color: 'white',
                      fontSize: '11px', fontWeight: 700,
                      padding: '3px 10px', borderRadius: '99px',
                    }}>
                      {submittedCount}/{pod.members.length} entregaron
                    </span>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div style={{ padding: '12px 0' }}>
                {pod.members.map(m => (
                  <div
                    key={m.user_id}
                    onClick={() => router.push(`/mentor/students/${m.user_id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 18px', cursor: 'pointer',
                      borderLeft: m.hoursInactive >= 48 ? '3px solid var(--coral)' : m.hoursInactive >= 24 ? '3px solid var(--gold)' : '3px solid transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{
                      display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
                      background: m.isOnline ? '#22C55E' : m.hoursInactive >= 48 ? 'var(--coral)' : '#D1D5DB',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>
                          {m.user?.nickname || m.user?.full_name?.split(' ')[0] || 'Estudiante'}
                        </span>
                        {m.is_pod_leader_this_week && (
                          <span style={{ fontSize: '10px', background: 'var(--gold)', color: 'var(--navy)', padding: '1px 6px', borderRadius: '99px', fontWeight: 700 }}>⭐</span>
                        )}
                        {m.hasSubmitted && (
                          <span style={{ fontSize: '10px', background: '#D1FAE5', color: '#065F46', padding: '1px 6px', borderRadius: '99px', fontWeight: 700 }}>✓</span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: m.hoursInactive >= 48 ? 'var(--coral)' : '#9CA3AF' }}>
                      {m.isOnline ? 'Ahora' : m.hoursInactive < 24 ? `${m.hoursInactive}h` : m.hoursInactive < 48 ? 'Ayer' : `${Math.floor(m.hoursInactive / 24)}d`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {(pod.discord_channel_url || leader) && (
                <div style={{
                  borderTop: '1px solid var(--border)', padding: '10px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                }}>
                  {leader && (
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      Líder: <strong>{leader.user?.nickname || leader.user?.full_name?.split(' ')[0]}</strong>
                    </span>
                  )}
                  {pod.discord_channel_url && (
                    <a
                      href={pod.discord_channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: '12px', color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Discord →
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
