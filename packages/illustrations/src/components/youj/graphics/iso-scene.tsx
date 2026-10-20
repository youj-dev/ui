'use client'

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from 'react'
import { flushSync } from 'react-dom'
import { cancelFrame, frame, m, useInView, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn } from '@youj/core'
import { MotionFeatures } from '@youj/core'
import { boxExtent, isoSort, project, unionExtent, viewBoxOf, volumeExtent, type IsoBounds, type ScenePad, type ScreenBox } from './iso'
import { KIT_CSS } from './tones'

/* The stage every isometric shape draws on: one <svg> whose viewBox holds a
 * volume of grid units, plus the motion the shapes share.
 *
 * - Order: direct children that are shapes (IsoBox, IsoCylinder, IsoStack,
 *   IsoPlatform) are drawn far to near (isoSort), whatever order they're
 *   written in. Anything else keeps its place: write a floor first and it
 *   stays under everything.
 * - Assemble: with `assemble`, shapes drop in from above on the settle spring
 *   the first time the scene scrolls into view, far ones first.
 * - Explode: one separation value, 0 to 1, springs to `explode` (or to 1
 *   while hovered, with `explode="hover"`); IsoStack's layers and any shape's
 *   `lift` follow it, so a reversal mid-way picks up where it is.
 * - Float: shapes with `float` bob gently on one clock that runs only while
 *   the scene is on screen.
 * - Framing: the viewBox fits the shapes' projected extent at full
 *   separation (so an exploded stack never clips), plus `pad`; or the volume
 *   `size` names, for scenes that must frame alike. The drawing is crisp at
 *   its natural size (`unit` CSS px per grid unit) and scales down to fit a
 *   narrower box, centered; hairlines stay 1 px and text keeps its size
 *   (--kg-px).
 * - Callouts: when a shape names its parts, the scene keeps a rail beside the
 *   drawing, `rail` CSS px wide at every scale, at the end of the line (the
 *   start in RTL). Leaders run from the parts to it, so labels never sit on
 *   the geometry.
 *
 * Reduced motion: the final state, drawn once. No drop, no bob; the
 * separation jumps to its target. Decorative by default (aria-hidden); a
 * `title` makes it an image with that name.
 *
 * At rest it's static SVG: a shape mounts its motion only once it has
 * something to do (the drop starts, the scene first parts, a bob comes into
 * view), and its colors and hairlines are classes from one stylesheet. So a
 * page full of scenes server-renders small and hydrates cheaply. */

export type IsoSize = readonly [w: number, d: number, h: number]

interface SceneContextValue {
  unit: number
  reduced: boolean
  /** Assemble is on and hasn't played yet: shapes start raised and hidden. */
  assemble: boolean
  /** The scene has come into view: assembling shapes drop in. */
  started: boolean
  /** The scene has been on screen: floating shapes start to bob. */
  seen: boolean
  /** The separation has left 0 at some point (or starts elsewhere): shapes that lift follow it from now on. */
  parting: boolean
  explode: MotionValue<number>
  /** Seconds of on-screen time, for scenes that turn a part (a rotor): running only while a part has joined and the scene is on screen. */
  clock: MotionValue<number>
  /** A part that turns on the clock joins it while it's mounted. */
  addFloater: () => () => void
  /** Seconds per bob, from the tokens (so Speed and the theme's personality reach it). */
  period: number
  /** The stagger step between shapes as they assemble, seconds. */
  step: number
  /** Callout text is set small: details drop out. */
  compact: boolean
  /** Which side a callout's text reads toward: the end of the line. */
  rtl: boolean
  /** Where callout leaders end and their labels begin, in user units: the edge of the drawing on the rail's side. */
  railX: number
}

const SceneContext = createContext<SceneContextValue | null>(null)
const OrderContext = createContext(0)
/** Inside another shape (a chip on a board): it moves with its parent and doesn't assemble on its own. */
const NestedContext = createContext(false)

/** The scene a shape is drawn in. Shapes outside an IsoScene throw: they need its unit and clock. */
export function useIsoScene(): SceneContextValue {
  const scene = useContext(SceneContext)
  if (!scene) throw new Error('Isometric shapes render inside <IsoScene>.')
  return scene
}

/** A shape's place in the painter's order: its assemble stagger. */
export const useIsoOrder = () => useContext(OrderContext)

/**
 * A shape component that can say where it stands, so the scene can order and
 * frame it: its box at rest (painter's order), its screen extent at full
 * separation (framing), and whether it draws callouts (the rail).
 */
export type IsoShape<P> = ComponentType<P> & {
  isoBounds?: (props: P) => IsoBounds
  isoFit?: (props: P, unit: number) => ScreenBox
  isoRail?: (props: P) => boolean
}

