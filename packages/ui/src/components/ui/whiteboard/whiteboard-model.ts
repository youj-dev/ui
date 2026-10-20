import { strokePath, type StrokePoint } from '../../../hooks/use-stroke'

/* The Whiteboard's scene as plain, serializable data, and the geometry the
 * board needs on it: bounds, hit tests, moves, resizes, connector routes and
 * the SVG each shape draws (on screen and in an export). Coordinates are the
 * board's own world units (a pixel at 100% zoom).
 * The format only ever grows: a scene saved before stickies, connectors,
 * embeds and pins existed (`{ shapes }` of the first six kinds) is still a
 * valid scene, so nothing needs migrating. */

type WhiteboardTool = 'select' | 'hand' | 'pen' | 'line' | 'arrow' | 'rectangle' | 'ellipse' | 'text' | 'sticky' | 'connector' | 'comment'
type WhiteboardColor = 'ink' | 'accent' | 'red' | 'amber' | 'green' | 'blue'
type WhiteboardStrokeWidth = 'thin' | 'medium' | 'bold'
/** A connector runs straight from one end to the other, or in right angles (`elbow`). */
type WhiteboardConnectorRoute = 'straight' | 'elbow'
/** A connector's end: attached to a shape (it follows the shape) or a free point on the board. */
type WhiteboardConnectorEnd = { shape: string } | { x: number; y: number }

interface ShapeStyle {
  id: string
  color: WhiteboardColor
  width: WhiteboardStrokeWidth
}

type WhiteboardShape =
  | (ShapeStyle & { type: 'pen'; points: StrokePoint[] })
  | (ShapeStyle & { type: 'line' | 'arrow'; x1: number; y1: number; x2: number; y2: number })
  | (ShapeStyle & { type: 'rectangle' | 'ellipse'; x: number; y: number; w: number; h: number })
  | (ShapeStyle & { type: 'text'; x: number; y: number; text: string })
  /** A sticky note: `h` is its least height, and it grows to fit its text. */
  | (ShapeStyle & { type: 'sticky'; x: number; y: number; w: number; h: number; text: string })
  /** A line between two shapes (or points) that re-routes when either moves, with an optional label. */
  | (ShapeStyle & { type: 'connector'; from: WhiteboardConnectorEnd; to: WhiteboardConnectorEnd; route?: WhiteboardConnectorRoute; label?: string })
  /** A frame for any React node, drawn by the board's `embeds` (keyed by this id), with a title bar. */
  | (Partial<Omit<ShapeStyle, 'id'>> & { id: string; type: 'embed'; x: number; y: number; w: number; h: number; title?: string })

/** A comment pinned to the board: at `x`, `y`, or, with `shape`, at that offset from the shape's top-left corner, so it moves with it. */
interface WhiteboardPin {
  id: string
  x: number
  y: number
  shape?: string
  resolved?: boolean
  /** Who started the thread: their initials mark the pin. */
  author?: string
  /** The first comment, when the board's own note editor wrote it. */
  text?: string
}

