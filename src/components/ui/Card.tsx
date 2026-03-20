import React from 'react'

type CardVariant = 'default' | 'teal' | 'green' | 'gold' | 'coral' | 'magenta' | 'navy'

interface CardProps {
  variant?: CardVariant
  padding?: string | number
  children: React.ReactNode
  style?: React.CSSProperties
  onClick?: () => void
  className?: string
}

// Left-accent color per variant (used as a 3px left border)
const ACCENT: Record<CardVariant, string | null> = {
  default: null,
  teal:    'var(--teal)',
  green:   'var(--green)',
  gold:    'var(--gold)',
  coral:   'var(--coral)',
  magenta: 'var(--magenta)',
  navy:    'var(--navy)',
}

// Subtle background tint per variant
const BG_TINT: Record<CardVariant, string> = {
  default: 'var(--white)',
  teal:    'var(--teal-l)',
  green:   'var(--green-l)',
  gold:    'var(--gold-l)',
  coral:   'var(--coral-l)',
  magenta: 'var(--mag-l)',
  navy:    'var(--navy)',
}

const TEXT_COLOR: Record<CardVariant, string> = {
  default: 'var(--ink)',
  teal:    'var(--ink)',
  green:   'var(--ink)',
  gold:    'var(--ink)',
  coral:   'var(--ink)',
  magenta: 'var(--ink)',
  navy:    'var(--white)',
}

export function Card({
  variant = 'default',
  padding = '20px',
  children,
  style,
  onClick,
}: CardProps) {
  const accent = ACCENT[variant]
  const isClickable = typeof onClick === 'function'

  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => { if (isClickable) setHovered(true) }}
      onMouseLeave={() => { if (isClickable) setHovered(false) }}
      style={{
        background: BG_TINT[variant],
        borderRadius: '16px',
        border: `1px solid ${variant === 'navy' ? 'transparent' : 'var(--border)'}`,
        borderLeft: accent ? `3px solid ${accent}` : undefined,
        padding,
        color: TEXT_COLOR[variant],
        cursor: isClickable ? 'pointer' : undefined,
        transition: isClickable ? 'box-shadow 0.14s, transform 0.14s' : undefined,
        boxShadow: isClickable && hovered
          ? '0 4px 16px rgba(0,0,0,0.09)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        transform: isClickable && hovered ? 'translateY(-1px)' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
