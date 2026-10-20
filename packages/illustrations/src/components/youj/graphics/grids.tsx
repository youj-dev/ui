'use client'

import { useId, type CSSProperties, type SVGProps } from 'react'
import { cn } from '@youj/core'
import { boxExtent, project } from './iso'
import { useIsoScene, type IsoShape } from './iso-scene'

/* Drafting paper for graphics to stand on, drawn from the tokens: a dot
 * grid, a line grid with major lines and registration crosses, and an
 * isometric grid whose rhombi match IsoScene's floor. Each fills its nearest
 * positioned ancestor, sits behind the content and fades toward its edges
 * (`fade`), so it reads as a surface rather than a pattern stamped on one.
 * Static: nothing here moves, so there's nothing for reduced motion to stop.
 * Decorative: aria-hidden, and it ignores the pointer. */

export type GridFade = 'none' | 'edges' | 'radial'

interface GridProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Distance between grid points or lines, CSS px. */
  gap?: number
  /** Fade out toward the edges ('edges'), from the center ('radial'), or not at all. Default 'radial'. */
  fade?: GridFade
  className?: string
  style?: CSSProperties
}

const MASKS: Record<GridFade, string | undefined> = {
  none: undefined,
  edges: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent), linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)',
  radial: 'radial-gradient(ellipse 72% 68% at 50% 50%, black 30%, transparent 100%)',
}

/** The <svg> every backdrop is: full-bleed, behind, masked toward its edges. */
function Backdrop({ fade = 'radial', className, style, children, slot, ...rest }: GridProps & { slot: string }) {
  const mask = MASKS[fade]
  return (
    <svg
      aria-hidden
      focusable="false"
      data-slot={slot}
      className={cn('pointer-events-none absolute inset-0 -z-10 size-full', className)}
      style={{ maskImage: mask, WebkitMaskImage: mask, maskComposite: fade === 'edges' ? 'intersect' : undefined, WebkitMaskComposite: fade === 'edges' ? 'source-in' : undefined, ...style }}
      {...rest}
    >
      {children}
    </svg>
  )
}

const safeId = (id: string) => `kg-${id.replace(/[^\w-]/g, '')}`

export interface DotGridProps extends GridProps {
  /** Dot radius, CSS px. Default 1. */
  size?: number
}

/** Dots on a square grid. */
export function DotGrid({ gap = 16, size = 1, ...props }: DotGridProps) {
  const id = safeId(useId())
  return (
    <Backdrop slot="dot-grid" {...props}>
      <defs>
        <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
          <circle cx={gap / 2} cy={gap / 2} r={size} style={{ fill: 'color-mix(in oklab, var(--color-fg) 20%, transparent)' }} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </Backdrop>
  )
}

export interface LineGridProps extends GridProps {
  /** A stronger line every this many cells, with a registration cross where two meet; 0 for none. Default 4. */
  major?: number
}

/** Hairlines on a square grid, stronger every few cells, with small crosses where the strong ones meet. */
export function LineGrid({ gap = 24, major = 4, ...props }: LineGridProps) {
  const id = safeId(useId())
  const span = gap * (major || 1)
  const cells = major || 1
  const minor = 'color-mix(in oklab, var(--color-fg) 7%, transparent)'
  const strong = 'color-mix(in oklab, var(--color-fg) 13%, transparent)'
  const cross = 'color-mix(in oklab, var(--color-fg) 34%, transparent)'
  const arm = Math.min(5, gap / 3)
  return (
    <Backdrop slot="line-grid" {...props}>
      <defs>
        <pattern id={id} width={span} height={span} patternUnits="userSpaceOnUse">
          {Array.from({ length: cells }, (_, i) => (
            <g key={i} style={{ stroke: i === 0 && major ? strong : minor, strokeWidth: 1 }}>
              <line x1={i * gap + 0.5} y1={0} x2={i * gap + 0.5} y2={span} />
              <line x1={0} y1={i * gap + 0.5} x2={span} y2={i * gap + 0.5} />
            </g>
          ))}
          {major > 0 && (
            <path d={`M${0.5 - arm},0.5 H${0.5 + arm} M0.5,${0.5 - arm} V${0.5 + arm}`} style={{ stroke: cross, strokeWidth: 1 }} />
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </Backdrop>
  )
}

/** An isometric grid: the same rhombi as IsoScene's floor, one grid unit every `gap` px. */
export function IsoGrid({ gap = 24, ...props }: GridProps) {
  const id = safeId(useId())
  const [w, h] = [gap * Math.sqrt(3), gap]
  const line = 'color-mix(in oklab, var(--color-fg) 8%, transparent)'
  return (
    <Backdrop slot="iso-grid" {...props}>
      <defs>
        <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
          <path d={`M0,${h / 2} L${w / 2},0 L${w},${h / 2} L${w / 2},${h} Z`} style={{ fill: 'none', stroke: line, strokeWidth: 1 }} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </Backdrop>
  )
}

export interface IsoFloorProps {
  /** The floor's extent in grid units, from the origin. */
  w: number
  d: number
  /** Grid spacing in grid units. Default 1. */
  step?: number
  /** Draw lines, or dots at the crossings. Default 'lines'. */
  kind?: 'lines' | 'dots'
  className?: string
}

/** The scene's own floor grid at z = 0, in its units, so shapes line up with it. Draw it first, under the shapes. */
function IsoFloorImpl({ w, d, step = 1, kind = 'lines', className }: IsoFloorProps) {
  const { unit } = useIsoScene()
  const ink = 'color-mix(in oklab, var(--color-fg) 9%, transparent)'
  if (kind === 'dots') {
    const dots: [number, number][] = []
    for (let x = 0; x <= w + 1e-6; x += step) for (let y = 0; y <= d + 1e-6; y += step) dots.push(project(x, y, 0, unit) as [number, number])
    return (
      <g data-slot="iso-floor" className={className} style={{ fill: 'color-mix(in oklab, var(--color-fg) 22%, transparent)' }}>
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.1} className="kg-dot" />
        ))}
      </g>
    )
  }
  const lines: [number, number, number, number][] = []
  for (let x = 0; x <= w + 1e-6; x += step) lines.push([...project(x, 0, 0, unit), ...project(x, d, 0, unit)] as [number, number, number, number])
  for (let y = 0; y <= d + 1e-6; y += step) lines.push([...project(0, y, 0, unit), ...project(w, y, 0, unit)] as [number, number, number, number])
  return (
    <g data-slot="iso-floor" className={className ? `kg-line ${className}` : 'kg-line'} style={{ stroke: ink }}>
      {lines.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="kg-line" />
      ))}
    </g>
  )
}

export const IsoFloor = Object.assign(IsoFloorImpl, {
  isoFit: ({ w, d }: IsoFloorProps, unit: number) => boxExtent({ x: 0, y: 0, z: 0, w, d, h: 0 }, unit),
}) as IsoShape<IsoFloorProps>
