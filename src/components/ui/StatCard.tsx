import React from 'react'

type StatColor = 'green' | 'coral' | 'gold' | 'teal' | 'magenta' | 'navy' | 'default'

interface StatCardProps {
  label: string
  value: string | number
  icon?: string          // emoji icon
  color?: StatColor
  sublabel?: string      // optional context line below value
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string    // e.g. "+3 esta semana"
  style?: React.CSSProperties
  onClick?: () => void
}

const COLOR_MAP: Record<StatColor, { accent: string; bg: string; iconBg: string; valueColor: string }> = {
  green:   { accent: 'var(--green)',   bg: 'var(--white)',   iconBg: 'var(--green-l)',  valueColor: 'var(--green-d)' },
  coral:   { accent: 'var(--coral)',   bg: 'var(--white)',   iconBg: 'var(--coral-l)',  valueColor: 'var(--coral)' },
  gold:    { accent: 'var(--gold)',    bg: 'var(--white)',   iconBg: 'var(--gold-l)',   valueColor: '#8a5c00' },
  teal:    { accent: 'var(--teal)',    bg: 'var(--white)',   iconBg: 'var(--teal-l)',   valueColor: 'var(--teal)' },
  magenta: { accent: 'var(--magenta)', bg: 'var(--white)',   iconBg: 'var(--mag-l)',    valueColor: 'var(--magenta)' },
  navy:    { accent: 'var(--navy)',    bg: 'var(--navy)',    iconBg: 'rgba(255,255,255,0.1)', valueColor: 'var(--white)' },
  default: { accent: 'var(--border)', bg: 'var(--white)',   iconBg: 'var(--bg2)',      valueColor: 'var(--ink)' },
}

const TREND_ICON = { up: '↑', down: '↓', neutral: '→' }
const TREND_COLOR = { up: 'var(--green-d)', down: 'var(--coral)', neutral: 'var(--ink3)' }

export function StatCard({
  label,
  value,
  icon,
  color = 'default',
  sublabel,
  trend,
  trendValue,
  style,
  onClick,
}: StatCardProps) {
  const { accent, bg, iconBg, valueColor } = COLOR_MAP[color]
  const isClickable = typeof onClick === 'function'
  const isNavy = color === 'navy'

  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => { if (isClickable) setHovered(true) }}
      onMouseLeave={() => { if (isClickable) setHovered(false) }}
      style={{
        background: bg,
        borderRadius: '16px',
        border: `1px solid ${isNavy ? 'transparent' : 'var(--border)'}`,
        borderTop: `3px solid ${accent}`,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'box-shadow 0.14s, transform 0.14s',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: isClickable && hovered ? 'translateY(-2px)' : undefined,
        ...style,
      }}
    >
      {/* Header: icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon && (
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '17px',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <p style={{
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: isNavy ? 'rgba(255,255,255,0.55)' : 'var(--ink3)',
          margin: 0,
        }}>
          {label}
        </p>
      </div>

      {/* Value */}
      <p style={{
        fontSize: '32px',
        fontWeight: 800,
        color: valueColor,
        margin: 0,
        lineHeight: 1,
      }}>
        {value}
      </p>

      {/* Sublabel / trend */}
      {(sublabel || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {trend && trendValue && (
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: TREND_COLOR[trend],
            }}>
              {TREND_ICON[trend]} {trendValue}
            </span>
          )}
          {sublabel && (
            <span style={{
              fontSize: '12px',
              color: isNavy ? 'rgba(255,255,255,0.45)' : 'var(--ink3)',
            }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