/** A board's contents: JSON in, JSON out. */
interface WhiteboardScene {
  shapes: WhiteboardShape[]
  pins?: WhiteboardPin[]
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

type Point = [number, number]
type Lookup = (id: string) => WhiteboardShape | undefined
type WhiteboardEmbed = Extract<WhiteboardShape, { type: 'embed' }>
type Connector = Extract<WhiteboardShape, { type: 'connector' }>
type Sticky = Extract<WhiteboardShape, { type: 'sticky' }>

/** Each palette color is a theme role, so a board follows the theme it sits in. */
const COLORS: Record<WhiteboardColor, string> = {
  ink: 'var(--color-fg)',
  accent: 'var(--color-accent)',
  red: 'var(--color-danger)',
  amber: 'var(--color-warning)',
  green: 'var(--color-success)',
  blue: 'var(--color-info)',
}

/**
 * A sticky note's paper: its color's role mixed into the surface. Opaque, so the grid doesn't show through, and
 * stronger in dark (the role's `-subtle` wash alone turns a hue muddy on a dark canvas).
 */
const paper = (role: string) => `color-mix(in oklab, var(--color-${role}) calc(16% + 12% * var(--yj-dark, 0)), var(--color-surface))`
const PAPER: Record<WhiteboardColor, string> = {
  ink: 'color-mix(in oklab, var(--color-fg) calc(6% + 4% * var(--yj-dark, 0)), var(--color-surface))',
  accent: paper('accent'),
  red: paper('danger'),
  amber: paper('warning'),
  green: paper('success'),
  blue: paper('info'),
}

/** Stroke widths in world units, and a text shape's font size at each. */
const WIDTHS: Record<WhiteboardStrokeWidth, number> = { thin: 2, medium: 3.5, bold: 6 }
const FONT_SIZES: Record<WhiteboardStrokeWidth, number> = { thin: 16, medium: 22, bold: 30 }

/** A sticky's type, padding and default size; an embed's title bar; a connector label's type. */
const STICKY = { font: 15, line: 1.4, pad: 14, w: 200, h: 132 }
const EMBED_TITLE = 32
const LABEL_FONT = 13

const EMPTY_SCENE: WhiteboardScene = { shapes: [] }

let counter = 0
const newId = () => `s${Date.now().toString(36)}${(counter++).toString(36)}`

const widthOf = (shape: WhiteboardShape) => WIDTHS[shape.width ?? 'medium']
const isPoint = (end: WhiteboardConnectorEnd): end is { x: number; y: number } => !('shape' in end)
/** Shapes a connector or a pin can attach to: anything with an area. */
const attachable = (shape: WhiteboardShape) => shape.type !== 'connector' && shape.type !== 'line' && shape.type !== 'arrow'

/** A rough line width of `text` in a font of `size`: the board has no layout engine, so it uses an average glyph advance. */
const advance = (text: string, size: number) => text.length * size * 0.56

/** Breaks `text` into the lines that fit `width` at `size`, at spaces where it can. */
function wrapLines(text: string, width: number, size: number): string[] {
  const max = Math.max(1, Math.floor(width / (size * 0.56)))
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(' ')) {
      const next = line ? `${line} ${word}` : word
      if (next.length <= max) line = next
      else {
        if (line) lines.push(line)
        let rest = word
        while (rest.length > max) {
          lines.push(rest.slice(0, max))
          rest = rest.slice(max)
        }
        line = rest
      }
    }
    lines.push(line)
  }
  return lines
}

/** A sticky's lines and its box, grown to fit them. */
function stickyLayout(shape: Sticky) {
  const lines = shape.text ? wrapLines(shape.text, shape.w - STICKY.pad * 2, STICKY.font) : []
  const h = Math.max(shape.h, STICKY.pad * 2 + lines.length * STICKY.font * STICKY.line)
  return { lines, box: { x: shape.x, y: shape.y, w: shape.w, h } }
}

/** A text shape's box, from its font size and an average glyph advance. */
function textBox(shape: Extract<WhiteboardShape, { type: 'text' }>): Box {
  const size = FONT_SIZES[shape.width]
  const lines = shape.text.split('\n')
  const longest = Math.max(1, ...lines.map((l) => l.length))
  return { x: shape.x, y: shape.y, w: longest * size * 0.56, h: lines.length * size * 1.25 }
}

/** Where a connector's end sits before it is clipped: a shape's box (and whether it is round), or a point. */
function endTarget(end: WhiteboardConnectorEnd, lookup: Lookup): { box: Box; round: boolean } | null {
  if (isPoint(end)) return { box: { x: end.x, y: end.y, w: 0, h: 0 }, round: false }
  const shape = lookup(end.shape)
  if (!shape || shape.type === 'connector') return null
  return { box: boundsOf(shape, lookup), round: shape.type === 'ellipse' }
}

const centerOf = (b: Box): Point => [b.x + b.w / 2, b.y + b.h / 2]

/** The point where a ray from the box's center toward `toward` leaves the box (or the ellipse inside it). */
function clipToBorder(box: Box, round: boolean, toward: Point, gap = 0): Point {
  const [cx, cy] = centerOf(box)
  const dx = toward[0] - cx
  const dy = toward[1] - cy
  const rx = box.w / 2 + gap
  const ry = box.h / 2 + gap
  if ((!dx && !dy) || (!box.w && !box.h)) return [cx, cy]
  const t = round
    ? 1 / Math.sqrt((dx / Math.max(rx, 0.001)) ** 2 + (dy / Math.max(ry, 0.001)) ** 2)
    : Math.min(dx ? rx / Math.abs(dx) : Number.POSITIVE_INFINITY, dy ? ry / Math.abs(dy) : Number.POSITIVE_INFINITY)
  return [cx + dx * Math.min(1, t), cy + dy * Math.min(1, t)]
}

