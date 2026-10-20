import type { CSSProperties } from 'react'

/**
 * The canvas: youj's graphite (or whichever theme is active), a fine dot
 * grid that fades toward the edges, and a soft accent glow that can sit
 * behind whatever is in focus. All semantic tokens, so it re-themes.
 */
export function Backdrop({
  grid = 1,
  glow = 0,
  glowAt = { x: 50, y: 42 },
  className,
  style,
}: {
  grid?: number
  glow?: number
  glowAt?: { x: number; y: number }
  className?: string
  style?: CSSProperties
}) {
  const dots: CSSProperties = {
    opacity: grid,
    backgroundImage: 'radial-gradient(color-mix(in oklab, var(--color-fg) 22%, transparent) 0.7px, transparent 0.8px)',
    backgroundSize: '16px 16px',
    backgroundPosition: 'center',
    maskImage: 'radial-gradient(ellipse 70% 70% at 50% 45%, black 20%, transparent 80%)',
  }
  const light: CSSProperties = {
    opacity: glow,
    background: `radial-gradient(ellipse 38% 34% at ${glowAt.x}% ${glowAt.y}%, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent 70%)`,
  }
  return (
    <div aria-hidden className={`absolute inset-0 bg-canvas ${className ?? ''}`} style={style}>
      <div className="absolute inset-0" style={dots} />
      <div className="absolute inset-0" style={light} />
    </div>
  )
}
