import React from 'react'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  name?: string | null
  avatarUrl?: string | null
  emoji?: string | null
  size?: AvatarSize
  isOnline?: boolean
  country?: string | null
  style?: React.CSSProperties
}

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 52,
  xl: 72,
}

const FONT_SIZE: Record<AvatarSize, number> = {
  xs: 10,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 28,
}

const DOT_PX: Record<AvatarSize, number> = {
  xs: 7,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
}

// Deterministic color from name — cycles through brand palette
const PALETTE = [
  { bg: 'var(--teal)',    color: 'var(--white)' },
  { bg: 'var(--green)',   color: 'var(--navy)' },
  { bg: 'var(--gold)',    color: 'var(--navy)' },
  { bg: 'var(--magenta)', color: 'var(--white)' },
  { bg: 'var(--navy)',    color: 'var(--white)' },
  { bg: 'var(--coral)',   color: 'var(--white)' },
]

function initials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function paletteFor(name: string) {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % PALETTE.length
  return PALETTE[idx]
}

export function Avatar({
  name,
  avatarUrl,
  emoji,
  size = 'md',
  isOnline,
  style,
}: AvatarProps) {
  const px = SIZE_PX[size]
  const dotPx = DOT_PX[size]
  const { bg, color } = name ? paletteFor(name) : PALETTE[0]

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, ...style }}>
      <div
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          overflow: 'hidden',
          background: avatarUrl ? 'var(--bg2)' : bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: FONT_SIZE[size],
          fontWeight: 700,
          color,
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name ?? 'avatar'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : emoji ? (
          <span style={{ fontSize: FONT_SIZE[size] + 2 }}>{emoji}</span>
        ) : name ? (
          initials(name)
        ) : (
          '?'
        )}
      </div>

      {isOnline !== undefined && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: dotPx,
            height: dotPx,
            borderRadius: '50%',
            background: isOnline ? 'var(--green)' : 'var(--ink4)',
            border: '2px solid var(--white)',
          }}
        />
      )}
    </div>
  )
}

// ── Group of overlapping avatars ──────────────────────────────

interface AvatarGroupProps {
  members: Array<{ name?: string | null; avatarUrl?: string | null; emoji?: string | null }>
  max?: number
  size?: AvatarSize
}

export function AvatarGroup({ members, max = 4, size = 'sm' }: AvatarGroupProps) {
  const px = SIZE_PX[size]
  const shown = members.slice(0, max)
  const overflow = members.length - max

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((m, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -(px * 0.28), zIndex: shown.length - i }}>
          <Avatar
            name={m.name ?? undefined}
            avatarUrl={m.avatarUrl ?? undefined}
            emoji={m.emoji ?? undefined}
            size={size}
            style={{ border: '2px solid var(--white)', borderRadius: '50%' }}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            marginLeft: -(px * 0.28),
            width: px,
            height: px,
            borderRadius: '50%',
            background: 'var(--bg2)',
            border: '2px solid var(--white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: FONT_SIZE[size] - 2,
            fontWeight: 700,
            color: 'var(--ink3)',
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