/**
 * A connector's route from the shapes it joins as they are now: its points
 * and the spot its label sits on. Straight runs center to center, clipped at
 * each shape's edge. Elbow leaves the side that faces the other shape and
 * turns once halfway across the gap; shapes that overlap get a straight line.
 * `null` when an attached shape is gone.
 */
function connectorRoute(shape: Connector, lookup: Lookup): { points: Point[]; mid: Point } | null {
  const a = endTarget(shape.from, lookup)
  const b = endTarget(shape.to, lookup)
  if (!a || !b) return null
  const gap = 3
  if (shape.route === 'elbow') {
    const A = a.box
    const B = b.box
    const gapX = Math.max(B.x - (A.x + A.w), A.x - (B.x + B.w))
    const gapY = Math.max(B.y - (A.y + A.h), A.y - (B.y + B.h))
    const [ax, ay] = centerOf(A)
    const [bx, by] = centerOf(B)
    // Apart on both axes: one turn, leaving A's side toward B and entering B from above or below.
    if (gapX > 0 && gapY > 0) {
      const sx = bx > ax ? A.x + A.w + (A.w ? gap : 0) : A.x - (A.w ? gap : 0)
      const ey = by > ay ? B.y - (B.h ? gap : 0) : B.y + B.h + (B.h ? gap : 0)
      return { points: [[sx, ay], [bx, ay], [bx, ey]], mid: [(sx + bx) / 2, ay] }
    }
    if (gapX > 0) {
      const dir = bx > ax ? 1 : -1
      const sx = dir > 0 ? A.x + A.w + (A.w ? gap : 0) : A.x - (A.w ? gap : 0)
      const ex = dir > 0 ? B.x - (B.w ? gap : 0) : B.x + B.w + (B.w ? gap : 0)
      const mx = (sx + ex) / 2
      const points: Point[] = ay === by ? [[sx, ay], [ex, by]] : [[sx, ay], [mx, ay], [mx, by], [ex, by]]
      return { points, mid: [mx, (ay + by) / 2] }
    }
    if (gapY > 0) {
      const dir = by > ay ? 1 : -1
      const sy = dir > 0 ? A.y + A.h + (A.h ? gap : 0) : A.y - (A.h ? gap : 0)
      const ey = dir > 0 ? B.y - (B.h ? gap : 0) : B.y + B.h + (B.h ? gap : 0)
      const my = (sy + ey) / 2
      const points: Point[] = ax === bx ? [[ax, sy], [bx, ey]] : [[ax, sy], [ax, my], [bx, my], [bx, ey]]
      return { points, mid: [(ax + bx) / 2, my] }
    }
  }
  const start = clipToBorder(a.box, a.round, centerOf(b.box), a.box.w ? gap : 0)
  const end = clipToBorder(b.box, b.round, centerOf(a.box), b.box.w ? gap : 0)
  return { points: [start, end], mid: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2] }
}

/** A connector label's pill, centered on the route's midpoint. */
function labelBox(label: string, mid: Point): Box {
  const w = advance(label, LABEL_FONT) + 16
  const h = LABEL_FONT + 10
  return { x: mid[0] - w / 2, y: mid[1] - h / 2, w, h }
}

function pointsBox(points: readonly Point[]): Box {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

/** The shape's box. A connector needs `lookup` to find the shapes it joins. */
function boundsOf(shape: WhiteboardShape, lookup: Lookup = () => undefined): Box {
  switch (shape.type) {
    case 'pen':
      return pointsBox(shape.points.map(([x, y]): Point => [x, y]))
    case 'line':
    case 'arrow':
      return pointsBox([
        [shape.x1, shape.y1],
        [shape.x2, shape.y2],
      ])
    case 'text':
      return textBox(shape)
    case 'sticky':
      return stickyLayout(shape).box
    case 'connector': {
      const route = connectorRoute(shape, lookup)
      if (!route) return { x: 0, y: 0, w: 0, h: 0 }
      return route.points.length ? pointsBox(route.points) : { x: 0, y: 0, w: 0, h: 0 }
    }
    default:
      return { x: shape.x, y: shape.y, w: shape.w, h: shape.h }
  }
}

function unionBoxes(boxes: readonly Box[]): Box | null {
  if (!boxes.length) return null
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y }
}

function unionBounds(shapes: readonly WhiteboardShape[], lookup?: Lookup): Box | null {
  return unionBoxes(shapes.map((s) => boundsOf(s, lookup)))
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const t = dx || dy ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy))) : 0
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

