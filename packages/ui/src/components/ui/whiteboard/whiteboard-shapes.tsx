'use client'

import { memo, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../../lib/utils'
import {
  COLORS,
  EMBED_TITLE,
  FONT_SIZES,
  LABEL_FONT,
  PAPER,
  STICKY,
  WIDTHS,
  arrowHead,
  connectorPath,
  labelBox,
  penPath,
  stickyLayout,
  type Connector,
  type WhiteboardEmbed,
  type Point,
  type Sticky,
  type WhiteboardShape,
} from './whiteboard-model'

/* How each shape draws on screen. Drawings (pen, lines, boxes, text and
 * connectors) are SVG on the board's canvas; sticky notes and embeds are
 * HTML on the layer above it, so a note wraps its text and an embed holds
 * any React node. Both layers take the same view transform. */

/** One drawing, its color a theme role. Memoized: panning and zooming re-render the board, not its shapes. */
const ShapeView = memo(function ShapeView({ shape, route }: { shape: WhiteboardShape; route?: { points: Point[]; mid: Point } | null }) {
  const stroke = COLORS[shape.color ?? 'ink']
  const line = { fill: 'none', stroke, strokeWidth: WIDTHS[shape.width ?? 'medium'], strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  switch (shape.type) {
    case 'pen':
      return <path d={penPath(shape)} fill={stroke} />
    case 'line':
      return <path d={`M${shape.x1},${shape.y1}L${shape.x2},${shape.y2}`} {...line} />
    case 'arrow':
      return <path d={`M${shape.x1},${shape.y1}L${shape.x2},${shape.y2}${arrowHead(shape)}`} {...line} />
    case 'rectangle':
      return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={Math.min(8, shape.w / 4, shape.h / 4)} {...line} />
    case 'ellipse':
      return <ellipse cx={shape.x + shape.w / 2} cy={shape.y + shape.h / 2} rx={shape.w / 2} ry={shape.h / 2} {...line} />
    case 'text': {
      const size = FONT_SIZES[shape.width]
      return (
        <text x={shape.x} y={shape.y} fill={stroke} fontSize={size} className="font-sans">
          {shape.text.split('\n').map((l, i) => (
            <tspan key={i} x={shape.x} dy={i ? size * 1.25 : size}>
              {l}
            </tspan>
          ))}
        </text>
      )
    }
    case 'connector':
      return route ? <ConnectorView shape={shape} points={route.points} mid={route.mid} /> : null
    default:
      return null
  }
})

/** A connector: its line and head, a wide invisible stroke that makes it easy to pick, and its label in a pill. */
function ConnectorView({ shape, points, mid }: { shape: Connector; points: Point[]; mid: Point }) {
  const d = connectorPath(shape, points)
  const label = shape.label && labelBox(shape.label, mid)
  return (
    <>
      <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
      <path d={d} fill="none" stroke={COLORS[shape.color]} strokeWidth={WIDTHS[shape.width]} strokeLinecap="round" strokeLinejoin="round" />
      {label && (
        <g data-slot="whiteboard-connector-label">
          <rect x={label.x} y={label.y} width={label.w} height={label.h} rx={label.h / 2} fill="var(--color-surface)" stroke="var(--color-line)" />
          <text x={mid[0]} y={mid[1] + LABEL_FONT * 0.35} textAnchor="middle" fontSize={LABEL_FONT} fill="var(--color-fg-muted)" className="font-sans">
            {shape.label}
          </text>
        </g>
      )}
    </>
  )
}

interface OptionProps {
  /** The option's accessible name. */
  name: string
  selected: boolean
  tabStop: boolean
  hidden?: boolean
  /** The board's handlers, one stable object, so a note or a title re-renders only when it changes. */
  handlers: OptionHandlers
}

interface OptionHandlers {
  focus: (id: string) => void
  keyDown: (e: KeyboardEvent<Element>, id: string) => void
  /** Keeps the option's element, to move focus to it. */
  register: (id: string, el: Element | null) => void
}

const boxStyle = (x: number, y: number, w: number, h: number): CSSProperties => ({ transform: `translate(${x}px, ${y}px)`, width: w, height: h })

/** A sticky note: the soft paper of its color, its text wrapping and the note growing to fit it. */
const StickyView = memo(function StickyView({ shape, name, selected, tabStop, hidden, handlers }: OptionProps & { shape: Sticky }) {
  const { box } = stickyLayout(shape)
  return (
    <div
      ref={(el) => handlers.register(shape.id, el)}
      role="option"
      data-slot="whiteboard-shape"
      data-yj-shape="sticky"
      data-selected={selected || undefined}
      aria-label={name}
      aria-selected={selected}
      tabIndex={tabStop ? 0 : -1}
      onFocus={() => handlers.focus(shape.id)}
      onKeyDown={(e) => handlers.keyDown(e, shape.id)}
      // youj-allow: physical side, the note sits at its world position
      className="absolute top-0 left-0 own:rounded-md shadow-xs outline-none"
      style={{
        ...boxStyle(box.x, box.y, box.w, box.h),
        background: PAPER[shape.color],
        padding: STICKY.pad,
        fontSize: STICKY.font,
        lineHeight: STICKY.line,
        visibility: hidden ? 'hidden' : undefined,
      }}
    >
      <p className="own:m-0 own:font-sans whitespace-pre-wrap own:text-fg [overflow-wrap:anywhere]">{shape.text}</p>
    </div>
  )
})

/** An embed's title: the option that names, selects and moves the frame. Its content sits on a layer of its own (EmbedContent), outside the list of shapes, so it keeps its own roles, pointer and keyboard. */
const EmbedTitle = memo(function EmbedTitle({ shape, name, selected, tabStop, handlers }: OptionProps & { shape: WhiteboardEmbed }) {
  return (
    <div
      ref={(el) => handlers.register(shape.id, el)}
      role="option"
      data-slot="whiteboard-shape"
      data-yj-shape="embed"
      data-selected={selected || undefined}
      aria-label={name}
      aria-selected={selected}
      tabIndex={tabStop ? 0 : -1}
      onFocus={() => handlers.focus(shape.id)}
      onKeyDown={(e) => handlers.keyDown(e, shape.id)}
      // youj-allow: physical side, the title sits at its world position
      className="absolute top-0 left-0 own:flex items-center own:gap-1.5 own:px-1 own:text-ui-sm own:text-fg-muted outline-none select-none"
      style={boxStyle(shape.x, shape.y, shape.w, EMBED_TITLE)}
    >
      <span aria-hidden className={cn('size-1.5 shrink-0 own:rounded-full', selected ? 'own:bg-accent' : 'own:bg-fg-subtle')} />
      <span className="truncate">{shape.title}</span>
    </div>
  )
})

/** An embed's content: the app's node, filling the frame under its title. */
function EmbedContent({ shape, label, children }: { shape: WhiteboardEmbed; label: string; children: ReactNode }) {
  return (
    <section
      aria-label={label}
      data-slot="whiteboard-embed-content"
      // youj-allow: physical side, the content sits at its world position
      className="absolute top-0 left-0 own:flex flex-col own:[&>*]:min-h-0 own:[&>*]:flex-1"
      style={boxStyle(shape.x, shape.y + EMBED_TITLE, shape.w, Math.max(0, shape.h - EMBED_TITLE))}
    >
      {children}
    </section>
  )
}

export { EmbedContent, EmbedTitle, ShapeView, StickyView }
export type { OptionHandlers }
