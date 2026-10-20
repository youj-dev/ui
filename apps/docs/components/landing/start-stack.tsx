'use client'

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useInView, useMotionValue } from 'motion/react'
import { useYouj } from '@youj/core'
import { LayerStack, type StackLayer } from '@/components/graphics/stack/layer-stack'
import { Path } from '@/components/landing/start-path'
import { Segmented } from '@/components/ui/controls'
import { cn } from '@/lib/cn'

/* Get started, drawn in the hero's language: the kit as a stack of planes,
 * one per package entry, @youj/react on top. All of it is every plane,
 * full. Just what you need is the same stack ghosted, with the piece and
 * exactly what it brings lifted off their planes.
 *
 * They move only when asked, never in a loop: each stack opens out of a
 * near-flat pile the first time it's in view (the `settle` spring, the piece
 * a beat after the kit); pointing at a plane or its label lifts it; and
 * picking another piece raises its tiles off their planes while the ones the
 * pieces share glide to their new slots. Reduced motion shows the stacks
 * open and swaps tiles in place. */

export interface Plane {
  id: string
  /** The label beside the plane: "Icons". */
  name: string
  /** The package entry, printed on the plane: "@youj/icons". */
  entry: string
  /** What the plane holds, beside the whole kit: "animated icons". */
  holds: string
}

export interface Piece {
  name: string
  /** The piece and everything it brings, by plane id, the piece first. */
  items: Record<string, string[]>
  /** What it brings, in the order the install reaches them. */
  brings: string[]
}

const PLANE = { w: 272, h: 160 }
/** A plane is a 4 × 4 grid of cells; a named tile takes two, a short name one. */
const CELLS = 16
/** Widths of the placeholder lines in the whole kit's cells, so the planes read as full of different things. */
const LINES = [62, 44, 74, 52, 38, 68, 56, 46]

function Board({ entry, ghost, children }: { entry: string; ghost?: boolean; children: ReactNode }) {
  // The entry is printed along the near edge, the part of a plane the one above it leaves in view.
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col gap-2.5 rounded-2xl border p-3 [transform-style:preserve-3d]',
        ghost ? 'border-dashed border-line-strong bg-band' : 'border-line-strong bg-surface shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-canvas)_60%,transparent)]',
      )}
    >
      <div className="grid flex-1 grid-flow-row-dense grid-cols-4 grid-rows-4 gap-1.5 [transform-style:preserve-3d]">{children}</div>
      <p className={cn('font-sans text-[10px] leading-3', ghost ? 'text-fg-subtle' : 'text-fg-muted')}>
        <span dir="ltr">{entry}</span>
      </p>
    </div>
  )
}

const cellsFor = (name: string, piece: boolean) => (piece || name.length > 6 ? 2 : 1)

/** How far open a stack is before it's first in view. */
const PILED = 0.3

/** The stack's separation: piled until it's first in view, then open on the `settle` spring, once. */
function useOpening(order: number) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const explode = useMotionValue(k.reduced ? 1 : PILED)
  const inView = useInView(ref, { once: true, amount: 0.35 })
  useEffect(() => {
    if (k.reduced) return explode.set(1)
    if (!inView) return
    const controls = animate(explode, 1, { ...k.spring('settle'), delay: order * k.stagger('loose') * 2 })
    return () => controls.stop()
  }, [inView, k.reduced])
  return { ref, explode }
}

/** One of the piece's items, lifted off its plane: the tile floats above the slot it came from, over its shadow. They
 * take a plane's near rows, below where the plane above crosses it, so nothing is drawn over their names. */
function Lifted({ name, piece }: { name: string; piece: boolean }) {
  const k = useYouj()
  const ref = useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const slot = useRef<{ x: number; y: number } | null>(null)
  // A tile the next piece keeps glides from its old slot to its new one, from wherever it is (so a quick re-pick
  // never jumps). Its slot is read in the plane's own, untipped layout, so the glide follows the plane.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const next = { x: el.offsetLeft, y: el.offsetTop }
    const last = slot.current
    slot.current = next
    if (!last || (last.x === next.x && last.y === next.y) || k.reduced) return
    x.set(x.get() + last.x - next.x)
    y.set(y.get() + last.y - next.y)
    animate(x, 0, k.spring('smooth'))
    animate(y, 0, k.spring('smooth'))
  })
  return (
    <motion.span
      ref={ref}
      data-lifted={name}
      style={{ x, y }}
      className={cn('relative rounded-md border border-dashed border-line-strong [transform-style:preserve-3d]', cellsFor(name, piece) === 2 && 'col-span-2')}
    >
      <span className="absolute inset-0.5 rounded-md bg-well blur-[3px]" />
      {/* A tile that arrives rises off its plane. */}
      <motion.span
        initial={k.reduced ? false : { z: 0, opacity: 0 }}
        animate={{ z: piece ? 22 : 14, opacity: 1 }}
        transition={k.spring('settle')}
        className={cn(
          'absolute -inset-px flex items-center gap-1.5 rounded-md border bg-surface px-2 font-sans text-[10px] text-fg shadow-sm',
          piece ? 'border-accent' : 'border-fg-subtle',
        )}
      >
        {piece && <span className="particle size-[5px]" />}
        <span dir="ltr" className="min-w-0 truncate">
          {name}
        </span>
      </motion.span>
    </motion.span>
  )
}