const nearPolyline = (points: readonly Point[], x: number, y: number, reach: number) =>
  points.some((p, i) => {
    const q = points[i + 1] ?? p
    return distanceToSegment(x, y, p[0], p[1], q[0], q[1]) <= reach
  })

const inBox = (b: Box, x: number, y: number, pad = 0) => x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad

/** Whether a point lands on the shape: on a line or a stroke within `tolerance`, anywhere inside a box, an ellipse, a note, an embed or a text. */
function hitTest(shape: WhiteboardShape, x: number, y: number, tolerance: number, lookup?: Lookup) {
  const reach = tolerance + widthOf(shape) / 2
  switch (shape.type) {
    case 'pen':
      return nearPolyline(
        shape.points.map(([px, py]): Point => [px, py]),
        x,
        y,
        reach,
      )
    case 'line':
    case 'arrow':
      return distanceToSegment(x, y, shape.x1, shape.y1, shape.x2, shape.y2) <= reach
    case 'connector': {
      const route = lookup && connectorRoute(shape, lookup)
      if (!route) return false
      return nearPolyline(route.points, x, y, reach) || (!!shape.label && inBox(labelBox(shape.label, route.mid), x, y))
    }
    case 'ellipse': {
      const rx = shape.w / 2 + reach
      const ry = shape.h / 2 + reach
      return ((x - shape.x - shape.w / 2) / rx) ** 2 + ((y - shape.y - shape.h / 2) / ry) ** 2 <= 1
    }
    case 'sticky':
    case 'embed':
      return inBox(boundsOf(shape), x, y)
    default:
      return inBox(boundsOf(shape), x, y, reach)
  }
}

/** Whether the shape lies wholly inside a marquee. */
function insideBox(shape: WhiteboardShape, box: Box, lookup?: Lookup) {
  const b = boundsOf(shape, lookup)
  return b.x >= box.x && b.y >= box.y && b.x + b.w <= box.x + box.w && b.y + b.h <= box.y + box.h
}

const moveEnd = (end: WhiteboardConnectorEnd, dx: number, dy: number): WhiteboardConnectorEnd => (isPoint(end) ? { x: end.x + dx, y: end.y + dy } : end)

function moveShape(shape: WhiteboardShape, dx: number, dy: number): WhiteboardShape {
  switch (shape.type) {
    case 'pen':
      return { ...shape, points: shape.points.map(([x, y, p]): StrokePoint => [x + dx, y + dy, p]) }
    case 'line':
    case 'arrow':
      return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy }
    case 'connector':
      // Attached ends stay with their shapes; free ends move.
      return { ...shape, from: moveEnd(shape.from, dx, dy), to: moveEnd(shape.to, dx, dy) }
    default:
      return { ...shape, x: shape.x + dx, y: shape.y + dy }
  }
}

/** Maps a shape from one box onto another, as a resize handle drags the selection's box. A text keeps its size and moves with its corner. */
function resizeShape(shape: WhiteboardShape, from: Box, to: Box): WhiteboardShape {
  const sx = from.w ? to.w / from.w : 1
  const sy = from.h ? to.h / from.h : 1
  const mx = (x: number) => to.x + (x - from.x) * sx
  const my = (y: number) => to.y + (y - from.y) * sy
  const mapEnd = (end: WhiteboardConnectorEnd): WhiteboardConnectorEnd => (isPoint(end) ? { x: mx(end.x), y: my(end.y) } : end)
  switch (shape.type) {
    case 'pen':
      return { ...shape, points: shape.points.map(([x, y, p]): StrokePoint => [mx(x), my(y), p]) }
    case 'line':
    case 'arrow':
      return { ...shape, x1: mx(shape.x1), y1: my(shape.y1), x2: mx(shape.x2), y2: my(shape.y2) }
    case 'text':
      return { ...shape, x: mx(shape.x), y: my(shape.y) }
    case 'connector':
      return { ...shape, from: mapEnd(shape.from), to: mapEnd(shape.to) }
    case 'sticky':
      // A note keeps a readable least size.
      return { ...shape, x: mx(shape.x), y: my(shape.y), w: Math.max(80, shape.w * sx), h: Math.max(48, shape.h * sy) }
    case 'embed':
      return { ...shape, x: mx(shape.x), y: my(shape.y), w: Math.max(120, shape.w * sx), h: Math.max(EMBED_TITLE + 40, shape.h * sy) }
    default:
      return { ...shape, x: mx(shape.x), y: my(shape.y), w: shape.w * sx, h: shape.h * sy }
  }
}