const statics = (child: ReactNode) => (isValidElement(child) ? (child.type as Partial<IsoShape<unknown>>) : undefined)

/** Shapes into painter's order (in the slots shapes held; everything else stays put), with the extent they cover. */
function analyse(children: ReactNode, unit: number) {
  const list = Children.toArray(children)
  const slots: number[] = []
  const shapes: { el: ReactElement; b: IsoBounds }[] = []
  const extents: ScreenBox[] = []
  let rail = false
  list.forEach((child, i) => {
    const type = statics(child)
    if (!type) return
    const props = (child as ReactElement).props
    const b = type.isoBounds?.(props)
    if (b) {
      slots.push(i)
      shapes.push({ el: child as ReactElement, b })
    }
    const fit = type.isoFit?.(props, unit) ?? (b ? boxExtent(b, unit) : undefined)
    if (fit) extents.push(fit)
    if (type.isoRail?.(props)) rail = true
  })
  const sorted = isoSort(shapes, (s) => s.b)
  const ordered = [...list]
  slots.forEach((slot, i) => {
    ordered[slot] = (
      <OrderContext.Provider key={sorted[i]!.el.key ?? slot} value={i}>
        {sorted[i]!.el}
      </OrderContext.Provider>
    )
  })
  return { ordered, extent: unionExtent(extents), rail }
}

/** How many bob periods fit a `deliberate` beat: a slow, calm float. */
const FLOAT_BEATS = 10
/** Below this rendered scale, callouts drop their detail lines. */
const COMPACT_SCALE = 0.72
/** The callout rail's default width, CSS px: an eyebrow and a short detail line. */
const RAIL = 168
/** On a narrow screen the rail gives the drawing room: at most this share of the width, never under RAIL_MIN (a compact label). */
const RAIL_SHARE = 0.32
const RAIL_MIN = 88

export interface IsoSceneProps extends Omit<SVGProps<SVGSVGElement>, 'title' | 'children' | 'ref'> {
  children?: ReactNode
  /** Frame this volume, in grid units: [w (x), d (y), h (z)], instead of fitting the shapes. For scenes that must frame alike (a row of option cards). */
  size?: IsoSize
  /** User units per grid unit: the drawing's natural size, in CSS px. Default 24. */
  unit?: number
  /** Room round the drawing, in user units: one number, or [top, right, bottom, left]. Default 16. */
  pad?: ScenePad
  /** Width of the callout rail beside the drawing, CSS px, when a shape names its parts; false for none. Default 168. */
  rail?: number | false
  /** Names the drawing for assistive tech; without it the scene is decorative (aria-hidden). */
  title?: string
  /** A longer description, read after the title. */
  description?: string
  /** Shapes drop in, far ones first, the first time the scene comes into view. Default false. */
  assemble?: boolean
  /** Separation for IsoStack layers and shapes with `lift`: a number from 0 to 1, a boolean, or 'hover' (apart while the pointer is over the scene). Default 0. */
  explode?: number | boolean | 'hover'
  /** Scale up past the natural size to fill a wider box. Default false: it's crispest at 1:1. */
  grow?: boolean
  /** Colour for shapes that carry a `hue`: 'theme' for the theme's pair (derived from the accent), or any CSS colours for hue 1, 2 and 3 in order (an empty entry takes the theme's). Default off: gray, with the accent the only colour. */
  colors?: 'theme' | readonly string[]
  className?: string
  style?: CSSProperties
}

/* Every scene's size, from one ResizeObserver. Its callback runs after the
 * browser's own layout, so the reads are free: every scene on the page reads
 * first, then all their updates commit together before the paint. A read in
 * a layout effect forced a style and layout pass of whatever mounted with the
 * scene, and a read after another scene's update forced one more. */
type SizeRead = () => (() => void) | undefined
const sizeReads = new Map<Element, SizeRead>()
let sizes: ResizeObserver | null = null
function observeSize(el: Element, read: SizeRead) {
  sizes ??= new ResizeObserver((entries) => {
    const writes = entries.flatMap((entry) => sizeReads.get(entry.target)?.() ?? [])
    if (writes.length) flushSync(() => writes.forEach((write) => write()))
  })
  sizeReads.set(el, read)
  sizes.observe(el)
  return () => {
    sizeReads.delete(el)
    sizes?.unobserve(el)
  }
}

