import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type PointerEvent, type Ref, type RefObject } from 'react'
import { animate, useMotionValue, type AnimationPlaybackControls } from 'motion/react'
import { useYouj } from '@youj/core'
import type { Route } from './geo'
import type { FleetMapHandle, MapInsets } from './model'

/* The map's camera: pan and zoom, eased by the motion tokens, framing
 * `targetBox` in the space the panels leave. Drag to pan, ⌘/Ctrl + scroll to
 * zoom. */

const MIN_SCALE = 0.45
const MAX_SCALE = 3.2

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface MapCameraOptions {
  svg: RefObject<SVGSVGElement | null>
  world: RefObject<SVGGElement | null>
  insets: MapInsets
  /** What to frame (map units), and a key that changes when it should be framed again. */
  targetBox: Route['box']
  targetKey: string
  ref?: Ref<FleetMapHandle>
}

export function useMapCamera({ svg, world, insets, targetBox, targetKey, ref }: MapCameraOptions) {
  const k = useYouj()
  const size = useRef({ w: 0, h: 0 })
  const insetsRef = useRef(insets)
  useLayoutEffect(() => {
    insetsRef.current = insets
  })
  const tx = useMotionValue(0)
  const ty = useMotionValue(0)
  const scale = useMotionValue(1)
  const flight = useRef<AnimationPlaybackControls[]>([])

  // The camera writes straight to the DOM: no React render per frame.
  useEffect(() => {
    const apply = () => {
      world.current?.setAttribute('transform', `translate(${tx.get()} ${ty.get()}) scale(${scale.get()})`)
      svg.current?.style.setProperty('--map-scale', String(scale.get()))
    }
    apply()
    const off = [tx.on('change', apply), ty.on('change', apply), scale.on('change', apply)]
    return () => off.forEach((stop) => stop())
  // eslint-disable-next-line react-hooks/exhaustive-deps -- svg and world are refs
  }, [tx, ty, scale])

  const stop = () => {
    for (const controls of flight.current) controls.stop()
    flight.current = []
  }

  const moveTo = (target: { x: number; y: number; s: number }, animated: boolean, fast = false) => {
    stop()
    if (!animated || k.reduced) {
      tx.jump(target.x)
      ty.jump(target.y)
      scale.jump(target.s)
      return
    }
    const transition = fast ? k.tween('base', 'standard') : k.tween('deliberate', 'emphasized')
    flight.current = [animate(tx, target.x, transition), animate(ty, target.y, transition), animate(scale, target.s, transition)]
  }

  /** The camera that frames `box` (map units) in the space the panels leave. */
  const frame = (box: Route['box']) => {
    const { w, h } = size.current
    const { top, right, bottom, left } = insetsRef.current
    const aw = Math.max(120, w - left - right)
    const ah = Math.max(120, h - top - bottom)
    const bw = Math.max(40, box.x1 - box.x0)
    const bh = Math.max(40, box.y1 - box.y0)
    const s = clamp(Math.min(aw / (bw * 1.24), ah / (bh * 1.3)), MIN_SCALE, MAX_SCALE)
    return { s, x: left + aw / 2 - ((box.x0 + box.x1) / 2) * s, y: top + ah / 2 - ((box.y0 + box.y1) / 2) * s }
  }

  // Measure, and hold the framing through resizes (the sidebar opening, the window).
  const box = useRef(targetBox)
  useLayoutEffect(() => {
    box.current = targetBox
  })
  useLayoutEffect(() => {
    const el = svg.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      size.current = { w: entry.contentRect.width, h: entry.contentRect.height }
      moveTo(frame(box.current), false)
    })
    observer.observe(el)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- observes once for the map’s life; svg is a ref and moveTo reads refs
  }, [])

  // A new selection (or panels opening and closing) eases the camera to it.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (size.current.w) moveTo(frame(targetBox), true)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- targetKey stands for targetBox; moveTo reads refs
  }, [targetKey])

  const zoomAround = (factor: number, ax: number, ay: number, animated: boolean) => {
    const s = scale.get()
    const next = clamp(s * factor, MIN_SCALE, MAX_SCALE)
    const ratio = next / s
    moveTo({ s: next, x: ax - (ax - tx.get()) * ratio, y: ay - (ay - ty.get()) * ratio }, animated, true)
  }

  useImperativeHandle(ref, () => ({
    zoomBy: (factor) => {
      const { w, h } = size.current
      const { top, right, bottom, left } = insetsRef.current
      zoomAround(factor, left + (w - left - right) / 2, top + (h - top - bottom) / 2, true)
    },
    fit: () => moveTo(frame(box.current), true),
  }))

  // ⌘/Ctrl + scroll (and trackpad pinch) zooms at the pointer; a plain scroll still scrolls the page.
  useEffect(() => {
    const el = svg.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      zoomAround(Math.exp(-event.deltaY * 0.01), event.clientX - rect.left, event.clientY - rect.top, false)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  // Drag to pan. Capture starts only once it's a drag, so a click still reaches a vessel.
  const drag = useRef<{ id: number; x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null)
  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, tx: tx.get(), ty: ty.get(), moved: false }
  }
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    const dx = event.clientX - d.x
    const dy = event.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    if (!d.moved) {
      d.moved = true
      stop()
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    tx.jump(d.tx + dx)
    ty.jump(d.ty + dy)
  }
  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    const d = drag.current
    drag.current = null
    if (!d?.moved) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    // A drag isn't a click on whatever it ended over.
    const swallow = (click: MouseEvent) => click.stopPropagation()
    window.addEventListener('click', swallow, { capture: true, once: true })
    requestAnimationFrame(() => window.removeEventListener('click', swallow, { capture: true }))
  }

  const onPointerCancel = () => {
    drag.current = null
  }
  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