/** Removes shapes, the connectors attached to them, and lets go of the pins they carried (each stays where it was). */
function removeShapes(scene: WhiteboardScene, ids: readonly string[]): WhiteboardScene {
  const gone = new Set(ids)
  const byId = new Map(scene.shapes.map((s) => [s.id, s]))
  const attachedTo = (end: WhiteboardConnectorEnd) => !isPoint(end) && gone.has(end.shape)
  const shapes = scene.shapes.filter((s) => !gone.has(s.id) && !(s.type === 'connector' && (attachedTo(s.from) || attachedTo(s.to))))
  if (!scene.pins) return { ...scene, shapes }
  const pins = scene.pins.map((p) => {
    if (!p.shape || !gone.has(p.shape)) return p
    const at = pinPoint(p, (id) => byId.get(id))
    return { ...p, shape: undefined, x: at[0], y: at[1] }
  })
  return { ...scene, shapes, pins }
}

/** A pin's spot on the board, following the shape it is attached to. */
function pinPoint(pin: WhiteboardPin, lookup: Lookup): Point {
  const shape = pin.shape ? lookup(pin.shape) : undefined
  if (!shape) return [pin.x, pin.y]
  const b = boundsOf(shape, lookup)
  return [b.x + pin.x, b.y + pin.y]
}

/** A box from two corners, in any order. */
function boxFrom(x1: number, y1: number, x2: number, y2: number): Box {
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) }
}

/** The two barbs of an arrow's head at (x2, y2), coming from (x1, y1), as one open path. */
function headPath(x1: number, y1: number, x2: number, y2: number, width: number) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const length = Math.min(Math.hypot(x2 - x1, y2 - y1) / 2, 10 + width * 2.5)
  const barb = (turn: number) => `${round(x2 - Math.cos(angle + turn) * length)},${round(y2 - Math.sin(angle + turn) * length)}`
  return `M${barb(0.45)}L${round(x2)},${round(y2)}L${barb(-0.45)}`
}

function arrowHead(shape: Extract<WhiteboardShape, { x1: number }>) {
  return headPath(shape.x1, shape.y1, shape.x2, shape.y2, WIDTHS[shape.width])
}