export function IsoScene({
  children,
  size,
  unit = 24,
  pad = 16,
  title,
  description,
  assemble = false,
  explode = 0,
  grow = false,
  colors,
  rail: railProp,
  className,
  style,
  onPointerEnter,
  onPointerLeave,
  ...svgProps
}: IsoSceneProps) {
  const k = useYouj()
  const id = useId()
  const svg = useRef<SVGSVGElement>(null)
  const { ordered, extent, rail: named } = analyse(children, unit)
  const content = viewBoxOf(size ? volumeExtent(size, unit) : (extent ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 }), pad)
  const railPx = named && railProp !== false ? (railProp ?? RAIL) : 0
  // CSS px per user unit and the rail's width, measured; the natural size until then.
  const [scale, setScale] = useState(1)
  const [railNow, setRailNow] = useState(railPx)
  const inView = useInView(svg, { amount: 0.25 })
  const [started, setStarted] = useState(!assemble || k.reduced)
  const [seen, setSeen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [compact, setCompact] = useState(false)
  const [rtl, setRtl] = useState(false)

  useEffect(() => {
    if (!inView) return
    setStarted(true)
    setSeen(true)
  }, [inView])

  // Separation: a spring toward the target, so a reversal mid-way carries on from where it is.
  const target = explode === 'hover' ? (hovered ? 1 : 0) : Number(explode)
  // Once it has parted, shapes keep following the spring, so the way back down is animated too.
  const [parted, setParted] = useState(false)
  const parting = parted || target !== 0
  useEffect(() => {
    if (target !== 0) setParted(true)
  }, [target])
  const separation = useSpring(target, k.spring('smooth'))
  useEffect(() => {
    if (k.reduced) separation.jump(target)
    else separation.set(target)
  }, [target, k.reduced, separation])

  // One clock for the parts that turn, running only while one is mounted and the scene is on screen.
  const clock = useMotionValue(0)
  const [floaters, setFloaters] = useState(0)
  const addFloater = useCallback(() => {
    setFloaters((n) => n + 1)
    return () => setFloaters((n) => n - 1)
  }, [])
  useEffect(() => {
    if (!floaters || !inView || k.reduced) return
    let last: number | undefined
    const tick = ({ timestamp }: { timestamp: number }) => {
      if (last !== undefined) clock.set(clock.get() + (timestamp - last) / 1000)
      last = timestamp
    }
    frame.update(tick, true)
    return () => cancelFrame(tick)
  }, [floaters, inView, k.reduced, clock])

  // The rendered scale. The rail keeps its CSS width, so the drawing gets what's left:
  // at a rendered width W, the drawing is scaled (W - rail) / its width.
  // Read where the browser has just laid the page out (observeSize), never in the commit.
  useLayoutEffect(() => {
    const el = svg.current
    if (!el || typeof ResizeObserver === 'undefined') return
    return observeSize(el, () => {
      const width = el.clientWidth
      const rtlNow = getComputedStyle(el).direction === 'rtl'
      return () => {
        setRtl(rtlNow)
        if (!width) return
        let rail = railPx && Math.round(Math.min(railPx, Math.max(RAIL_MIN, width * RAIL_SHARE)))
        let next = Math.max(0.2, (width - rail) / content.width)
        // At its natural size the drawing stops growing, and whatever room is left goes to the rail.
        if (!grow && next > 1) {
          next = 1
          rail = Math.max(0, width - content.width)
        }
        setRailNow(rail)
        setScale(Math.round(next * 200) / 200)
      }
    })
  }, [content.width, railPx, grow])
  useEffect(() => setCompact(scale < COMPACT_SCALE), [scale])

  // The viewBox: the drawing, and the rail in user units at this scale on the side the text reads toward.
  const railUnits = railPx ? railNow / scale : 0
  const box = { x: rtl ? content.x - railUnits : content.x, y: content.y, width: content.width + railUnits, height: content.height }
  const railX = rtl ? content.x : content.x + content.width

  const period = k.duration('deliberate') * FLOAT_BEATS
  const context = useMemo<SceneContextValue>(
    () => ({
      unit,
      reduced: k.reduced,
      assemble: assemble && !k.reduced,
      started,
      seen,
      parting,
      explode: separation,
      clock,
      addFloater,
      period,
      step: k.stagger('loose'),
      compact,
      rtl,
      railX,
    }),
    [unit, k, assemble, started, seen, parting, separation, clock, addFloater, period, compact, rtl, railX],
  )

  const titleId = `${id}-title`
  const descId = `${id}-desc`
  return (
    <MotionFeatures>
      {/* The kit's classes, once per page: React hoists this to the head and drops repeats. */}
      <style href="youj-iso-kit" precedence="default">
        {KIT_CSS}
      </style>
      <svg
        ref={svg}
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
        data-slot="iso-scene"
        data-idle={inView ? undefined : ''}
        data-yj-colors={colors ? '' : undefined}
        className={cn('mx-auto block h-auto max-w-full overflow-visible select-none', className)}
        style={
          {
            width: grow ? '100%' : content.width + railPx,
            aspectRatio: `${box.width} / ${box.height}`,
            '--kg-px': Math.round((1 / scale) * 1000) / 1000,
            ...Object.fromEntries((typeof colors === 'string' ? [] : (colors ?? [])).slice(0, 3).flatMap((c, i) => (c ? [[`--kg-c${i + 1}`, c]] : []))),
            ...style,
          } as CSSProperties
        }
        {...(title
          ? { role: 'img', 'aria-labelledby': titleId, 'aria-describedby': description ? descId : undefined }
          : { 'aria-hidden': true, focusable: 'false' })}
        onPointerEnter={(e) => {
          if (explode === 'hover' && e.pointerType === 'mouse') setHovered(true)
          onPointerEnter?.(e)
        }}
        onPointerLeave={(e) => {
          setHovered(false)
          onPointerLeave?.(e)
        }}
        {...svgProps}
      >
        {title && <title id={titleId}>{title}</title>}
        {title && description && <desc id={descId}>{description}</desc>}
        <SceneContext.Provider value={context}>{ordered}</SceneContext.Provider>
      </svg>
    </MotionFeatures>
  )
}

