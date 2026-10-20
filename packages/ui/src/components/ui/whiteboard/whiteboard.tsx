'use client'

import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { useLocale, useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels, whiteboardLabels } from '@youj/core/labels'
import { useAnnouncer } from '../../../hooks/use-announcer'
import { useControllableState } from '../../../hooks/use-controllable-state'
import { useResizeMeasure } from '../../../hooks/use-resize-measure'
import { useStrokeInput, type StrokePoint } from '../../../hooks/use-stroke'
import { cn, numberFormat } from '../../../lib/utils'
import { LiveCursors, type LiveCursorUser } from '../live-cursors'
import { TooltipProvider } from '../tooltip'
import {
  GRID,
  ZOOM_STEP,
  alignShapes,
  distributeShapes,
  fitView,
  overlaps,
  snapBox,
  visibleBox,
  zoomAt,
  type Gap,
  type Guide,
  type View,
  type WhiteboardAlign,
  type WhiteboardDistribute,
} from './whiteboard-arrange'
import {
  COLORS,
  EMPTY_SCENE,
  FONT_SIZES,
  LABEL_FONT,
  PAPER,
  STICKY,
  attachable,
  boundsOf,
  boxFrom,
  connectorRoute,
  hitTest,
  insideBox,
  isPoint,
  moveShape,
  newId,
  pinPoint,
  removeShapes,
  resizeShape,
  sceneToSVG,
  unionBoxes,
  type Box,
  type WhiteboardEmbed,
  type Point,
  type WhiteboardColor,
  type WhiteboardConnectorEnd,
  type WhiteboardConnectorRoute,
  type WhiteboardPin,
  type WhiteboardScene,
  type WhiteboardShape,
  type WhiteboardStrokeWidth,
  type WhiteboardTool,
} from './whiteboard-model'
import { Overlay, type Corner } from './whiteboard-overlay'
import { Pins } from './whiteboard-pins'
import { EmbedContent, EmbedTitle, ShapeView, StickyView, type OptionHandlers } from './whiteboard-shapes'
import { ALIGN, DISTRIBUTE, TOOLS, WhiteboardToolbar } from './whiteboard-toolbar'
import { Minimap, ZoomBar } from './whiteboard-view'

/* A whiteboard for sketching and arranging: pen, lines, arrows, boxes,
 * ellipses, text, sticky notes, connectors that follow the shapes they join,
 * frames holding the app's own React content (embeds), and comment pins.
 * - Tools: Select (V), Hand (H), Pen (P), Line (L), Arrow (A), Rectangle (R),
 *   Ellipse (O), Text (T), Sticky note (S), Connector (X), Comment (C), on a
 *   floating Toolbar (one tab stop, arrows rove) whose tooltips show each
 *   key; `tools` picks which are offered. Colors are theme roles; a note's
 *   paper is its color's soft fill.
 * - Select: click (Shift adds) or drag a marquee; drag to move with snapping
 *   to the neighbours' edges, centers and spacing (guides and gap hints show
 *   why; Alt drags freely), and to the grid when Snap to grid is on. Corner
 *   handles resize. Arrange lines the selection up or spreads it evenly.
 *   Double-click a text, a note or a connector to edit its words.
 * - View: wheel pans, ⌘/Ctrl + wheel or a pinch zooms at the pointer,
 *   Space-drag or the Hand tool pans; the zoom menu fits the board or the
 *   selection (animated, instant with reduced motion) and turns on the
 *   minimap and grid snapping. Offscreen shapes aren't drawn.
 * - Embeds: an `embed` shape's frame holds `embeds[id]`, under a title that
 *   selects and moves it; its content keeps its own pointer and keyboard.
 * - Comments: the Comment tool drops a pin on a point or a shape (it moves
 *   with the shape); the pin opens `pinContent(pin)` (or a note) in a
 *   popover with Resolve and Delete.
 * - Presence: `cursors` are other people's pointers in board coordinates,
 *   drawn by LiveCursors; `onCursorMove` reports yours the same way.
 * - History: every change (drawing, moves, arrange, edits, pins) is one undo
 *   step: ⌘Z / Ctrl+Z, ⇧⌘Z / Ctrl+Y.
 * - Keyboard: shapes are one tab stop and Tab walks them (bringing an
 *   offscreen one into view); the focused shape is the selection, arrows
 *   nudge it (Shift further), Enter edits its words, Escape lets go. On the
 *   board, arrows pan and Enter places the tool's shape (a note, a pin, or a
 *   connector between two selected shapes). ? lists every shortcut.
 * - Value: `{ shapes, pins }`, plain JSON, controlled or not; `onValueChange`
 *   fires once a stroke, drag or edit ends. The ref exports SVG and PNG
 *   (embeds as titled placeholders).
 * Motion: drawing and dragging follow the pointer; fitting the view eases on
 * the base token; reduced motion: the view jumps. */

/** The board's handle. */
interface WhiteboardHandle {
  /** The scene as a standalone SVG document in the theme's colors of the moment, cropped to its contents. Embeds draw as titled placeholders. */
  toSVG: () => string
  /** The same picture as a PNG, `scale` times its size (default 2), on the board's surface color. */
  toPNG: (options?: { scale?: number }) => Promise<Blob>
  /** Scales and centers the view on the whole scene. */
  zoomToFit: () => void
  /** Scales and centers the view on the selection. */
  zoomToSelection: () => void
}

/** Another person's pointer on the board: LiveCursors' user, with `x` and `y` in board coordinates. */
interface WhiteboardCursor extends Omit<LiveCursorUser, 'x' | 'y' | 'selection'> {
  x?: number
  y?: number
}

interface WhiteboardProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'children' | 'ref'> {
  value?: WhiteboardScene
  defaultValue?: WhiteboardScene
  onValueChange?: (scene: WhiteboardScene) => void
  /** The tool the board opens with. Default `pen`, or `select` when it opens with shapes. */
  defaultTool?: WhiteboardTool
  /** The tools the toolbar offers, in its order. Default: all of them. */
  tools?: readonly WhiteboardTool[]
  /** Shows the scene with the view controls only. */
  readOnly?: boolean
  /** The board's height in pixels. Default 480. */
  height?: number
  /** The board's accessible name. Default: the labels' "Whiteboard". */
  label?: string
  /** What each `embed` shape holds, by its id: a node, or a function of the shape. */
  embeds?: Record<string, ReactNode> | ((embed: WhiteboardEmbed) => ReactNode)
  /** What a comment pin opens: your thread (CommentThread, say). It gets the pin's Resolve and Delete buttons as `actions`, to place in its own header (CommentThread's `actions`), so the popover has one header. Default: the pin's name, its actions and a note field that writes `pin.text`. */
  pinContent?: (pin: WhiteboardPin, actions: ReactNode) => ReactNode
  /** Other people's pointers, in board coordinates. */
  cursors?: readonly WhiteboardCursor[]
  /** Your pointer in board coordinates as it moves (throttled, about twenty times a second), and `null` when it leaves: send it to the others. */
  onCursorMove?: (point: { x: number; y: number } | null) => void
  /** Show the minimap at first. Default false. */
  defaultMinimap?: boolean
  /** Snap moves and new shapes to the grid at first. Default false. */
  defaultSnapToGrid?: boolean
  /** `toSVG`, `toPNG`, `zoomToFit` and `zoomToSelection`. */
  ref?: Ref<WhiteboardHandle>
}

