'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type MouseEvent, type PointerEvent } from 'react'
import { cubicBezier } from 'motion/react'
import { observeThemeChange, useYouj, useMotionBudget } from '@youj/core'
import { colorWriter, resolveColors } from './color'
import { createEngine, type GridCell, type TerrainEngine, type Timing } from './engine'
import type { Frame } from './geometry'
import { paintOf, sourcesFor, type Paint } from './paint'

/* The terrain's canvas as a hook: one engine per grid size, fed the props and
 * kept honest about the page: its size (a ResizeObserver, whose callback
 * redraws before the paint), whether it's on screen (IntersectionObserver)
 * or the tab is hidden, the theme (colors are resolved again on any theme
 * change, and each tone's paint is built once per theme, the other tones'
 * while the page is idle), the timing tokens, and the motion budget (a low
 * tier draws at 1x).
 * The pointer is read once a frame, from a rect cached until the page
 * scrolls or resizes; a cell it lands on is lit at once, before React
 * catches up, and stays lit over empty space until the pointer leaves. */

export interface TerrainInput {
  frame: Frame
  /** Each cell's share of the peak, rows × columns. */
  shares: Float32Array
  /** The ramp's color, a token reference. */
  tone: string
  /** Every tone the terrain may switch to: their paint is built ahead, while the page is idle. */
  tones?: readonly string[]
  active: GridCell | null
  pinned: GridCell | null
  /** Someone is looking at one cell: the rest recede. */
  looking: boolean
  onHover: (cell: GridCell | null) => void
  onPick: (cell: GridCell) => void
}

const same = (a: GridCell | null, b: GridCell | null) => a === b || (!!a && !!b && a.row === b.row && a.col === b.col)

/** Runs `task` when the page is idle (soon, where there's no idle callback); returns a cancel. */
function whenIdle(task: () => void) {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(task, { timeout: 2000 })
    return () => cancelIdleCallback(id)
  }
  const id = setTimeout(task, 300)
  return () => clearTimeout(id)
}