export interface IsoPieceProps {
  children: ReactNode
  /** How far it rises at full separation, in grid units along z (IsoStack sets this per layer). */
  lift?: number
  /** Bob gently: true, or the height of the bob in grid units. Default false. */
  float?: boolean | number
  /** Extra delay in the assemble, in stagger steps (a stack's layers land one after another). */
  delay?: number
  className?: string
  style?: CSSProperties
}

/**
 * The motion wrapper every shape draws inside: its drop (assemble), its rise
 * (explode) and its bob (float). At rest it's no element of its own (a plain
 * <g> for a className or style); each motion mounts only once it has
 * something to do, from the pose the static drawing shows, so the switch
 * never jumps.
 */
export function IsoPiece({ children, lift = 0, float = false, delay = 0, className, style }: IsoPieceProps) {
  const scene = useIsoScene()
  const order = useIsoOrder()
  const nested = useContext(NestedContext)
  const assembling = scene.assemble && !nested
  const bob = float === true ? 0.22 : float || 0
  const floating = bob > 0 && !scene.reduced

  // Each piece bobs a little out of step with the next, so a row of them breathes rather than marches.
  const phase = order * 0.37 + delay * 0.19
  // The bob joins in once the scene has been seen: after hydration, so the server and the client draw the same pose.
  const bobbing = floating && scene.seen
  let body = <NestedContext.Provider value>{children}</NestedContext.Provider>
  if (bobbing) body = <Bob bob={bob} phase={phase}>{body}</Bob>
  if (lift && scene.parting) body = <Rise lift={lift}>{body}</Rise>

  const drop = scene.unit * 3
  if (assembling && scene.started) {
    return (
      <Drop order={order + delay} drop={drop} className={className} style={style}>
        {body}
      </Drop>
    )
  }
  // Waiting to assemble: raised and hidden, where the drop starts. Otherwise at rest (reduced motion arriving mid-drop lands here, finished).
  const pose = assembling ? { ...style, transform: `translateY(${-drop}px)`, opacity: 0 } : style
  return pose || className ? (
    <g className={className} style={pose}>
      {body}
    </g>
  ) : (
    body
  )
}

/** The drop in: from `drop` above and hidden, onto its place on the settle spring, `order` stagger steps in. */
function Drop({ order, drop, className, style, children }: { order: number; drop: number; className?: string; style?: CSSProperties; children: ReactNode }) {
  const scene = useIsoScene()
  const k = useYouj()
  const delay = order * scene.step
  return (
    <m.g
      className={className}
      style={style}
      initial={{ y: -drop, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ y: { ...k.spring('settle'), delay }, opacity: { ...k.tween('base', 'enter'), delay } }}
    >
      {children}
    </m.g>
  )
}

/** The rise: `lift` grid units at the scene's full separation. */
function Rise({ lift, children }: { lift: number; children: ReactNode }) {
  const { unit, explode } = useIsoScene()
  const rise = useTransform(() => -explode.get() * lift * unit)
  return <m.g style={{ y: rise }}>{children}</m.g>
}

/**
 * The bob: a CSS animation (see KIT_CSS), so the browser runs it without a script frame per tick, and it pauses
 * while the scene is off screen. It rides a sine: `phase` is a fraction of a period.
 */
function Bob({ bob, phase, children }: { bob: number; phase: number; children: ReactNode }) {
  const { unit, period } = useIsoScene()
  const style = { '--kg-bob': `${bob * unit}px`, '--kg-half': `${period / 2}s`, '--kg-lag': `${-period * (phase + 0.25)}s` } as CSSProperties
  return (
    <g className="kg-bob" style={style}>
      {children}
    </g>
  )
}

/** A point in the scene, for anything drawn by hand inside it (a leader, a marker). */
export function useIsoPoint(x: number, y: number, z: number) {
  const { unit } = useIsoScene()
  return project(x, y, z, unit)
}
