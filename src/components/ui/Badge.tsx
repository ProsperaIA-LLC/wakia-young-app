import React from 'react'

type BadgeVariant =
  | 'green'
  | 'coral'
  | 'gold'
  | 'teal'
  | 'magenta'
  | 'navy'
  | 'default'

type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean           // show a colored dot before text
  children: React.ReactNode
  style?: React.CSSProperties
}

const STYLES: Record<BadgeVariant, { bg: string; color: string; dot?: string }> = {
  green:   { bg: 'var(--green-l)',  color: 'var(--green-d)', dot: 'var(--green)' },
  coral:   { bg: 'var(--coral-l)', color: 'var(--coral)',   dot: 'var(--coral)' },
  gold:    { bg: 'var(--gold-l)',   color: '#8a5c00',        dot: 'var(--gold)' },
  teal:    { bg: 'var(--teal-l)',   color: 'var(--teal)',    dot: 'var(--teal)' },
  magenta: { bg: 'var(--mag-l)',    color: 'var(--magenta)', dot: 'var(--magenta)' },
  navy:    { bg: 'var(--navy)',     color: 'var(--white)',   dot: 'rgba(255,255,255,0.6)' },
  default: { bg: 'var(--bg2)',      color: 'var(--ink2)',    dot: 'var(--ink4)' },
}

const SIZE_STYLES: Record<BadgeSize, React.CSSProperties> = {
  sm: { padding: '2px 8px',  fontSize: '11px' },
  md: { padding: '3px 10px', fontSize: '12px' },
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  style,
}: BadgeProps) {
  const { bg, color, dot: dotColor } = STYLES[variant]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        borderRadius: '20px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        background: bg,
        color,
        ...SIZE_STYLES[size],
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  )
}

// ── Convenience aliases for common states ─────────────────────

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    submitted:   { variant: 'green',   label: 'Entregado' },
    reviewed:    { variant: 'teal',    label: 'Revisado' },
    draft:       { variant: 'gold',    label: 'Borrador' },
    pending:     { variant: 'coral',   label: 'Pendiente' },
    not_started: { variant: 'default', label: 'Sin iniciar' },
    active:      { variant: 'green',   label: 'Activo' },
    completed:   { variant: 'teal',    label: 'Completado' },
    dropped:     { variant: 'coral',   label: 'Retirado' },
    upcoming:    { variant: 'gold',    label: 'Próximo' },
    approved:    { variant: 'green',   label: 'Aprobado' },
    rejected:    { variant: 'coral',   label: 'Rechazado' },
  }
  const cfg = map[status] ?? { variant: 'default' as BadgeVariant, label: status }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}

export function PhaseBadge({ phase }: { phase: string }) {
  const map: Record<string, BadgeVariant> = {
    Despertar: 'teal',
    Construir: 'gold',
    Lanzar:    'coral',
  }
  return <Badge variant={map[phase] ?? 'default'}>{phase}</Badge>
}

export function AlertBadge({ severity }: { severity: 'yellow' | 'red' }) {
  return (
    <Badge variant={severity === 'red' ? 'coral' : 'gold'} dot>
      {severity === 'red' ? 'Alerta roja' : 'Alerta amarilla'}
    </Badge>
  )
}
