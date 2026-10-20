'use client'

import { memo, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { IsoScene } from '@youj/illustrations/components/youj/graphics/iso-scene'
import { cn } from '@/lib/cn'
import type { CanvasHandle } from './canvas'
import { createPart, LATHE_LABELS, LATHE_PRESETS, PRISM_LABELS, PRISM_PRESETS, type PaletteKind, type Part } from '@youj/illustrations/builder'
import { partElement } from '@youj/illustrations/builder'

/* The parts palette: every shape the builder has, each drawn by the kit in
 * miniature. Drag one onto the floor (it shows where it will land, on
 * whatever is under it) or press it, or Enter, to add it in the middle of
 * the floor. One tab stop; the arrows move through it. */

interface Item {
  kind: PaletteKind
  label: string
}

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Shapes',
    items: [
      { kind: 'box', label: 'Box' },
      { kind: 'tile', label: 'Tile' },
      { kind: 'cylinder', label: 'Cylinder' },
      { kind: 'platform', label: 'Platform' },
    ],
  },
  { title: 'Prisms', items: PRISM_PRESETS.map((p) => ({ kind: `prism:${p}` as const, label: PRISM_LABELS[p] })) },
  {
    title: 'Lathes',
    items: [...LATHE_PRESETS.map((p) => ({ kind: `lathe:${p}` as const, label: LATHE_LABELS[p] })), { kind: 'pipe', label: 'Pipe' }],
  },
  {
    title: 'Utility',
    items: [
      { kind: 'screen', label: 'Screen' },
      { kind: 'crate', label: 'Crate' },
    ],
  },
]
const ITEMS = SECTIONS.flatMap((s) => s.items)
const COLUMNS = 4
/** The glyphs frame one small volume, so they share a scale. */
const GLYPH: readonly [number, number, number] = [2.6, 2.6, 1.9]

/** A palette part fitted into the glyph's volume. */
function glyphPart(kind: PaletteKind): Part {
  const part = { ...createPart(kind, 'glyph'), tone: kind === 'platform' ? ('sunken' as const) : ('raised' as const) }
  const fit = (v: number, max: number) => Math.min(v, max)
  if (part.type === 'cylinder' || part.type === 'lathe') {
    const r = fit(part.r, 1)
    return { ...part, r, h: fit(part.h, 1.7), x: GLYPH[0] / 2 - r, y: GLYPH[1] / 2 - r }
  }
  const w = fit(part.w, 2.4)
  const d = fit(part.d, 2.4)
  return { ...part, w, d, h: fit(part.h, 1.6), x: (GLYPH[0] - w) / 2, y: (GLYPH[1] - d) / 2 }
}

/** A part drawn small by the kit, as the canvas will draw it. */
export const PartGlyph = memo(function PartGlyph({ kind, className }: { kind: PaletteKind; className?: string }) {
  return (
    <IsoScene size={GLYPH} unit={12} pad={2} className={className}>
      {partElement(glyphPart(kind))}
    </IsoScene>
  )
})

export interface PaletteProps {
  canvas: RefObject<CanvasHandle | null>
  /** Adds a part: where it was dropped, or null to place it in the middle of the floor. */
  onAdd: (part: Part, dropped: boolean) => void
}