type Editing = { id: string; kind: 'text' | 'sticky' | 'label'; isNew: boolean; shape: WhiteboardShape }

type Drag =
  | { kind: 'pan'; x: number; y: number; view: View }
  | { kind: 'create'; shape: WhiteboardShape; x: number; y: number }
  | { kind: 'connect'; shape: Extract<WhiteboardShape, { type: 'connector' }> }
  | { kind: 'move'; x: number; y: number; originals: WhiteboardShape[]; box: Box }
  | { kind: 'resize'; handle: Corner; box: Box; originals: WhiteboardShape[] }
  | { kind: 'marquee'; x: number; y: number; additive: string[] }

const ALL_TOOLS = TOOLS.map((t) => t.tool)
const DRAWING: WhiteboardTool[] = ['pen', 'line', 'arrow', 'rectangle', 'ellipse', 'text', 'sticky', 'connector', 'comment']
/** The tools that work on a read-only board. */
const VIEWING: WhiteboardTool[] = ['select', 'hand']
const NUDGE = 1
const NUDGE_FAR = 10
/** How close, in screen pixels, a click has to land to pick a thin shape, and a move to snap. */
const TOLERANCE = 6
const SNAP = 6
const PAN_STEP = 48
const CURSOR_THROTTLE = 50
const round = (n: number) => Math.round(n * 100) / 100
const isHtml = (s: WhiteboardShape) => s.type === 'sticky' || s.type === 'embed'

