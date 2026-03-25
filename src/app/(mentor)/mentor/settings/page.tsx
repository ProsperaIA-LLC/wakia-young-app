'use client'

export default function SettingsPage() {
  return (
    <div style={{ padding: '40px 24px', maxWidth: 600 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 8px', color: 'var(--ink)' }}>
        Configuración
      </h1>
      <p style={{ fontSize: 14, color: 'var(--ink3)', margin: '0 0 28px' }}>
        Ajustes del programa y la cohorte.
      </p>
      <div style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px 24px',
        color: 'var(--ink3)', fontSize: 14, textAlign: 'center',
      }}>
        Funcionalidad disponible próximamente.
      </div>
    </div>
  )
}