/** The whole kit: every plane full. */
export function KitStack({ planes, label }: { planes: Plane[]; label: string }) {
  const { ref, explode } = useOpening(0)
  const layers = useMemo<StackLayer[]>(
    () =>
      planes.map((plane) => ({
        id: plane.id,
        name: plane.name,
        detail: plane.holds,
        sheet: false,
        content: (
          <Board entry={plane.entry}>
            {Array.from({ length: CELLS }, (_, i) => (
              <span key={i} className="flex items-center rounded-md border border-line bg-canvas px-1.5">
                <span className="h-1 rounded-full bg-fg-subtle" style={{ width: `${LINES[(i * 3 + plane.id.length) % LINES.length]}%` }} />
              </span>
            ))}
          </Board>
        ),
      })),
    [planes],
  )
  return (
    <div ref={ref} role="img" aria-label={label}>
      <LayerStack layers={layers} explode={explode} width={PLANE.w} height={PLANE.h} gap={76} live={false} raise />
    </div>
  )
}

/** The same stack, ghosted, with the piece and what it brings lifted off their planes. */
export function PieceStack({ planes, piece }: { planes: Plane[]; piece: Piece }) {
  const { ref, explode } = useOpening(1)
  const layers = useMemo<StackLayer[]>(
    () =>
      planes.map((plane) => {
        const taken = piece.items[plane.id] ?? []
        const used = taken.reduce((sum, name) => sum + cellsFor(name, name === piece.name), 0)
        return {
          id: plane.id,
          name: plane.name,
          detail: taken.length ? taken.join(' · ') : 'left out',
          sheet: false,
          depth: taken.length > 0,
          content: (
            <Board entry={plane.entry} ghost>
              {Array.from({ length: CELLS - used }, (_, i) => (
                <span key={i} className="rounded-md border border-line-subtle" />
              ))}
              {taken.map((name) => (
                <Lifted key={name} name={name} piece={name === piece.name} />
              ))}
            </Board>
          ),
        }
      }),
    [planes, piece],
  )
  const brings = piece.brings.length ? piece.brings.join(', ') : 'nothing more'
  return (
    <>
      <div ref={ref} role="img" aria-label={`${piece.name} brings ${brings}, and nothing else from the kit`}>
        <LayerStack layers={layers} explode={explode} width={PLANE.w} height={PLANE.h} gap={76} live={false} raise />
      </div>
      {/* A small stage keeps only the planes' names beside the stack, so the tiles' names are spelled out under it. */}
      <p aria-hidden className="px-4 pb-4 text-center type-label md:hidden">
        <span className="text-fg">{piece.name}</span> brings{' '}
        {piece.brings.length
          ? piece.brings.map((name, i) => (
              <Fragment key={name}>
                <span className="whitespace-nowrap">
                  {name}
                  {i < piece.brings.length - 1 && ','}
                </span>{' '}
              </Fragment>
            ))
          : 'nothing more'}
      </p>
    </>
  )
}

/** A piece's name without its kind (`icon-bell` is "bell"), so four fit a phone's row; the command above spells it out. */
const terse = (name: string) => name.replace(/^(icon|loader)-/, '')

/** Just what you need: one piece at a time, its command and its stack. */
export function PiecePath({ planes, pieces }: { planes: Plane[]; pieces: Piece[] }) {
  const [name, setName] = useState(pieces[0]!.name)
  const piece = pieces.find((p) => p.name === name) ?? pieces[0]!
  return (
    <Path
      label="Just what you need"
      mood="umber"
      command={`npx youj add ${piece.name}`}
      controls={
        pieces.length > 1 && (
          <Segmented
            label="Piece"
            value={piece.name}
            onChange={setName}
            // A terse label keeps the whole name as its accessible name, and its tooltip.
            options={pieces.map((p) => ({ value: p.name, label: terse(p.name), title: terse(p.name) === p.name ? undefined : p.name }))}
          />
        )
      }
    >
      <PieceStack planes={planes} piece={piece} />
    </Path>
  )
}