function Whiteboard({
  value: valueProp,
  defaultValue = EMPTY_SCENE,
  onValueChange,
  defaultTool,
  tools = ALL_TOOLS,
  readOnly = false,
  height = 480,
  label,
  embeds,
  pinContent,
  cursors,
  onCursorMove,
  defaultMinimap = false,
  defaultSnapToGrid = false,
  ref,
  className,
  style,
  ...props
}: WhiteboardProps) {
  const k = useYouj()
  const locale = useLocale()
  const labels = useComponentLabels(whiteboardLabels)
  const [scene, setScene] = useControllableState(valueProp, defaultValue)
  const [tool, setTool] = useState<WhiteboardTool>(defaultTool ?? ((valueProp ?? defaultValue).shapes.length || !tools.includes('pen') ? 'select' : 'pen'))
  const [color, setColor] = useState<WhiteboardColor>('ink')
  const [width, setWidth] = useState<WhiteboardStrokeWidth>('medium')
  const [route, setRoute] = useState<WhiteboardConnectorRoute>('elbow')
  const [selected, setSelected] = useState<string[]>([])
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 })
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [history, setHistory] = useState<{ past: WhiteboardScene[]; future: WhiteboardScene[] }>({ past: [], future: [] })
  // What a drag shows before it is committed: the whole scene as it would be, a marquee, and the snap's guides.
  const [draft, setDraft] = useState<WhiteboardScene | null>(null)
  const [marquee, setMarquee] = useState<Box | null>(null)
  const [snap, setSnap] = useState<{ guides: Guide[]; gaps: Gap[] } | null>(null)
  const [target, setTarget] = useState<string | null>(null)
  const [pen, setPen] = useState<StrokePoint[] | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [panning, setPanning] = useState(false)
  const [minimap, setMinimap] = useState(defaultMinimap)
  const [snapToGrid, setSnapToGrid] = useState(defaultSnapToGrid)
  const [openPin, setOpenPin] = useState<string | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [mod, setMod] = useState({ mod: '⌘', alt: '⌥' })
  const board = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const shapeRefs = useRef(new Map<string, Element>())
  const drag = useRef<Drag | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; mid: { x: number; y: number }; view: View } | null>(null)
  const space = useRef(false)
  const viewRef = useRef(view)
  viewRef.current = view
  const glide = useRef(0)
  const penRef = useRef<StrokePoint[] | null>(null)
  const editingRef = useRef(editing)
  editingRef.current = editing
  const cursorSent = useRef(0)
  const boxCache = useRef(new WeakMap<WhiteboardShape, Box>())
  const hintId = useId()
  const summaryId = useId()
  const { announce, announcer } = useAnnouncer()

  useEffect(() => {
    if (!/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)) setMod({ mod: labels.ctrlKey, alt: 'Alt' })
  }, [labels.ctrlKey])

  useResizeMeasure(surface, (el) => setSize({ w: el.clientWidth, h: el.clientHeight }))

  const shown = draft ?? scene
  const pins = shown.pins ?? []
  const interactive = !readOnly
  const offered = readOnly ? tools.filter((t) => VIEWING.includes(t)) : tools

  // ── Geometry of the scene as shown ───────────────────────────────────
  const byId = useMemo(() => new Map(shown.shapes.map((s) => [s.id, s])), [shown.shapes])
  const lookup = useCallback((id: string) => byId.get(id), [byId])
  const boxes = useMemo(() => {
    const cache = boxCache.current
    const map = new Map<string, Box>()
    for (const s of shown.shapes) {
      if (s.type === 'connector') {
        map.set(s.id, boundsOf(s, lookup))
        continue
      }
      let b = cache.get(s)
      if (!b) {
        b = boundsOf(s)
        cache.set(s, b)
      }
      map.set(s.id, b)
    }
    return map
  }, [shown.shapes, lookup])
  const routes = useMemo(() => {
    const map = new Map<string, ReturnType<typeof connectorRoute>>()
    for (const s of shown.shapes) if (s.type === 'connector') map.set(s.id, connectorRoute(s, lookup))
    return map
  }, [shown.shapes, lookup])
  const boxOf = (s: WhiteboardShape) => boxes.get(s.id) ?? boundsOf(s, lookup)

  const selection = shown.shapes.filter((s) => selected.includes(s.id))
  const kindLabel = (s: WhiteboardShape) => (s.type === 'embed' ? labels.whiteboardEmbed : (labels[TOOLS.find((t) => t.tool === s.type)!.label] as string))
  const shortName = (s: WhiteboardShape) =>
    s.type === 'text' || s.type === 'sticky' ? s.text || kindLabel(s) : s.type === 'embed' ? s.title || kindLabel(s) : kindLabel(s)
  const endName = (end: WhiteboardConnectorEnd) => {
    const s = isPoint(end) ? undefined : lookup(end.shape)
    return s ? shortName(s) : labels.whiteboardPoint
  }
  const nameOf = (s: WhiteboardShape) => {
    if (s.type === 'text') return labels.whiteboardShapeText(kindLabel(s), s.text)
    if (s.type === 'sticky' || s.type === 'embed') return shortName(s) === kindLabel(s) ? kindLabel(s) : labels.whiteboardShapeText(kindLabel(s), shortName(s))
    if (s.type === 'connector') return labels.whiteboardShapeText(kindLabel(s), s.label || labels.whiteboardConnects(endName(s.from), endName(s.to)))
    return kindLabel(s)
  }

  // ── History ──────────────────────────────────────────────────────────
  const commit = (next: WhiteboardScene) => {
    setHistory((h) => ({ past: [...h.past.slice(-99), scene], future: [] }))
    setScene(next)
    onValueChange?.(next)
  }
  const restore = (from: 'past' | 'future') => {
    const stack = history[from]
    if (!stack.length) return
    const next = stack.at(-1)!
    setHistory(
      from === 'past'
        ? { past: stack.slice(0, -1), future: [...history.future, scene] }
        : { past: [...history.past, scene], future: stack.slice(0, -1) },
    )
    setScene(next)
    onValueChange?.(next)
    setSelected((ids) => ids.filter((id) => next.shapes.some((s) => s.id === id)))
  }
  const select = (ids: string[]) => {
    setSelected(ids)
    if (ids.join() !== selected.join()) announce(labels.whiteboardSelected(ids.length))
  }
  const remove = (ids: string[]) => {
    if (!ids.length) return
    commit(removeShapes(scene, ids))
    setSelected([])
    announce(labels.whiteboardDeleted(ids.length))
  }
  const add = (shape: WhiteboardShape) => {
    commit({ ...scene, shapes: [...scene.shapes, shape] })
    announce(labels.whiteboardAdded(kindLabel(shape)))
  }
  const replace = (moved: Map<string, WhiteboardShape>) => {
    if (moved.size) commit({ ...scene, shapes: scene.shapes.map((s) => moved.get(s.id) ?? s) })
  }
  const setPins = (next: WhiteboardPin[]) => commit({ ...scene, pins: next })

  // ── View ─────────────────────────────────────────────────────────────
  const rect = () => surface.current!.getBoundingClientRect()
  const toWorld = (clientX: number, clientY: number): [number, number] => {
    const r = rect()
    const v = viewRef.current
    return [(clientX - r.left - v.x) / v.k, (clientY - r.top - v.y) / v.k]
  }
  const jump = (next: View) => {
    cancelAnimationFrame(glide.current)
    setView(next)
  }
  /** Eases the view to `next` on the base token; reduced motion jumps. */
  const glideTo = (next: View) => {
    cancelAnimationFrame(glide.current)
    const duration = k.ms('base')
    if (k.reduced || !duration || typeof requestAnimationFrame === 'undefined') return setView(next)
    const from = viewRef.current
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = 1 - (1 - t) ** 3
      setView({ x: from.x + (next.x - from.x) * e, y: from.y + (next.y - from.y) * e, k: from.k + (next.k - from.k) * e })
      if (t < 1) glide.current = requestAnimationFrame(step)
    }
    glide.current = requestAnimationFrame(step)
  }
  const zoomBy = (factor: number) => {
    const r = rect()
    jump(zoomAt(viewRef.current, viewRef.current.k * factor, r.width / 2, r.height / 2))
  }
  const fitTo = (box: Box | null, animate = true) => {
    const r = rect()
    if (!box || !r.width) return jump({ x: 0, y: 0, k: 1 })
    const next = fitView(box, r.width, r.height)
    if (animate) glideTo(next)
    else jump(next)
  }
  const zoomToFit = (animate = true) => fitTo(unionBoxes(scene.shapes.map((s) => boundsOf(s, lookup))), animate)
  const zoomToSelection = () => selection.length && fitTo(unionBoxes(selection.map(boxOf)))
  const resetZoom = () => {
    const r = rect()
    jump(zoomAt(viewRef.current, 1, r.width / 2, r.height / 2))
  }
  /** Moves the view so the world point is in the middle. */
  const centerOn = (x: number, y: number, animate = false) => {
    const r = rect()
    const v = viewRef.current
    const next = { k: v.k, x: r.width / 2 - x * v.k, y: r.height / 2 - y * v.k }
    if (animate) glideTo(next)
    else jump(next)
  }

  // A scene that arrives with shapes opens fitted to them.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once, on mount
  useEffect(() => {
    if (scene.shapes.length) zoomToFit(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, [])
  useEffect(() => () => cancelAnimationFrame(glide.current), [])

  // Wheel: ⌘/Ctrl (or a trackpad pinch) zooms at the pointer; a plain wheel pans.
  useEffect(() => {
    const el = surface.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cancelAnimationFrame(glide.current)
      const r = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        setView((v) => zoomAt(v, v.k * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025)), e.clientX - r.left, e.clientY - r.top))
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ── Export ───────────────────────────────────────────────────────────
  /** Resolves every `var(--…)` in a color (a role, or a mix of roles) to the theme's value of the moment, for the export. */
  const paint = (value: string) => {
    const styles = board.current ? getComputedStyle(board.current) : null
    let missing = false
    const resolved = value.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (_, name: string, fallback?: string) => {
      const found = styles?.getPropertyValue(name).trim() || fallback
      if (!found) missing = true
      return found ?? ''
    })
    return missing ? 'currentColor' : resolved
  }
  useImperativeHandle(ref, () => ({
    toSVG: () => sceneToSVG(scene, paint),
    toPNG: async ({ scale = 2 } = {}) => {
      const url = URL.createObjectURL(new Blob([sceneToSVG(scene, paint)], { type: 'image/svg+xml' }))
      try {
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = url
        })
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(img.width * scale)
        canvas.height = Math.ceil(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = paint('var(--color-surface)')
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png'))
      } finally {
        URL.revokeObjectURL(url)
      }
    },
    zoomToFit: () => zoomToFit(),
    zoomToSelection: () => {
      zoomToSelection()
    },
  }))

  // ── Pen ──────────────────────────────────────────────────────────────
  const stroke = useStrokeInput({
    enabled: interactive && tool === 'pen',
    toPoint: toWorld,
    onStart: (point) => {
      penRef.current = [point]
      setPen(penRef.current)
    },
    onExtend: (points) => {
      if (!penRef.current) return
      penRef.current = [...penRef.current, ...points]
      setPen(penRef.current)
    },
    onEnd: (canceled) => {
      const points = penRef.current
      penRef.current = null
      setPen(null)
      if (points && !canceled) add({ id: newId(), type: 'pen', color, width, points: points.map(([x, y, p]) => [round(x), round(y), p]) })
    },
  })

  // ── Pointer ──────────────────────────────────────────────────────────
  /** The shape under a point: notes and embeds first (they sit on the layer above the drawings), then the drawings, topmost first. */
  const topmostAt = (x: number, y: number, only?: (s: WhiteboardShape) => boolean) => {
    const tolerance = TOLERANCE / viewRef.current.k
    const reversed = [...shown.shapes].reverse().filter((s) => !only || only(s))
    return reversed.find((s) => isHtml(s) && hitTest(s, x, y, tolerance, lookup)) ?? reversed.find((s) => !isHtml(s) && hitTest(s, x, y, tolerance, lookup))
  }
  const gridSnap = (n: number) => (snapToGrid ? Math.round(n / GRID) * GRID : n)
  const brush = () => ({ id: newId(), color, width })

  const reportCursor = (e: PointerEvent<HTMLDivElement> | null) => {
    if (!onCursorMove) return
    if (!e) return onCursorMove(null)
    const now = performance.now()
    if (now - cursorSent.current < CURSOR_THROTTLE) return
    cursorSent.current = now
    const [x, y] = toWorld(e.clientX, e.clientY)
    onCursorMove({ x: round(x), y: round(y) })
  }

  const placeSticky = (x: number, y: number) => {
    const shape: WhiteboardShape = { ...brush(), type: 'sticky', x: gridSnap(x - STICKY.w / 2), y: gridSnap(y - STICKY.h / 2), w: STICKY.w, h: STICKY.h, text: '' }
    add(shape)
    select([shape.id])
    setEditing({ id: shape.id, kind: 'sticky', isNew: true, shape })
  }
  const placePin = (x: number, y: number) => {
    const on = topmostAt(x, y, attachable)
    const b = on && boxOf(on)
    const pin: WhiteboardPin = on && b ? { id: newId(), shape: on.id, x: round(x - b.x), y: round(y - b.y) } : { id: newId(), x: round(x), y: round(y) }
    setPins([...(scene.pins ?? []), pin])
    announce(labels.whiteboardAdded(labels.whiteboardComment))
    setOpenPin(pin.id)
  }
  const connect = (from: WhiteboardConnectorEnd, to: WhiteboardConnectorEnd) => {
    const shape: WhiteboardShape = { ...brush(), type: 'connector', from, to, route }
    add(shape)
    return shape
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = e.target as Element
    // Events from a pin's popover (portalled, but still a React child) and from the pins themselves aren't the board's.
    if (!e.currentTarget.contains(el) || el.closest('[data-slot="whiteboard-pins"] button')) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      // A second finger: drop what the first started and pinch instead.
      stroke.cancel()
      drag.current = null
      setDraft(null)
      setMarquee(null)
      setSnap(null)
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }]
      const r = rect()
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top }, view: viewRef.current }
      return
    }
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return
    const pan = readOnly || tool === 'hand' || space.current || e.button === 1
    // An embed's content keeps its own pointer under the Select tool.
    if (!pan && tool === 'select' && el.closest('[data-slot="whiteboard-embed-content"]')) {
      pointers.current.delete(e.pointerId)
      return
    }
    surface.current?.focus({ preventScroll: true })
    const [x, y] = toWorld(e.clientX, e.clientY)
    if (!pan && tool === 'pen') return stroke.handlers.onPointerDown(e)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    if (pan) {
      cancelAnimationFrame(glide.current)
      drag.current = { kind: 'pan', x: e.clientX, y: e.clientY, view: viewRef.current }
      setPanning(true)
      return
    }
    if (tool === 'text') {
      e.preventDefault()
      const hit = topmostAt(x, y)
      if (hit?.type === 'text') return setEditing({ id: hit.id, kind: 'text', isNew: false, shape: hit })
      const shape: WhiteboardShape = { ...brush(), type: 'text', x, y: y - FONT_SIZES[width] * 0.6, text: '' }
      setEditing({ id: shape.id, kind: 'text', isNew: true, shape })
      return
    }
    if (tool === 'sticky') {
      e.preventDefault()
      return placeSticky(x, y)
    }
    if (tool === 'comment') {
      e.preventDefault()
      return placePin(x, y)
    }
    if (tool === 'connector') {
      const from = topmostAt(x, y, attachable)
      drag.current = { kind: 'connect', shape: { ...brush(), type: 'connector', from: from ? { shape: from.id } : { x, y }, to: { x, y }, route } }
      return
    }
    if (tool === 'line' || tool === 'arrow') {
      const [sx, sy] = [gridSnap(x), gridSnap(y)]
      drag.current = { kind: 'create', x: sx, y: sy, shape: { ...brush(), type: tool, x1: sx, y1: sy, x2: sx, y2: sy } }
      return
    }
    if (tool === 'rectangle' || tool === 'ellipse') {
      const [sx, sy] = [gridSnap(x), gridSnap(y)]
      drag.current = { kind: 'create', x: sx, y: sy, shape: { ...brush(), type: tool, x: sx, y: sy, w: 0, h: 0 } }
      return
    }
    // Select.
    const handle = el.closest?.('[data-yj-handle]')?.getAttribute('data-yj-handle') as Corner | null
    const box = unionBoxes(selection.map(boxOf))
    if (handle && box) {
      drag.current = { kind: 'resize', handle, box, originals: selection }
      return
    }
    const hit = topmostAt(x, y)
    if (hit) {
      const ids = selected.includes(hit.id) ? selected : e.shiftKey ? [...selected, hit.id] : [hit.id]
      select(ids)
      const originals = shown.shapes.filter((s) => ids.includes(s.id))
      drag.current = { kind: 'move', x, y, originals, box: unionBoxes(originals.map(boxOf)) ?? { x, y, w: 0, h: 0 } }
      return
    }
    if (!e.shiftKey) select([])
    drag.current = { kind: 'marquee', x, y, additive: e.shiftKey ? selected : [] }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    reportCursor(e)
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }]
      const r = rect()
      const p = pinch.current
      const mid = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top }
      const zoomed = zoomAt(p.view, p.view.k * (Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, p.dist)), p.mid.x, p.mid.y)
      setView({ ...zoomed, x: zoomed.x + mid.x - p.mid.x, y: zoomed.y + mid.y - p.mid.y })
      return
    }
    if (stroke.isDrawing()) return stroke.handlers.onPointerMove(e)
    const d = drag.current
    if (!d) return
    if (d.kind === 'pan') {
      setView({ ...d.view, x: d.view.x + e.clientX - d.x, y: d.view.y + e.clientY - d.y })
      return
    }
    const [x, y] = toWorld(e.clientX, e.clientY)
    if (d.kind === 'create') {
      const s = d.shape
      let shape: WhiteboardShape = s
      const [gx, gy] = [gridSnap(x), gridSnap(y)]
      if (s.type === 'line' || s.type === 'arrow') shape = { ...s, x2: gx, y2: gy }
      else if (s.type === 'rectangle' || s.type === 'ellipse') {
        // Shift draws a square or a circle.
        const side = Math.max(Math.abs(gx - d.x), Math.abs(gy - d.y))
        const ex = e.shiftKey ? d.x + Math.sign(gx - d.x || 1) * side : gx
        const ey = e.shiftKey ? d.y + Math.sign(gy - d.y || 1) * side : gy
        shape = { ...s, ...boxFrom(d.x, d.y, ex, ey) }
      }
      d.shape = shape
      setDraft({ ...scene, shapes: [...scene.shapes, shape] })
    } else if (d.kind === 'connect') {
      const fromId = isPoint(d.shape.from) ? null : d.shape.from.shape
      const over = topmostAt(x, y, (s) => attachable(s) && s.id !== fromId)
      d.shape = { ...d.shape, to: over ? { shape: over.id } : { x, y } }
      setTarget(over?.id ?? null)
      setDraft({ ...scene, shapes: [...scene.shapes, d.shape] })
    } else if (d.kind === 'move') {
      let dx = x - d.x
      let dy = y - d.y
      const ids = new Set(d.originals.map((s) => s.id))
      const moving = { ...d.box, x: d.box.x + dx, y: d.box.y + dy }
      if (!e.altKey) {
        const others = scene.shapes.filter((s) => !ids.has(s.id) && s.type !== 'connector' && culledIds.has(s.id)).map(boxOf)
        const s = snapBox(moving, others, SNAP / viewRef.current.k, snapToGrid ? GRID : undefined)
        dx += s.dx
        dy += s.dy
        setSnap(s.guides.length || s.gaps.length ? { guides: s.guides, gaps: s.gaps } : null)
      } else setSnap(null)
      const moved = new Map(d.originals.map((s) => [s.id, moveShape(s, dx, dy)]))
      setDraft({ ...scene, shapes: scene.shapes.map((s) => moved.get(s.id) ?? s) })
    } else if (d.kind === 'resize') {
      const b = d.box
      const fixedX = d.handle.endsWith('w') ? b.x + b.w : b.x
      const fixedY = d.handle.startsWith('n') ? b.y + b.h : b.y
      const to = boxFrom(fixedX, fixedY, gridSnap(x), gridSnap(y))
      const resized = new Map(d.originals.map((s) => [s.id, resizeShape(s, b, to)]))
      setDraft({ ...scene, shapes: scene.shapes.map((s) => resized.get(s.id) ?? s) })
    } else {
      const box = boxFrom(d.x, d.y, x, y)
      setMarquee(box)
      setSelected([...new Set([...d.additive, ...scene.shapes.filter((s) => insideBox(s, box, lookup)).map((s) => s.id)])])
    }
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    if (pinch.current) {
      if (pointers.current.size === 0) pinch.current = null
      return
    }
    if (stroke.isDrawing()) return e.type === 'pointercancel' ? stroke.handlers.onPointerCancel(e) : stroke.handlers.onPointerUp(e)
    const d = drag.current
    drag.current = null
    setPanning(false)
    setSnap(null)
    if (!d) return
    if (d.kind === 'create') {
      const b = boundsOf(d.shape)
      setDraft(null)
      // A click without a drag draws nothing.
      if (Math.max(b.w, b.h) * viewRef.current.k >= 4) add(d.shape)
    } else if (d.kind === 'connect') {
      setDraft(null)
      setTarget(null)
      const { from, to } = d.shape
      const same = !isPoint(from) && !isPoint(to) && from.shape === to.shape
      const b = boundsOf(d.shape, lookup)
      if (!same && (!isPoint(to) || Math.max(b.w, b.h) * viewRef.current.k >= 8)) add(d.shape)
    } else if ((d.kind === 'move' || d.kind === 'resize') && draft) {
      setDraft(null)
      if (draft !== scene) commit(draft)
    } else if (d.kind === 'marquee') {
      setMarquee(null)
      announce(labels.whiteboardSelected(selected.length))
    }
  }

  const onDoubleClick = (e: { clientX: number; clientY: number; target: EventTarget; currentTarget: Element }) => {
    if (!interactive || !e.currentTarget.contains(e.target as Node) || (e.target as Element).closest?.('[data-slot="whiteboard-embed-content"]')) return
    const hit = topmostAt(...toWorld(e.clientX, e.clientY))
    if (hit) edit(hit)
  }

  // ── Words: text shapes, notes and connector labels ───────────────────
  const edit = (shape: WhiteboardShape) => {
    if (shape.type === 'text') setEditing({ id: shape.id, kind: 'text', isNew: false, shape })
    else if (shape.type === 'sticky') setEditing({ id: shape.id, kind: 'sticky', isNew: false, shape })
    else if (shape.type === 'connector') setEditing({ id: shape.id, kind: 'label', isNew: false, shape })
  }
  const commitText = (text: string) => {
    // Escape commits and moves focus, and the blur that follows must not commit again.
    const current = editingRef.current
    if (!current) return
    editingRef.current = null
    setEditing(null)
    const { shape, isNew, kind } = current
    const trimmed = text.replace(/\s+$/, '')
    const now = scene.shapes.find((s) => s.id === shape.id)
    if (kind === 'text' && shape.type === 'text') {
      if (isNew) {
        if (trimmed) add({ ...shape, text: trimmed })
      } else if (!trimmed) remove([shape.id])
      else if (trimmed !== shape.text) commit({ ...scene, shapes: scene.shapes.map((s) => (s.id === shape.id ? { ...shape, text: trimmed } : s)) })
      return
    }
    if (!now) return
    if (now.type === 'sticky' && trimmed !== now.text) commit({ ...scene, shapes: scene.shapes.map((s) => (s.id === now.id ? { ...now, text: trimmed } : s)) })
    if (now.type === 'connector' && trimmed !== (now.label ?? '')) {
      commit({ ...scene, shapes: scene.shapes.map((s) => (s.id === now.id ? { ...now, label: trimmed || undefined } : s)) })
    }
  }

  // ── Arrange ──────────────────────────────────────────────────────────
  const align = (mode: WhiteboardAlign) => replace(alignShapes(selection, mode, lookup))
  const distribute = (mode: WhiteboardDistribute) => replace(distributeShapes(selection, mode, lookup))

  // ── Keyboard ─────────────────────────────────────────────────────────
  const keys = Object.fromEntries(TOOLS.filter((t) => offered.includes(t.tool)).map((t) => [t.key.toLowerCase(), t.tool])) as Record<string, WhiteboardTool>
  const nudge = (dx: number, dy: number) => {
    if (selection.length) replace(new Map(selection.map((s) => [s.id, moveShape(s, dx, dy)])))
  }
  const focusShape = (id: string) => {
    const el = shapeRefs.current.get(id)
    if (el) return (el as HTMLElement).focus()
    // Offscreen shapes aren't drawn: bring it into view, then focus it.
    const s = scene.shapes.find((sh) => sh.id === id)
    if (!s) return
    const b = boxOf(s)
    centerOn(b.x + b.w / 2, b.y + b.h / 2)
    select([id])
    requestAnimationFrame(() => (shapeRefs.current.get(id) as HTMLElement | undefined)?.focus())
  }

  const placeAtCenter = () => {
    const r = rect()
    const v = viewRef.current
    const cx = (r.width / 2 - v.x) / v.k
    const cy = (r.height / 2 - v.y) / v.k
    if (tool === 'text') {
      const shape: WhiteboardShape = { ...brush(), type: 'text', x: cx - 40, y: cy - 12, text: '' }
      return setEditing({ id: shape.id, kind: 'text', isNew: true, shape })
    }
    if (tool === 'sticky') return placeSticky(cx, cy)
    if (tool === 'comment') {
      const on = selection.find(attachable)
      const b = on && boxOf(on)
      return b ? placePin(b.x + b.w - 4, b.y + 4) : placePin(cx, cy)
    }
    if (tool === 'connector') {
      const ends = selection.filter(attachable)
      if (ends.length !== 2) return
      const shape = connect({ shape: ends[0]!.id }, { shape: ends[1]!.id })
      select([shape.id])
      requestAnimationFrame(() => focusShape(shape.id))
      return
    }
    const shape: WhiteboardShape | null =
      tool === 'line' || tool === 'arrow'
        ? { ...brush(), type: tool, x1: cx - 60, y1: cy, x2: cx + 60, y2: cy }
        : tool === 'rectangle' || tool === 'ellipse'
          ? { ...brush(), type: tool, x: cx - 60, y: cy - 40, w: 120, h: 80 }
          : tool === 'pen'
            ? { ...brush(), type: 'pen', points: [-50, -25, 0, 25, 50].map((dx, i): StrokePoint => [cx + dx, cy + (i % 2 ? 12 : -12), 0.6]) }
            : null
    if (!shape) return
    add(shape)
    select([shape.id])
    requestAnimationFrame(() => shapeRefs.current.get(shape.id) && (shapeRefs.current.get(shape.id) as HTMLElement).focus())
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement
    // Keys typed into a field, an embed's content or a popover (portalled outside the board) are theirs.
    if (!e.currentTarget.contains(el) || el.closest('input, textarea, [contenteditable="true"], [data-slot="whiteboard-embed-content"]')) return
    const onBoard = !!el.closest('[data-slot="whiteboard-surface"]')
    const meta = e.metaKey || e.ctrlKey
    const key = e.key.toLowerCase()
    if (meta && key === 'z') {
      e.preventDefault()
      if (interactive) restore(e.shiftKey ? 'future' : 'past')
    } else if (meta && key === 'y') {
      e.preventDefault()
      if (interactive) restore('future')
    } else if (meta && key === 'a' && onBoard) {
      e.preventDefault()
      select(scene.shapes.map((s) => s.id))
    } else if (meta) {
      return
    } else if (e.altKey && interactive) {
      // ⌥ + a letter aligns, ⌥⇧ + H or V distributes; read from the key's place (⌥ types a symbol on a Mac).
      const letter = e.code.replace(/^Key/, '')
      const dist = e.shiftKey && DISTRIBUTE.find((d) => d.key === letter)
      const al = !e.shiftKey && ALIGN.find((a) => a.key === letter)
      if (dist) distribute(dist.mode)
      else if (al) align(al.mode)
      else return
      e.preventDefault()
    } else if (e.key === '?') {
      setShortcutsOpen((open) => !open)
    } else if (e.shiftKey && (e.code === 'Digit1' || e.code === 'Digit2')) {
      e.preventDefault()
      if (e.code === 'Digit1') zoomToFit()
      else zoomToSelection()
    } else if (key === ' ' && !e.repeat && onBoard) {
      e.preventDefault()
      space.current = true
      setPanning(true)
    } else if (key === 'm' && !e.shiftKey) {
      setMinimap((on) => !on)
    } else if (keys[key] && !e.shiftKey) {
      setTool(keys[key])
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && interactive && selected.length) {
      e.preventDefault()
      remove(selected)
      surface.current?.focus()
    } else if (e.key === 'Escape' && selected.length) {
      select([])
      surface.current?.focus()
    } else if (onBoard) {
      const pans: Record<string, [number, number]> = { ArrowLeft: [PAN_STEP, 0], ArrowRight: [-PAN_STEP, 0], ArrowUp: [0, PAN_STEP], ArrowDown: [0, -PAN_STEP] }
      if (e.key === '+' || e.key === '=') zoomBy(ZOOM_STEP)
      else if (e.key === '-' || e.key === '_') zoomBy(1 / ZOOM_STEP)
      else if (e.key === '0') resetZoom()
      else if (pans[e.key] && el === surface.current) {
        e.preventDefault()
        const [dx, dy] = pans[e.key]!
        jump({ ...viewRef.current, x: viewRef.current.x + dx, y: viewRef.current.y + dy })
      } else if (e.key === 'Enter' && el === surface.current && interactive && DRAWING.includes(tool)) {
        e.preventDefault()
        placeAtCenter()
      }
    }
  }

  const onKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' && space.current) {
      space.current = false
      setPanning(false)
    }
  }

  // Shapes call back through one stable object, so a memoized note or title doesn't re-render for a new function.
  const latest = useRef({ select, selected, onShapeKeyDown: (_e: KeyboardEvent<Element>, _id: string) => {} })
  const onShapeKeyDown = (e: KeyboardEvent<Element>, id: string) => {
    const shape = shown.shapes.find((s) => s.id === id)
    if (!shape) return
    const step = e.shiftKey ? NUDGE_FAR : NUDGE
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (arrows[e.key] && interactive) {
      e.preventDefault()
      e.stopPropagation()
      nudge(...arrows[e.key]!)
    } else if (e.key === 'Tab') {
      // Tab walks the shapes, then leaves the board at either end.
      const i = shown.shapes.findIndex((s) => s.id === id)
      const next = shown.shapes[i + (e.shiftKey ? -1 : 1)]
      if (!next) return
      e.preventDefault()
      focusShape(next.id)
    } else if (e.key === 'Enter' && interactive) {
      e.preventDefault()
      edit(shape)
    }
  }
  latest.current = { select, selected, onShapeKeyDown }
  const handlers = useMemo<OptionHandlers>(
    () => ({
      focus: (id) => !latest.current.selected.includes(id) && latest.current.select([id]),
      keyDown: (e, id) => latest.current.onShapeKeyDown(e, id),
      register: (id, el) => {
        if (el) shapeRefs.current.set(id, el)
        else shapeRefs.current.delete(id)
      },
    }),
    [],
  )

  // ── Render ───────────────────────────────────────────────────────────
  // Only what's near the view is drawn; the selection, the shape being edited and embeds (which keep their state) always are.
  // The view is rounded (160px steps, quarter zoom octaves) and the margin is half a view, so panning re-renders the
  // shapes only when it crosses a step: in between, only the two layers' transforms change.
  const step = 160
  const zoomStep = Math.round(Math.log2(view.k) * 4)
  const nearKey = size.w ? `${Math.round(view.x / step)}:${Math.round(view.y / step)}:${zoomStep}:${size.w}:${size.h}` : ''
  const editingId = editing?.id
  const culled = useMemo(() => {
    if (!nearKey) return shown.shapes
    const [qx, qy] = nearKey.split(':').map(Number) as [number, number]
    const area = visibleBox({ x: qx * step, y: qy * step, k: 2 ** (zoomStep / 4) }, size.w, size.h)
    const near = { x: area.x - area.w * 0.5, y: area.y - area.h * 0.5, w: area.w * 2, h: area.h * 2 }
    return shown.shapes.filter((s) => s.type === 'embed' || selected.includes(s.id) || editingId === s.id || overlaps(boxes.get(s.id)!, near))
  }, [shown.shapes, nearKey, zoomStep, size, selected, editingId, boxes])
  const culledIds = new Set(culled.map((s) => s.id))
  const embedShapes = shown.shapes.filter((s): s is WhiteboardEmbed => s.type === 'embed')
  const tabStop = selection[0]?.id ?? shown.shapes[0]?.id

  // The shapes as elements, kept between renders that only move the view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: nameOf reads labels and the scene, both listed
  const drawingEls = useMemo(
    () =>
      culled
        .filter((s) => !isHtml(s) && !(editingId === s.id && editing?.kind === 'text'))
        .map((shape) => (
          <g
            key={shape.id}
            ref={(el) => handlers.register(shape.id, el)}
            role="option"
            data-slot="whiteboard-shape"
            data-yj-shape={shape.type}
            data-selected={selected.includes(shape.id) || undefined}
            aria-label={nameOf(shape)}
            aria-selected={selected.includes(shape.id)}
            tabIndex={shape.id === tabStop ? 0 : -1}
            onFocus={() => handlers.focus(shape.id)}
            onKeyDown={(e) => handlers.keyDown(e, shape.id)}
            className="outline-none"
          >
            <ShapeView shape={shape} route={shape.type === 'connector' ? routes.get(shape.id) : undefined} />
          </g>
        )),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nameOf reads labels and the scene, both listed
    [culled, selected, tabStop, editingId, editing?.kind, routes, labels, byId, handlers],
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: nameOf reads labels and the scene, both listed
  const noteEls = useMemo(
    () =>
      culled.filter(isHtml).map((shape) =>
        shape.type === 'sticky' ? (
          <StickyView
            key={shape.id}
            shape={shape}
            name={nameOf(shape)}
            selected={selected.includes(shape.id)}
            tabStop={shape.id === tabStop}
            hidden={editingId === shape.id}
            handlers={handlers}
          />
        ) : shape.type === 'embed' ? (
          <EmbedTitle key={shape.id} shape={shape} name={nameOf(shape)} selected={selected.includes(shape.id)} tabStop={shape.id === tabStop} handlers={handlers} />
        ) : null,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nameOf reads labels and the scene, both listed
    [culled, selected, tabStop, editingId, labels, byId, handlers],
  )
  const area = size.w ? visibleBox(view, size.w, size.h) : null

  const box = !draft || (drag.current?.kind !== 'create' && drag.current?.kind !== 'connect') ? unionBoxes(selection.map(boxOf)) : null
  const cursor =
    readOnly || tool === 'hand' || panning ? (drag.current?.kind === 'pan' ? 'cursor-grabbing' : 'cursor-grab') : tool === 'select' ? 'cursor-default' : tool === 'text' ? 'cursor-text' : 'cursor-crosshair'
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(view.k)
  const worldTransform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`
  // The grid's dots stay at least 12px apart on screen: zoomed out, every other row goes.
  let gridStep = GRID * view.k
  while (gridStep < 12) gridStep *= 2
  const pinPositions = new Map(pins.map((p): [string, Point] => {
    const [px, py] = pinPoint(p, lookup)
    return [p.id, [px * view.k + view.x, py * view.k + view.y]]
  }))
  const arrangeable = selection.filter((s) => s.type !== 'connector').length
  const selectedConnector = selection.find((s) => s.type === 'connector')
  const embedOf = (s: WhiteboardEmbed) => (typeof embeds === 'function' ? embeds(s) : embeds?.[s.id])
  const users = useMemo(
    () =>
      (cursors ?? []).map((c) => {
        if (c.x === undefined || c.y === undefined || !size.w) return { ...c, x: undefined, y: undefined }
        const fx = (c.x * view.k + view.x) / size.w
        const fy = (c.y * view.k + view.y) / size.h
        return fx < 0 || fx > 1 || fy < 0 || fy > 1 ? { ...c, x: undefined, y: undefined } : { ...c, x: fx, y: fy }
      }),
    [cursors, view, size],
  )
  const shortcuts = [
    { label: labels.whiteboardTools, keys: [TOOLS.filter((t) => offered.includes(t.tool)).map((t) => t.key).join(' ')] },
    { label: labels.undo, keys: [mod.mod, 'Z'] },
    { label: labels.redo, keys: ['⇧', mod.mod, 'Z'] },
    { label: labels.whiteboardSelectAll, keys: [mod.mod, 'A'] },
    { label: labels.whiteboardDelete, keys: ['Del'] },
    { label: labels.whiteboardNudge, keys: ['← ↑ → ↓'] },
    { label: labels.whiteboardPan, keys: ['Space'] },
    { label: labels.whiteboardArrange, keys: [mod.alt, 'A H D W V S'] },
    { label: `${labels.zoomIn}, ${labels.zoomOut}`, keys: ['+ −'] },
    { label: labels.zoomReset, keys: ['0'] },
    { label: labels.zoomToFit, keys: ['⇧', '1'] },
    { label: labels.whiteboardZoomToSelection, keys: ['⇧', '2'] },
    { label: labels.whiteboardMinimap, keys: ['M'] },
  ].filter((s) => interactive || ![labels.undo, labels.redo, labels.whiteboardDelete, labels.whiteboardNudge, labels.whiteboardArrange].includes(s.label))
  const editingShape = editing && (byId.get(editing.id) ?? editing.shape)
  const editingBox = editingShape && (editing!.kind === 'sticky' ? boundsOf(editingShape) : null)
  const editingRoute = editingShape?.type === 'connector' ? routes.get(editingShape.id) : null

  const surfaceEl = (
    <div
      ref={surface}
      data-slot="whiteboard-surface"
      role="group"
      aria-label={label ?? labels.whiteboard}
      aria-describedby={`${summaryId} ${interactive ? hintId : ''}`.trim()}
      tabIndex={shown.shapes.length ? -1 : 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => reportCursor(null)}
      onDoubleClick={onDoubleClick}
      className={cn('absolute inset-0 isolate touch-none overflow-hidden select-none outline-none own:focus-visible:inset-ring-2 focus-visible:inset-ring-focus', cursor)}
      style={{
        backgroundImage: 'radial-gradient(circle, color-mix(in oklab, var(--color-fg) 11%, transparent) 1px, transparent 1.5px)',
        backgroundSize: `${gridStep}px ${gridStep}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
    >
      <div role="listbox" aria-multiselectable aria-label={labels.whiteboardSummary(shown.shapes.length)} className="absolute inset-0">
        <svg role="none" data-slot="whiteboard-canvas" className="absolute inset-0 size-full overflow-visible">
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {drawingEls}
            {pen && <ShapeView shape={{ id: 'pen', type: 'pen', color, width, points: pen }} />}
          </g>
        </svg>
        {/* The physical world: a position means the same spot whatever the reading direction. */}
        <div
          dir="ltr"
          data-slot="whiteboard-layer"
          // youj-allow: physical side, the world layer is placed from the board's physical corner
          className="pointer-events-none absolute top-0 left-0 z-2 origin-top-left"
          style={{ transform: worldTransform }}
        >
          {noteEls}
        </div>
      </div>
      {embedShapes.length > 0 && (
        <div
          dir="ltr"
          data-slot="whiteboard-embeds"
          // youj-allow: physical side, the world layer is placed from the board's physical corner
          className="pointer-events-none absolute top-0 left-0 z-1 origin-top-left own:[&>section]:pointer-events-auto"
          style={{ transform: worldTransform }}
        >
          {embedShapes.map((shape) => (
            <EmbedContent key={shape.id} shape={shape} label={nameOf(shape)}>
              {embedOf(shape)}
            </EmbedContent>
          ))}
        </div>
      )}
      <Overlay
        view={view}
        target={target ? (boxes.get(target) ?? null) : null}
        selection={box}
        multiple={selection.length > 1}
        handles={interactive && !(selection.length === 1 && selection[0]!.type === 'connector')}
        snap={snap}
        marquee={marquee}
      />
      {pins.length > 0 && (
        <Pins
          labels={labels}
          pins={pins}
          positions={pinPositions}
          open={openPin}
          onOpenChange={setOpenPin}
          readOnly={readOnly}
          content={pinContent}
          onResolvedChange={(id, resolved) => setPins((scene.pins ?? []).map((p) => (p.id === id ? { ...p, resolved: resolved || undefined } : p)))}
          onDelete={(id) => {
            setOpenPin(null)
            setPins((scene.pins ?? []).filter((p) => p.id !== id))
            surface.current?.focus()
          }}
          onTextChange={(id, text) => setPins((scene.pins ?? []).map((p) => (p.id === id ? { ...p, text: text || undefined } : p)))}
        />
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <div
        ref={board}
        data-slot="whiteboard"
        data-yj-tool={tool}
        data-readonly={readOnly || undefined}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        className={cn('relative w-full min-w-0 overflow-hidden own:rounded-xl border own:border-line own:bg-surface own:text-fg', className)}
        style={{ height, ...style }}
        {...props}
      >
        {cursors ? (
          <LiveCursors users={users} className="absolute inset-0">
            {surfaceEl}
          </LiveCursors>
        ) : (
          surfaceEl
        )}

        {editing && editingShape && (
          <textarea
            autoFocus
            data-slot="whiteboard-text-editor"
            aria-label={editing.kind === 'sticky' ? labels.whiteboardSticky : editing.kind === 'label' ? labels.whiteboardConnector : labels.whiteboardText}
            placeholder={labels.whiteboardTextPlaceholder}
            defaultValue={editingShape.type === 'connector' ? (editingShape.label ?? '') : editingShape.type === 'text' || editingShape.type === 'sticky' ? editingShape.text : ''}
            rows={1}
            onBlur={(e) => commitText(e.currentTarget.value)}
            onKeyDown={(e) => {
              // A note takes new lines; Enter commits a text or a label (Shift+Enter breaks a text's line).
              if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey && editing.kind !== 'sticky') || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
                e.preventDefault()
                commitText(e.currentTarget.value)
                surface.current?.focus()
              }
            }}
            className={cn(
              // youj-allow: physical side, the editor is placed at the shape's world position in px
              'absolute top-0 left-0 field-sizing-content resize-none overflow-hidden font-sans outline-none placeholder:text-fg-subtle',
              editing.kind === 'text' && 'min-w-24 own:bg-transparent own:p-0 leading-[1.25]',
              editing.kind === 'sticky' && 'own:rounded-md own:text-fg',
              editing.kind === 'label' && 'min-w-20 -translate-x-1/2 -translate-y-1/2 own:rounded-full border own:border-line own:bg-surface own:px-2 text-center own:text-fg',
            )}
            style={
              editing.kind === 'sticky' && editingBox
                ? {
                    transform: `translate(${editingBox.x * view.k + view.x}px, ${editingBox.y * view.k + view.y}px)`,
                    width: editingBox.w * view.k,
                    minHeight: editingBox.h * view.k,
                    padding: STICKY.pad * view.k,
                    fontSize: STICKY.font * view.k,
                    lineHeight: STICKY.line,
                    background: PAPER[editingShape.color ?? 'ink'],
                  }
                : editing.kind === 'label' && editingRoute
                  ? {
                      left: editingRoute.mid[0] * view.k + view.x,
                      top: editingRoute.mid[1] * view.k + view.y,
                      fontSize: Math.max(12, LABEL_FONT * view.k),
                    }
                  : editingShape.type === 'text'
                    ? {
                        transform: `translate(${editingShape.x * view.k + view.x}px, ${editingShape.y * view.k + view.y}px)`,
                        fontSize: FONT_SIZES[editingShape.width] * view.k,
                        color: COLORS[editingShape.color],
                      }
                    : undefined
            }
          />
        )}

        {interactive && offered.length > 0 && (
          <div className="pointer-events-none absolute inset-x-3 top-3 own:flex justify-center">
            <div className="pointer-events-auto max-w-full">
              <WhiteboardToolbar
                labels={labels}
                tools={offered}
                tool={tool}
                onToolChange={setTool}
                color={color}
                onColorChange={(c) => {
                  setColor(c)
                  if (selection.length) replace(new Map(selection.map((s) => [s.id, { ...s, color: c }])))
                }}
                width={width}
                onWidthChange={(w) => {
                  setWidth(w)
                  if (selection.length) replace(new Map(selection.map((s) => [s.id, { ...s, width: w }])))
                }}
                route={tool === 'connector' || selectedConnector ? ((selectedConnector?.type === 'connector' && selectedConnector.route) || route) : null}
                onRouteChange={(r) => {
                  setRoute(r)
                  const connectors = selection.filter((s) => s.type === 'connector')
                  if (connectors.length) replace(new Map(connectors.map((s) => [s.id, { ...s, route: r }])))
                }}
                arrangeable={arrangeable}
                onAlign={align}
                onDistribute={distribute}
                canDelete={selected.length > 0}
                onDelete={() => remove(selected)}
                alt={mod.alt}
              />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 own:flex items-end justify-between gap-3">
          <div className="pointer-events-auto">
            <ZoomBar
              labels={labels}
              view={view}
              percent={percent}
              canFit={scene.shapes.length > 0}
              canFitSelection={selection.length > 0}
              minimap={minimap}
              onMinimapChange={setMinimap}
              snapToGrid={snapToGrid}
              onSnapToGridChange={setSnapToGrid}
              showSnap={interactive}
              onZoomIn={() => zoomBy(ZOOM_STEP)}
              onZoomOut={() => zoomBy(1 / ZOOM_STEP)}
              onZoomReset={resetZoom}
              onZoomToFit={() => zoomToFit()}
              onZoomToSelection={zoomToSelection}
              shortcuts={shortcuts}
              shortcutsOpen={shortcutsOpen}
              onShortcutsOpenChange={setShortcutsOpen}
              history={
                interactive
                  ? { canUndo: history.past.length > 0, canRedo: history.future.length > 0, onUndo: () => restore('past'), onRedo: () => restore('future'), mod: mod.mod }
                  : undefined
              }
            />
          </div>
          {minimap && area && (
            <div className="pointer-events-auto">
              <Minimap shapes={shown.shapes} boxes={boxes} visible={area} onNavigate={(x, y) => centerOn(x, y)} />
            </div>
          )}
        </div>

        <span id={summaryId} className="sr-only">
          {labels.whiteboardSummary(scene.shapes.length)}
        </span>
        <span id={hintId} className="sr-only">
          {labels.whiteboardHint}
        </span>
        {announcer}
      </div>
    </TooltipProvider>
  )
}

export { Whiteboard }
export type { WhiteboardCursor, WhiteboardHandle, WhiteboardProps }
