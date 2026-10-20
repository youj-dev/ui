import type { CSSProperties } from 'react'

/* The palette, from the theme's tokens. `--yj-dark` (0 light, 1 dark) picks
 * each mix, so the truck reads as a truck in both schemes: a pale body on the
 * light page and a lifted gray one on the dark, with its rubber, glass and
 * frame always darker than the body, never inverted into pale tires. */
const SHADE = 'color-mix(in oklab, var(--color-fg) calc(100% - 100% * var(--yj-dark)), var(--color-canvas))'
const LIGHT = 'color-mix(in oklab, var(--color-surface) calc(100% - 100% * var(--yj-dark)), var(--color-fg))'
const PALETTE = {
  '--truck-body': 'color-mix(in oklab, var(--color-fg) calc(1.5% + 15.5% * var(--yj-dark)), var(--color-surface))',
  '--truck-panel': 'color-mix(in oklab, var(--color-fg) calc(7% + 4% * var(--yj-dark)), var(--color-surface))',
  '--truck-line': 'color-mix(in oklab, var(--color-fg) calc(24% + 4% * var(--yj-dark)), transparent)',
  '--truck-rib': 'color-mix(in oklab, var(--color-fg) 8%, transparent)',
  '--truck-rubber': `color-mix(in oklab, ${SHADE} calc(86% + 14% * var(--yj-dark)), var(--color-surface))`,
  '--truck-frame': `color-mix(in oklab, ${SHADE} calc(72% + 10% * var(--yj-dark)), var(--color-surface))`,
  '--truck-rim': 'color-mix(in oklab, var(--color-fg) calc(26% + 22% * var(--yj-dark)), var(--color-surface))',
  '--truck-glass': `color-mix(in oklab, var(--color-accent) 18%, ${SHADE})`,
  '--truck-glint': `color-mix(in oklab, ${LIGHT} calc(30% - 12% * var(--yj-dark)), transparent)`,
  '--truck-shadow': `color-mix(in oklab, ${SHADE} calc(14% + 46% * var(--yj-dark)), transparent)`,
} as CSSProperties

const body = 'fill-(--truck-body) stroke-(--truck-line)'
const panel = 'fill-(--truck-panel) stroke-(--truck-line)'

/** A tire on its rim and hub, with its contact shadow. */
function Wheel({ cx }: { cx: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={247} rx={30} ry={3.5} className="fill-(--truck-shadow)" />
      <circle cx={cx} cy={221} r={25} className="fill-(--truck-rubber) stroke-(--truck-line)" strokeWidth={1} />
      <circle cx={cx} cy={221} r={14.5} className="fill-(--truck-rim)" />
      <circle cx={cx} cy={221} r={14.5} fill="none" className="stroke-(--truck-frame)" strokeWidth={1.5} strokeDasharray="2 3.07" />
      <circle cx={cx} cy={221} r={5} className="fill-(--truck-frame)" />
    </g>
  )
}

/**
 * A reefer rig in side elevation, cab to the start: the tractor with its
 * deflector, glass, mirror and tank, the refrigerated trailer with its unit,
 * ribs, skirt and landing gear, and Lanefield's accent stripe along both.
 * Drawn in the theme's tones, for the annotated vehicle.
 */