export function Palette({ canvas, onAdd }: PaletteProps) {
  const [active, setActive] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const chip = useRef<HTMLDivElement>(null)
  const press = useRef<{ pointer: number; x: number; y: number; kind: PaletteKind; dragging: boolean } | null>(null)
  // The click that ends a drag has already landed its part.
  const dropped = useRef(false)
  const [dragging, setDragging] = useState<PaletteKind | null>(null)

  const focus = (i: number) => {
    const next = Math.max(0, Math.min(ITEMS.length - 1, i))
    setActive(next)
    buttons.current[next]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNS, ArrowUp: -COLUMNS }
    if (e.key in moves) {
      e.preventDefault()
      focus(active + moves[e.key]!)
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      focus(e.key === 'Home' ? 0 : ITEMS.length - 1)
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, kind: PaletteKind) => {
    if (e.button !== 0) return
    dropped.current = false
    press.current = { pointer: e.pointerId, x: e.clientX, y: e.clientY, kind, dragging: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const p = press.current
    if (!p || p.pointer !== e.pointerId) return
    if (!p.dragging) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 4) return
      p.dragging = true
      setDragging(p.kind)
    }
    canvas.current?.dragOver(e.clientX, e.clientY, createPart(p.kind, 'new'))
    if (chip.current) chip.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`
  }

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>, cancel = false) => {
    const p = press.current
    if (!p || p.pointer !== e.pointerId) return
    press.current = null
    if (!p.dragging) return
    dropped.current = true
    setDragging(null)
    const landed = cancel ? null : (canvas.current?.dragOver(e.clientX, e.clientY, createPart(p.kind, 'new')) ?? null)
    canvas.current?.dragOver(0, 0, null)
    if (landed) onAdd(landed, true)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* One tab stop: the arrows move between the parts, Enter adds one. */}
      <div role="toolbar" aria-label="Parts" aria-orientation="horizontal" onKeyDown={onKeyDown} className="flex flex-col gap-2.5">
        {SECTIONS.map((section) => (
          <div key={section.title} role="group" aria-label={section.title} className="flex flex-col gap-0.5">
            <p aria-hidden className="px-0.5 text-[11px] font-medium text-fg-subtle">
              {section.title}
            </p>
            <div className="grid grid-cols-4 gap-0.5">
              {section.items.map((item) => {
                const index = ITEMS.indexOf(item)
                return (
                  <button
                    key={item.kind}
                    ref={(el) => {
                      buttons.current[index] = el
                    }}
                    type="button"
                    tabIndex={index === active ? 0 : -1}
                    aria-label={`Add ${item.label.toLowerCase()}`}
                    onFocus={() => setActive(index)}
                    onClick={() => {
                      if (dropped.current) {
                        dropped.current = false
                        return
                      }
                      onAdd(createPart(item.kind, 'new'), false)
                    }}
                    onPointerDown={(e) => onPointerDown(e, item.kind)}
                    onPointerMove={onPointerMove}
                    onPointerUp={(e) => onPointerUp(e)}
                    onPointerCancel={(e) => onPointerUp(e, true)}
                    className={cn(
                      'group/part flex h-16 min-w-0 touch-none flex-col items-center justify-center gap-0.5 rounded-lg border border-transparent px-0.5 pt-1 pb-1.5 select-none',
                      'text-[10.5px] text-fg-muted transition-[background-color,border-color,color] yj-duration-fast ease-standard',
                      'hover:border-line hover:bg-hover hover:text-fg focus-ring active:bg-hover',
                      dragging === item.kind && 'border-line bg-hover text-fg',
                    )}
                  >
                    <PartGlyph kind={item.kind} className="pointer-events-none !mx-0 h-9 w-auto max-w-full shrink-0" />
                    {/* Never squeezed by the column: a truncating label that shrinks clips its descenders. */}
                    <span className="max-w-full shrink-0 truncate leading-[1.35]">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {/* On the body: a fixed element inside the scrolling rail would be clipped by it. */}
      {dragging &&
        createPortal(
          <div
            ref={chip}
            aria-hidden
            className="pointer-events-none fixed top-0 left-0 z-50 flex items-center gap-1.5 rounded-md border border-line bg-surface/95 youj-allow-glass px-2 py-1 text-[11.5px] font-medium text-fg shadow-md backdrop-blur"
            style={{ transform: `translate(${(press.current?.x ?? 0) + 14}px, ${(press.current?.y ?? 0) + 14}px)` }}
          >
            <PartGlyph kind={dragging} className="!mx-0 h-5 w-auto" />
            {ITEMS.find((i) => i.kind === dragging)?.label}
          </div>,
          document.body,
        )}
    </div>
  )
}
