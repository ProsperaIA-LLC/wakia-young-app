import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'navy' | 'magenta' | 'teal'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--green)',
    color: 'var(--navy)',
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--ink)',
    border: '1.5px solid var(--border)',
  },
  danger: {
    background: 'var(--coral)',
    color: 'var(--white)',
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink2)',
    border: 'none',
  },
  navy: {
    background: 'var(--navy)',
    color: 'var(--white)',
    border: 'none',
  },
  magenta: {
    background: 'var(--magenta)',
    color: 'var(--white)',
    border: 'none',
  },
  teal: {
    background: 'var(--teal)',
    color: 'var(--white)',
    border: 'none',
  },
}

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '7px 14px', fontSize: '13px', fontWeight: 600 },
  md: { padding: '10px 20px', fontSize: '14px', fontWeight: 700 },
  lg: { padding: '14px 28px', fontSize: '15px', fontWeight: 800 },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false)

  const hoverMap: Partial<Record<ButtonVariant, React.CSSProperties>> = {
    primary:   { background: 'var(--green-d)' },
    secondary: { background: 'var(--bg2)' },
    danger:    { opacity: '0.88' } as React.CSSProperties,
    ghost:     { background: 'var(--bg2)' },
    navy:      { background: 'var(--navy2)' },
    magenta:   { opacity: '0.88' } as React.CSSProperties,
    teal:      { opacity: '0.88' } as React.CSSProperties,
  }

  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      onMouseEnter={e => { setHovered(true); onMouseEnter?.(e) }}
      onMouseLeave={e => { setHovered(false); onMouseLeave?.(e) }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        borderRadius: '10px',
        fontFamily: 'inherit',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        transition: 'background 0.14s, opacity 0.14s',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : undefined,
        boxSizing: 'border-box',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...(hovered && !isDisabled ? hoverMap[variant] : {}),
        ...style,
      }}
      {...props}
    >
      {loading ? <span style={{ opacity: 0.7 }}>Cargando…</span> : children}
    </button>
  )
}