/** A connector's line and arrowhead as one path. */
function connectorPath(shape: Connector, points: readonly Point[]) {
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${round(x)},${round(y)}`).join('')
  const [p, q] = [points.at(-2)!, points.at(-1)!]
  return `${line}${headPath(p[0], p[1], q[0], q[1], WIDTHS[shape.width])}`
}

const round = (n: number) => Math.round(n * 100) / 100

/** A pen shape's ink as one filled path. */
const penPath = (shape: Extract<WhiteboardShape, { type: 'pen' }>) => strokePath(shape.points, { size: WIDTHS[shape.width] * 1.6, thinning: 0.5 })

/** Resolves a `var(--color-…)` to a color the export can carry. */
type Paint = (value: string) => string

/** The shape as SVG markup, its colors resolved by `paint` (the export reads the computed theme colors). */
function shapeMarkup(shape: WhiteboardShape, paint: Paint, lookup: Lookup = () => undefined): string {
  const stroke = paint(COLORS[shape.color ?? 'ink'])
  const line = `fill="none" stroke="${stroke}" stroke-width="${widthOf(shape)}" stroke-linecap="round" stroke-linejoin="round"`
  const font = 'font-family="system-ui, sans-serif"'
  switch (shape.type) {
    case 'pen':
      return `<path d="${penPath(shape)}" fill="${stroke}"/>`
    case 'line':
      return `<path d="M${round(shape.x1)},${round(shape.y1)}L${round(shape.x2)},${round(shape.y2)}" ${line}/>`
    case 'arrow':
      return `<path d="M${round(shape.x1)},${round(shape.y1)}L${round(shape.x2)},${round(shape.y2)}${arrowHead(shape)}" ${line}/>`
    case 'rectangle':
      return `<rect x="${round(shape.x)}" y="${round(shape.y)}" width="${round(shape.w)}" height="${round(shape.h)}" rx="${Math.min(8, shape.w / 4, shape.h / 4)}" ${line}/>`
    case 'ellipse':
      return `<ellipse cx="${round(shape.x + shape.w / 2)}" cy="${round(shape.y + shape.h / 2)}" rx="${round(shape.w / 2)}" ry="${round(shape.h / 2)}" ${line}/>`
    case 'text': {
      const size = FONT_SIZES[shape.width]
      const lines = shape.text
        .split('\n')
        .map((l, i) => `<tspan x="${round(shape.x)}" dy="${i ? size * 1.25 : size}">${escapeXml(l)}</tspan>`)
        .join('')
      return `<text x="${round(shape.x)}" y="${round(shape.y)}" fill="${stroke}" ${font} font-size="${size}">${lines}</text>`
    }
    case 'sticky': {
      const { lines, box } = stickyLayout(shape)
      const x = round(box.x + STICKY.pad)
      const text = lines.map((l, i) => `<tspan x="${x}" dy="${i ? STICKY.font * STICKY.line : STICKY.font}">${escapeXml(l)}</tspan>`).join('')
      return `<rect x="${round(box.x)}" y="${round(box.y)}" width="${round(box.w)}" height="${round(box.h)}" rx="6" fill="${paint(PAPER[shape.color])}"/><text x="${x}" y="${round(box.y + STICKY.pad - 2)}" fill="${paint('var(--color-fg)')}" ${font} font-size="${STICKY.font}">${text}</text>`
    }
    case 'connector': {
      const route = connectorRoute(shape, lookup)
      if (!route) return ''
      const path = `<path d="${connectorPath(shape, route.points)}" ${line}/>`
      if (!shape.label) return path
      const b = labelBox(shape.label, route.mid)
      return `${path}<rect x="${round(b.x)}" y="${round(b.y)}" width="${round(b.w)}" height="${round(b.h)}" rx="${round(b.h / 2)}" fill="${paint('var(--color-surface)')}" stroke="${paint('var(--color-line)')}"/><text x="${round(route.mid[0])}" y="${round(route.mid[1] + LABEL_FONT * 0.35)}" text-anchor="middle" fill="${paint('var(--color-fg-muted)')}" ${font} font-size="${LABEL_FONT}">${escapeXml(shape.label)}</text>`
    }
    case 'embed': {
      // Live content can't travel in an SVG: the frame and its title stand in for it.
      const muted = paint('var(--color-fg-muted)')
      return `<g data-yj-embed="${escapeXml(shape.id)}"><rect x="${round(shape.x)}" y="${round(shape.y)}" width="${round(shape.w)}" height="${round(shape.h)}" rx="10" fill="${paint('var(--color-surface)')}" stroke="${paint('var(--color-line)')}"/><text x="${round(shape.x + 14)}" y="${round(shape.y + EMBED_TITLE / 2 + 4.5)}" fill="${muted}" ${font} font-size="13">${escapeXml(shape.title ?? '')}</text><path d="M${round(shape.x)},${round(shape.y + EMBED_TITLE)}h${round(shape.w)}" stroke="${paint('var(--color-line)')}"/></g>`
    }
  }
}

/** The whole scene as a standalone SVG document, cropped to its contents with a margin. */
function sceneToSVG(scene: WhiteboardScene, paint: Paint, padding = 24): string {
  const byId = new Map(scene.shapes.map((s) => [s.id, s]))
  const lookup: Lookup = (id) => byId.get(id)
  const box = unionBounds(scene.shapes, lookup) ?? { x: 0, y: 0, w: 0, h: 0 }
  const x = round(box.x - padding)
  const y = round(box.y - padding)
  const w = round(box.w + padding * 2)
  const h = round(box.h + padding * 2)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}">${scene.shapes.map((s) => shapeMarkup(s, paint, lookup)).join('')}</svg>`
}

function escapeXml(text: string) {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

export {
  COLORS,
  EMBED_TITLE,
  EMPTY_SCENE,
  FONT_SIZES,
  LABEL_FONT,
  PAPER,
  STICKY,
  WIDTHS,
  arrowHead,
  attachable,
  boundsOf,
  boxFrom,
  connectorPath,
  connectorRoute,
  hitTest,
  inBox,
  insideBox,
  isPoint,
  labelBox,
  moveShape,
  newId,
  penPath,
  pinPoint,
  removeShapes,
  resizeShape,
  sceneToSVG,
  shapeMarkup,
  stickyLayout,
  unionBounds,
  unionBoxes,
  wrapLines,
}
export type {
  Box,
  Connector,
  WhiteboardEmbed,
  Lookup,
  Point,
  Sticky,
  WhiteboardColor,
  WhiteboardConnectorEnd,
  WhiteboardConnectorRoute,
  WhiteboardPin,
  WhiteboardScene,
  WhiteboardShape,
  WhiteboardStrokeWidth,
  WhiteboardTool,
}
