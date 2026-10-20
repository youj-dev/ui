import type { Gap, Guide, View } from './whiteboard-arrange'
import type { Box } from './whiteboard-model'

/* What the board draws over its shapes while you work: the selection's box
 * and its resize handles, the shape a connector would attach to, the snap's
 * guides and gap hints, and the marquee. Sizes are divided by the zoom so
 * they stay the same on screen. */

type Corner = 'nw' | 'ne' | 'sw' | 'se'

interface OverlayProps {
  view: View
  /** The shape under a connector being drawn. */
  target: Box | null
  selection: Box | null
  /** Several shapes selected: the box is dashed. */
  multiple: boolean
  handles: boolean
  snap: { guides: Guide[]; gaps: Gap[] } | null
  marquee: Box | null
}

function Overlay({ view, target, selection, multiple, handles, snap, marquee }: OverlayProps) {
  const px = (n: number) => n / view.k
  const handle = px(9)
  return (
    <svg aria-hidden data-slot="whiteboard-overlay" className="pointer-events-none absolute inset-0 z-3 size-full overflow-visible">
      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
        {target && (
          <rect
            data-slot="whiteboard-target"
            x={target.x - px(4)}
            y={target.y - px(4)}
            width={target.w + px(8)}
            height={target.h + px(8)}
            rx={px(6)}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={px(2)}
          />
        )}
        {selection && (
          <g data-slot="whiteboard-selection">
            <rect
              x={selection.x - px(4)}
              y={selection.y - px(4)}
              width={selection.w + px(8)}
              height={selection.h + px(8)}
              rx={px(2)}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={px(1.25)}
              strokeDasharray={multiple ? `${px(4)} ${px(3)}` : undefined}
              className="[[data-slot=whiteboard]:has([data-slot=whiteboard-shape]:focus-visible)_&]:stroke-focus"
            />
            {handles &&
              (['nw', 'ne', 'sw', 'se'] as Corner[]).map((c) => (
                <rect
                  key={c}
                  data-yj-handle={c}
                  x={(c.endsWith('w') ? selection.x - px(4) : selection.x + selection.w + px(4)) - handle / 2}
                  y={(c.startsWith('n') ? selection.y - px(4) : selection.y + selection.h + px(4)) - handle / 2}
                  width={handle}
                  height={handle}
                  rx={px(2)}
                  fill="var(--color-surface)"
                  stroke="var(--color-accent)"
                  strokeWidth={px(1.25)}
                  pointerEvents="all"
                  // youj-allow: physical side, a resize handle sits on the box's physical corner
                  className={c === 'nw' || c === 'se' ? 'cursor-nwse-resize' : 'cursor-nesw-resize'}
                />
              ))}
          </g>
        )}
        {snap?.guides.map((g, i) => (
          <path
            key={`g${i}`}
            data-slot="whiteboard-guide"
            d={g.axis === 'x' ? `M${g.at},${g.from}V${g.to}` : `M${g.from},${g.at}H${g.to}`}
            stroke="var(--color-danger)"
            strokeWidth={px(1)}
          />
        ))}
        {snap?.gaps.map((g, i) => {
          const mid = (g.from + g.to) / 2
          const text = `${Math.round(g.size)}`
          const w = px(text.length * 6.5 + 10)
          const h = px(16)
          const tick = px(4)
          const [cx, cy] = g.axis === 'x' ? [mid, g.at] : [g.at, mid]
          return (
            <g key={`s${i}`} data-slot="whiteboard-gap">
              <path
                d={
                  g.axis === 'x'
                    ? `M${g.from},${g.at}H${g.to}M${g.from},${g.at - tick}v${tick * 2}M${g.to},${g.at - tick}v${tick * 2}`
                    : `M${g.at},${g.from}V${g.to}M${g.at - tick},${g.from}h${tick * 2}M${g.at - tick},${g.to}h${tick * 2}`
                }
                stroke="var(--color-danger)"
                strokeWidth={px(1)}
              />
              <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={h / 2} fill="var(--color-danger)" />
              <text x={cx} y={cy + px(3.5)} textAnchor="middle" fontSize={px(10)} fill="var(--color-surface)" className="own:font-sans own:tabular-nums">
                {text}
              </text>
            </g>
          )
        })}
        {marquee && (
          <rect
            data-slot="whiteboard-marquee"
            x={marquee.x}
            y={marquee.y}
            width={marquee.w}
            height={marquee.h}
            fill="var(--color-accent-subtle)"
            stroke="var(--color-accent)"
            strokeWidth={px(1)}
            opacity={0.8}
          />
        )}
      </g>
    </svg>
  )
}

export { Overlay }
export type { Corner }