export function TruckArt() {
  return (
    <svg viewBox="0 0 720 270" role="img" aria-label="Reefer truck TR-5531, side view" className="block h-auto w-full" style={PALETTE}>
      <ellipse cx={372} cy={248} rx={350} ry={6} className="fill-(--truck-shadow)" />

      {/* Trailer: the box, its rail, ribs, skirt, rear frame and the reefer unit on its nose. */}
      <rect x={236} y={40} width={468} height={146} rx={7} className={body} strokeWidth={1.25} />
      <rect x={236} y={40} width={468} height={10} rx={5} className="fill-(--truck-glint)" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={276 + i * 36} x2={276 + i * 36} y1={50} y2={178} className="stroke-(--truck-rib)" strokeWidth={1.5} />
      ))}
      <rect x={236} y={148} width={468} height={5} className="fill-accent" />
      <rect x={236} y={156} width={468} height={1.5} className="fill-accent-line" />
      <g className="fill-accent">
        <path d="M262 106 L272 76 L277 76 L268 106 Z" />
        <path d="M290 106 L281 76 L286 76 L296 106 Z" />
        <circle cx={279} cy={101} r={3} />
      </g>
      <text x={306} y={98} fontSize={19} fontWeight={600} letterSpacing="0.22em" className="fill-fg-subtle font-sans">
        LANEFIELD
      </text>
      <text x={688} y={140} textAnchor="end" fontSize={11} letterSpacing="0.08em" className="fill-line-strong font-mono">
        TR-5531
      </text>
      <rect x={694} y={40} width={10} height={146} rx={3} className="fill-(--truck-panel)" />
      <rect x={696} y={166} width={6} height={12} rx={1.5} className="fill-danger" />
      <rect x={240} y={186} width={460} height={9} rx={2} className="fill-(--truck-frame)" />
      <rect x={334} y={196} width={226} height={18} rx={4} className={panel} strokeWidth={1} />
      <rect x={318} y={195} width={6} height={33} className="fill-(--truck-frame)" />
      <rect x={312} y={227} width={18} height={4} rx={1.5} className="fill-(--truck-frame)" />
      <rect x={688} y={198} width={7} height={38} rx={1.5} className="fill-(--truck-frame)" />
      <rect x={214} y={54} width={22} height={74} rx={4} className={panel} strokeWidth={1} />
      {[66, 76, 86, 96, 106, 116].map((y) => (
        <line key={y} x1={219} x2={231} y1={y} y2={y} className="stroke-(--truck-line)" strokeWidth={1.5} strokeLinecap="round" />
      ))}

      {/* Tractor frame, fifth wheel and fuel tank. */}
      <rect x={40} y={186} width={214} height={12} rx={2} className="fill-(--truck-frame)" />
      <rect x={196} y={179} width={50} height={8} rx={2} className="fill-(--truck-frame)" />
      <rect x={120} y={186} width={58} height={26} rx={7} className="fill-(--truck-rim) stroke-(--truck-line)" strokeWidth={1} />
      <line x1={136} x2={136} y1={187} y2={211} className="stroke-(--truck-line)" strokeWidth={1.5} />
      <line x1={162} x2={162} y1={187} y2={211} className="stroke-(--truck-line)" strokeWidth={1.5} />

      {/* Cab: deflector, body with its wheel arch, glass, door, steps, bumper and mirror. */}
      <path d="M72 62 C 100 50 130 42 162 40 L 168 40 Q 171 40 171 43 L 171 64 L 72 64 Z" className={body} strokeWidth={1.25} />
      <path d="M38 206 L 38 98 Q 38 82 46 72 L 52 66 Q 57 62 66 62 L 160 62 Q 166 62 166 68 L 166 206 L 115 206 A 31 31 0 0 0 61 206 Z" className={body} strokeWidth={1.25} />
      <path d="M61 206 A 31 31 0 0 1 115 206 Z" className="fill-(--truck-frame)" />
      <rect x={38} y={148} width={128} height={5} className="fill-accent" />
      <rect x={38} y={156} width={128} height={1.5} className="fill-accent-line" />
      <path d="M50 86 L 56 78 Q 59 75 64 75 L 104 75 L 104 120 L 47 120 Q 45 120 45 117 L 45 95 Q 45 90 50 86 Z" className="fill-(--truck-glass)" />
      <path d="M66 75 L 80 75 L 58 120 L 47 120 Z" className="fill-(--truck-glint)" />
      <path d="M112 76 L 150 76 Q 154 76 154 80 L 154 104 L 112 104 Z" className="fill-(--truck-glass)" />
      <rect x={53} y={70} width={58} height={128} rx={5} fill="none" className="stroke-(--truck-line)" strokeWidth={1.25} />
      <rect x={96} y={130} width={10} height={3} rx={1.5} className="fill-(--truck-frame)" />
      <rect x={122} y={172} width={30} height={4} rx={1.5} className="fill-(--truck-frame)" />
      <rect x={34} y={174} width={10} height={34} rx={2.5} className={panel} strokeWidth={1} />
      <rect x={33} y={160} width={8} height={9} rx={2} className="fill-warning" />
      {[108, 118, 128, 138].map((y) => (
        <line key={y} x1={39} x2={44} y1={y} y2={y} className="stroke-(--truck-line)" strokeWidth={1.5} strokeLinecap="round" />
      ))}
      <path d="M46 84 L 30 88" fill="none" className="stroke-(--truck-frame)" strokeWidth={2.5} strokeLinecap="round" />
      <rect x={21} y={80} width={10} height={30} rx={3} className="fill-(--truck-frame)" />

      {[88, 214, 604, 660].map((cx) => (
        <Wheel key={cx} cx={cx} />
      ))}
    </svg>
  )
}