export function useTerrain(input: TerrainInput) {
  const { frame, shares, tone, active, pinned, looking } = input
  const k = useYouj()
  const { tier } = useMotionBudget()
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<TerrainEngine | null>(null)
  const latest = useRef(input)
  // Set when an engine is made with every input; the effects below skip that commit.
  const fresh = useRef(false)
  const size = useRef({ width: 0, height: 0, ratio: 1 })
  const cap = useRef(2)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const hovered = useRef<GridCell | null>(null)
  const pickFrame = useRef(0)
  const paintFor = useRef<(tone: string) => Paint>(null)

  const timing = useMemo<Timing>(() => {
    const ease = (token: Parameters<typeof k.ease>[0]) => cubicBezier(...k.ease(token))
    return {
      reduced: k.reduced,
      rise: { duration: k.ms('deliberate'), spread: k.ms('slow') * 2, ease: ease('enter') },
      morph: { duration: k.ms('slow'), spread: k.ms('base'), ease: ease('standard') },
      recede: { duration: k.ms('fast'), spread: 0, ease: ease('standard') },
    }
  }, [k])

  useLayoutEffect(() => {
    latest.current = input
  })

  // One engine per grid size, with the page's observers.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a new grid makes a new engine; every other input reaches it through the effects below
  useLayoutEffect(() => {
    const box = host.current
    const el = canvas.current
    if (!box || !el) return
    const e = createEngine(el, frame, (running) => box.toggleAttribute('data-moving', running))
    engine.current = e
    fresh.current = true
    const now = latest.current
    e.setTiming(timing)
    e.setShares(now.shares)
    e.setLooking(now.looking)
    e.setCells(now.active, now.pinned)

    const writer = colorWriter(el.getContext('2d'))
    const paints = new Map<string, Paint>()
    const build = (tone: string) => {
      let paint = paints.get(tone)
      if (!paint) paints.set(tone, (paint = paintOf(resolveColors(box, sourcesFor(tone)), writer)))
      return paint
    }
    paintFor.current = build
    let idle: (() => void) | undefined
    const repaint = () => {
      paints.clear()
      e.setPaint(build(latest.current.tone))
      idle?.()
      idle = whenIdle(() => latest.current.tones?.forEach(build))
    }
    repaint()
    const stopTheme = observeThemeChange(box, repaint)

    const sizes = new ResizeObserver(([entry]) => {
      if (!entry) return
      const content = entry.contentBoxSize?.[0]
      size.current = { width: content?.inlineSize ?? entry.contentRect.width, height: content?.blockSize ?? entry.contentRect.height, ratio: window.devicePixelRatio || 1 }
      e.resize(size.current.width, size.current.height, Math.min(cap.current, size.current.ratio))
    })
    sizes.observe(el)
    const view = new IntersectionObserver(([entry]) => entry && e.setSeen(entry.isIntersecting))
    view.observe(box)
    const visibility = () => e.setShown(document.visibilityState !== 'hidden')
    const moved = () => e.moved()
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('scroll', moved, { capture: true, passive: true })
    window.addEventListener('resize', moved, { passive: true })
    return () => {
      e.destroy()
      engine.current = null
      idle?.()
      stopTheme()
      sizes.disconnect()
      view.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('scroll', moved, { capture: true })
      window.removeEventListener('resize', moved)
      cancelAnimationFrame(pickFrame.current)
      pickFrame.current = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new grid makes a new engine; every other input reaches it through the effects below
  }, [frame.rows, frame.cols])

  // A new extent (same grid) before the box resizes to it: the resize that follows redraws.
  useLayoutEffect(() => engine.current?.setFrame(frame), [frame])

  useEffect(() => {
    if (!fresh.current) engine.current?.setTiming(timing)
  }, [timing])
  useEffect(() => {
    if (!fresh.current) engine.current?.setShares(shares)
  }, [shares])
  useEffect(() => {
    if (!fresh.current) engine.current?.setLooking(looking)
  }, [looking])
  useEffect(() => {
    if (!fresh.current) engine.current?.setCells(active, pinned)
  }, [active, pinned])
  useEffect(() => {
    if (!fresh.current && paintFor.current) engine.current?.setPaint(paintFor.current(tone))
  }, [tone])
  useEffect(() => {
    cap.current = tier === 'low' ? 1 : 2
    const { width, height, ratio } = size.current
    engine.current?.resize(width, height, Math.min(cap.current, ratio))
  }, [tier])
  useEffect(() => {
    fresh.current = false
  })

  /** The pointer, read once a frame: a new cell is lit at once and reported. */
  const read = () => {
    pickFrame.current = 0
    const e = engine.current
    const at = pointer.current
    if (!e || !at) return
    const cell = e.pick(at.x, at.y)
    if (!cell || same(cell, hovered.current)) return
    hovered.current = cell
    e.setCells(cell, latest.current.pinned)
    latest.current.onHover(cell)
  }

  const handlers = {
    onPointerMove(event: PointerEvent<HTMLElement>) {
      // Touch has no hover: a tap picks.
      if (event.pointerType === 'touch') return
      pointer.current = { x: event.clientX, y: event.clientY }
      if (!pickFrame.current) pickFrame.current = requestAnimationFrame(read)
    },
    onPointerLeave() {
      pointer.current = null
      cancelAnimationFrame(pickFrame.current)
      pickFrame.current = 0
      if (!hovered.current) return
      hovered.current = null
      latest.current.onHover(null)
    },
    onClick(event: MouseEvent<HTMLElement>) {
      const cell = engine.current?.pick(event.clientX, event.clientY)
      if (cell) latest.current.onPick(cell)
    },
  }

  /** The keyboard took over: forget the cell under a resting pointer until it moves again. */
  const forget = useCallback(() => {
    hovered.current = null
  }, [])

  return { host, canvas, handlers, forget }
}
