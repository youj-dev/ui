/* The entrances' reading of a demo: one pass over the live DOM, before anything moves, that turns it into a plan.
 * Every read (rects, computed styles, text line boxes, token colours) happens here, batched, so the frame loop
 * never touches layout. Parts are classified by role, tag and data-slot first and geometry second; what can't be
 * classified is left out of the draft and simply inks with the wipe. */

export type Kind = 'surface' | 'field' | 'text' | 'icon' | 'chart' | 'media' | 'control' | 'divider' | 'row'

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface Part extends Box {
  kind: Kind
  el: Element
  /** A circle (avatar, dot): drafted round with a centre mark. */
  round: boolean
  /** Text: one baseline per line box, with the cap height above it. */
  lines?: (Box & { cap: number })[]
  /** Divider: which edge carries the rule. */
  edge?: 'top' | 'bottom' | 'left' | 'right'
  /** What it is called: its data-slot, else its role, else its tag. */
  name: string
  tag: string
  role: string
  /** The box values it applies, colours as token names where the theme has one. */
  style: Style
  /** Text: the element's own box (its lines may not fill it). */
  at?: Box
  /** Text: its words, size, line height and weight. */
  words?: string
  type?: { fs: number; lh: number; weight: string }
  /** A link (an `a` or role=link) rather than a button. */
  link?: boolean
  /** A divider that is an element of its own (an `hr`), rather than one side of a box's border. */
  own?: boolean
  /** The surface, field, control or row it sits on, if any: what has to be there before it. */
  host?: Part
  /** Inside a row: the row draws it as one line, so it only appears when the type is set. */
  quiet?: boolean
  /** A filled box's tone, 0 (as light as the page) to 1 (as far from it as ink); media is screened instead. */
  tone?: number
  /** Text: each line's words where the page set them, and the face to set them in. */
  glyphs?: Glyph[]
  light?: boolean
  font?: string
  spacing?: string
  /** An icon's or chart's own shapes, to trace in ink. */
  shapes?: Shape[]
}

export interface Glyph extends Box {
  s: string
}

export interface Shape {
  path: Path2D
  /** From the shape's own units to the frame's CSS pixels. */
  m: DOMMatrix
  stroke: boolean
  fill: boolean
  lw: number
  cap: CanvasLineCap
  join: CanvasLineJoin
  /** The element itself, and its length when it is a stroke (for drawing it on). */
  el: SVGGeometryElement
  len: number
}

export interface Style {
  radius: number
  pad: [number, number, number, number]
  gap: number
  fill?: string
  line?: string
  shadow: boolean
  /** The colour of its text or strokes. */
  ink?: string
}

export interface Region extends Box {
  /** Its data-slot, else its label, its role or its tag. */
  name: string
  style: Style
}

export interface Plan extends Box {
  rtl: boolean
  /** Screen pixels per CSS pixel of the demo (below 1 when it's shown scaled down). */
  scale: number
  parts: Part[]
  regions: Region[]
  /** Elements that fade in at the ink but are never drafted (open popovers, blurred glows). */
  floating: Element[]
  style: Style
}

/** Most parts a screen drafts; past it the smallest are left to the wipe. */
const MAX_PARTS = 280
const ICON_MAX = 40

const ROW_ROLE = /^(row|listitem|option|menuitem|menuitemcheckbox|menuitemradio|treeitem)$/
const CONTROL_ROLE = /^(button|switch|checkbox|tab|radio|slider|link)$/
const FIELD_ROLE = /^(combobox|textbox|searchbox|spinbutton)$/
const REGION_TAG = /^(header|nav|main|aside|footer|section|form|article|table|ul|ol|fieldset)$/
const px = (v: string) => Number.parseFloat(v) || 0
const transparent = (c: string) => !c || c === 'transparent' || /^rgba\(.*,\s*0\)$/.test(c) || / \/ 0\)$/.test(c)
const area = (b: Box) => b.w * b.h

function ownText(el: Element) {
  for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent!.trim()) return true
  return false
}

/** The element's own text as line boxes (a paragraph that wraps gives one per line), relative to the frame. */
function textLines(el: Element, ox: number, oy: number, k: number, fs: number) {
  const range = document.createRange()
  const lines: (Box & { cap: number })[] = []
  for (const n of el.childNodes) {
    if (n.nodeType !== 3 || !n.textContent!.trim()) continue
    range.selectNodeContents(n)
    for (const r of range.getClientRects()) {
      if (r.width < 1) continue
      const prev = lines.find((l) => Math.abs(l.y - (r.top - oy) / k) < 2)
      if (prev) {
        const right = Math.max(prev.x + prev.w, (r.right - ox) / k)
        prev.x = Math.min(prev.x, (r.left - ox) / k)
        prev.w = right - prev.x
      } else lines.push({ x: (r.left - ox) / k, y: (r.top - oy) / k, w: r.width / k, h: r.height / k, cap: fs * 0.72 })
    }
  }
  range.detach()
  return lines
}

/** An icon's or chart's drawable shapes as paths, with the transform from their units to the frame. */
function shapesOf(svg: Element, ox: number, oy: number, k: number) {
  const out: Shape[] = []
  if (typeof Path2D !== 'function') return out
  for (const el of svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse')) {
    if (out.length >= 300) break
    if (el.closest('defs, clipPath, mask, pattern, marker, symbol')) continue
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    const ctm = (el as SVGGraphicsElement).getScreenCTM?.()
    if (!ctm) continue
    const len = (name: string) => ((el as unknown as Record<string, SVGAnimatedLength>)[name]?.baseVal.value ?? 0) as number
    const points = () => (el.getAttribute('points') ?? '').trim().replace(/\s+/g, ' ')
    let d = ''
    switch (el.localName) {
      case 'path':
        d = el.getAttribute('d') ?? ''
        break
      case 'line':
        d = `M${len('x1')} ${len('y1')}L${len('x2')} ${len('y2')}`
        break
      case 'polyline':
      case 'polygon':
        d = `M${points()}${el.localName === 'polygon' ? 'Z' : ''}`
        break
      case 'rect':
        d = `M${len('x')} ${len('y')}h${len('width')}v${len('height')}h${-len('width')}Z`
        break
      default: {
        const rx = el.localName === 'circle' ? len('r') : len('rx')
        const ry = el.localName === 'circle' ? len('r') : len('ry')
        d = `M${len('cx') - rx} ${len('cy')}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`
      }
    }
    // a width set through a variable computes as `calc(1.5px)`
    const width = px(cs.strokeWidth.replace(/^calc\((.*)\)$/, '$1'))
    const stroke = cs.stroke !== 'none' && width > 0 && cs.strokeOpacity !== '0'
    const fill = cs.fill !== 'none' && !transparent(cs.fill) && cs.fillOpacity !== '0' && el.localName !== 'line' && el.localName !== 'polyline'
    if (!d || (!stroke && !fill)) continue
    out.push({
      el: el as SVGGeometryElement,
      // an icon's stroke is drawn on by its length; a chart's many shapes never are
      len: stroke && svg.getBoundingClientRect().width <= 40 ? ((el as SVGGeometryElement).getTotalLength?.() ?? 0) : 0,
      path: new Path2D(d),
      m: new DOMMatrix()
        .scaleSelf(1 / k)
        .translateSelf(-ox, -oy)
        .multiplySelf(ctm),
      stroke,
      fill,
      lw: width,
      cap: cs.strokeLinecap as CanvasLineCap,
      join: cs.strokeLinejoin as CanvasLineJoin,
    })
  }
  return out
}

/** What a look reads beyond the parts (Blueprint names colours by their token, greys fills by tone and sets type by
 *  its glyphs). Without one, a colour is its computed value and there is no tone or glyph. */
export interface Reader {
  /** A computed colour's name (a token's), or undefined for one to leave out. */
  token(color: string): string | undefined
  /** How far a colour sits from the page, 0 to 1. */
  tone(color: string, page: string): number | undefined
  /** The page's colour, for a demo with no fill of its own. */
  canvas: string
  /** An element's own words, line by line, as the page broke them. */
  glyphs?(el: Element, ox: number, oy: number, k: number, transform: string): Glyph[]
}

const plain: Reader = { token: (c) => (transparent(c) ? undefined : c), tone: () => undefined, canvas: '' }

export function read(node: HTMLElement, probeHost: Element, reader: Reader = plain): Plan {
  const frame = node.getBoundingClientRect()
  const ox = frame.left
  const oy = frame.top
  // A demo shown scaled (a zoomed preview, a thumbnail) is surveyed in its own CSS pixels, where the overlay draws.
  const k = node.offsetWidth ? frame.width / node.offsetWidth : 1
  const fb = { x: 0, y: 0, w: frame.width / k, h: frame.height / k }
  const rootStyle = getComputedStyle(node)
  const rtl = rootStyle.direction === 'rtl'
  const { token, tone: toneFor } = reader
  // the page a box's tone is measured against: the demo's own fill, else the theme's canvas
  const page = transparent(rootStyle.backgroundColor) ? reader.canvas : rootStyle.backgroundColor
  const parts: Part[] = []
  const floating: Element[] = []
  const candidates: (Region & { depth: number; order: number })[] = []

  /** The values a box applies; colours as the reader names them (Blueprint: by their token, leaving out one the theme has no name for). */
  const styleOf = (cs: CSSStyleDeclaration): Style => ({
    radius: px(cs.borderTopLeftRadius),
    pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px) as Style['pad'],
    gap: /flex|grid/.test(cs.display) ? px(cs.rowGap) || px(cs.columnGap) : 0,
    fill: token(cs.backgroundColor),
    line: px(cs.borderTopWidth) ? token(cs.borderTopColor) : undefined,
    shadow: cs.boxShadow !== 'none',
    ink: token(cs.color),
  })

  let order = 0
  /** `clip`: what the ancestors that clip their overflow still show; a part outside it is never seen (a digit roller's other digits, a scrolled list). */
  const walk = (parent: Element, depth: number, clip: Box, quiet: boolean, host: Part | undefined) => {
    for (const el of parent.children) {
      if (el === probeHost) continue
      const cs = getComputedStyle(el)
      if (cs.display === 'contents') {
        walk(el, depth, clip, quiet, host)
        continue
      }
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) {
        // a box of no size whose content overflows it (Recharts' responsive container) is read through
        if (!/hidden|clip|auto|scroll/.test(cs.overflow)) walk(el, depth, clip, quiet, host)
        continue
      }
      const box = { x: (r.left - ox) / k, y: (r.top - oy) / k, w: r.width / k, h: r.height / k }
      if (box.x >= clip.x + clip.w - 1 || box.y >= clip.y + clip.h - 1 || box.x + box.w <= clip.x + 1 || box.y + box.h <= clip.y + 1) continue
      if (cs.position === 'fixed' || /blur/.test(cs.filter) || el.matches(':popover-open, [data-open][role=dialog], [role=tooltip]')) {
        floating.push(el)
        continue
      }
      const tag = el.localName
      const role = el.getAttribute('role') ?? ''
      const slot = el.getAttribute('data-slot') ?? ''
      const radius = px(cs.borderTopLeftRadius)
      const round = radius >= Math.min(box.w, box.h) / 2 - 0.5 && Math.abs(box.w - box.h) < 1
      const fill = !transparent(cs.backgroundColor) || cs.backgroundImage !== 'none'
      const borders = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(px)
      const lined = borders.filter(Boolean).length
      const shadow = cs.boxShadow !== 'none'
      let kind: Kind | undefined
      let descend = true
      let edge: Part['edge']
      let own = false
      let self: Part | undefined

      if (tag === 'svg') {
        descend = false
        kind = box.w <= ICON_MAX && box.h <= ICON_MAX ? 'icon' : 'chart'
      } else if (/^(img|video|canvas|picture|iframe)$/.test(tag) || role === 'img') {
        descend = false
        kind = 'media'
      } else if (
        /^(textarea|select)$/.test(tag) ||
        (tag === 'input' && !/^(checkbox|radio|range|button|submit|reset|hidden|color)$/.test((el as HTMLInputElement).type)) ||
        FIELD_ROLE.test(role)
      ) {
        descend = !/^(input|textarea|select)$/.test(tag)
        kind = 'field'
      } else if ((/^(li|tr)$/.test(tag) || ROW_ROLE.test(role)) && box.h <= 96 && !quiet) {
        kind = 'row'
      } else if (
        /^(button|summary)$/.test(tag) ||
        (tag === 'input' && /^(checkbox|radio|range|button|submit|reset)$/.test((el as HTMLInputElement).type)) ||
        CONTROL_ROLE.test(role) ||
        (tag === 'a' && (fill || lined === 4)) ||
        ((fill || lined === 4) && box.h <= 28 && box.w <= 160 && el.textContent!.trim().length > 0)
      ) {
        kind = 'control'
      } else if (tag === 'hr' || role === 'separator' || ((box.h <= 2 || box.w <= 2) && fill)) {
        descend = false
        kind = 'divider'
        edge = box.w >= box.h ? 'top' : 'left'
        own = true
      } else if (fill || lined === 4 || shadow) {
        kind = 'surface'
      } else if (lined === 1) {
        kind = 'divider'
        edge = (['top', 'right', 'bottom', 'left'] as const)[borders.findIndex(Boolean)]
      }

      if (kind) {
        const style = styleOf(cs)
        // a divider's colour is its fill, or its one border's
        if (kind === 'divider')
          style.line = token(
            own && !transparent(cs.backgroundColor)
              ? cs.backgroundColor
              : cs[`border${edge![0]!.toUpperCase()}${edge!.slice(1)}Color` as 'borderTopColor'],
          )
        const part: Part = {
          ...box,
          kind,
          el,
          round,
          edge,
          own,
          quiet,
          host,
          name: slot || role || tag,
          tag,
          role,
          style,
          link: role === 'link' || tag === 'a',
        }
        if (kind === 'icon' || kind === 'chart') part.shapes = shapesOf(el, ox, oy, k)
        else if (kind === 'media') part.tone = 0.5
        else if (kind !== 'divider' && !transparent(cs.backgroundColor)) {
          // the grey comes from what the fill is for: the page's own surfaces barely, wells and controls hatched,
          // strong fills (a primary button, a badge) solid; a colour with no token by how far it sits from the page
          const name = token(cs.backgroundColor) ?? ''
          part.tone = /^(canvas|surface|chrome|field)$/.test(name)
            ? 0.05
            : /^(well|control|band|hover|selected|line.*|accent-subtle|.*-subtle)$/.test(name)
              ? 0.25
              : name
                ? 0.9
                : toneFor(cs.backgroundColor, page)
        }
        parts.push(part)
        self = part
      }

      // Text is the smallest element with words of its own; a control's label is drafted as text inside it.
      if (descend && ownText(el)) {
        const fs = px(cs.fontSize)
        // only the lines the clipping ancestors still show (a digit roller's other digits are out of view)
        // and that the page shows there: whatever covers or clips it (a mask, a clip-path), a hit test on screen agrees
        const shown = (b: Box) => {
          const cx = b.x + b.w / 2
          const cy = b.y + b.h / 2
          if (cy <= clip.y || cy >= clip.y + clip.h || cx <= clip.x || cx >= clip.x + clip.w) return false
          const px = ox + cx * k
          const py = oy + cy * k
          if (px < 0 || py < 0 || px >= innerWidth || py >= innerHeight) return true
          const hit = document.elementFromPoint?.(px, py)
          return !hit || hit === el || el.contains(hit) || hit.contains(el)
        }
        const lines = textLines(el, ox, oy, k, fs).filter(shown)
        if (lines.length) {
          const words = el.textContent!.trim().replace(/\s+/g, ' ')
          const lh = cs.lineHeight === 'normal' ? fs * 1.2 : px(cs.lineHeight)
          const tb = lines.reduce((a, l) => ({ x: Math.min(a.x, l.x), y: Math.min(a.y, l.y), w: 0, h: 0 }), { x: Infinity, y: Infinity, w: 0, h: 0 })
          tb.w = Math.max(...lines.map((l) => l.x + l.w)) - tb.x
          tb.h = Math.max(...lines.map((l) => l.y + l.h)) - tb.y
          const own = el.getBoundingClientRect()
          parts.push({
            ...tb,
            at: { x: (own.left - ox) / k, y: (own.top - oy) / k, w: own.width / k, h: own.height / k },
            kind: 'text',
            el,
            round: false,
            quiet: quiet || kind === 'row',
            lines,
            glyphs: reader.glyphs?.(el, ox, oy, k, cs.textTransform).filter(shown),
            // type that sits close to the page's own colour (white on a primary button) is set light, on its tone
            light: (toneFor(cs.color, page) ?? 1) < 0.35,
            font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
            spacing: cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing,
            name: slot || role || tag,
            tag,
            role,
            style: styleOf(cs),
            words,
            type: { fs, lh, weight: cs.fontWeight },
            host: self && kind !== 'divider' ? self : host,
          })
        }
      }

      // Regions: the largest boxes, from any element that frames something.
      const big = area(box) >= area(fb) * 0.04 && box.w >= 48 && box.h >= 32
      const whole = box.w >= fb.w * 0.98 && box.h >= fb.h * 0.98
      if (
        big &&
        !whole &&
        !quiet &&
        (kind === undefined || kind === 'surface') &&
        (kind || REGION_TAG.test(tag) || slot || /^(region|navigation|banner|main|complementary|toolbar|tablist|list|table|group|form)$/.test(role))
      ) {
        candidates.push({
          ...box,
          depth,
          order: order++,
          name: slot || el.getAttribute('aria-label')?.toLowerCase() || role || tag,
          style: styleOf(cs),
        })
      }

      if (descend) {
        let inner = clip
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
          const x = Math.max(clip.x, box.x)
          const y = Math.max(clip.y, box.y)
          inner = { x, y, w: Math.min(clip.x + clip.w, box.x + box.w) - x, h: Math.min(clip.y + clip.h, box.y + box.h) - y }
        }
        walk(el, depth + 1, inner, quiet || kind === 'row', self && /^(surface|field|control|row)$/.test(self.kind) ? self : host)
      }
    }
  }
  walk(node, 0, getComputedStyle(node).overflow === 'visible' ? { x: -1e5, y: -1e5, w: 2e5, h: 2e5 } : fb, false, undefined)

  // Reading order: rows of the page top to bottom (a box by its top, a small part by its middle), then along the line.
  const key = (b: Box) => Math.round((b.y + Math.min(b.h, 40) / 2) / 20)
  const byReading = (a: Box, b: Box) => key(a) - key(b) || (rtl ? b.x + b.w - (a.x + a.w) : a.x - b.x)
  let kept = parts
  if (parts.length > MAX_PARTS) {
    const floor = [...parts].sort((a, b) => area(b) - area(a))[MAX_PARTS - 1]!
    kept = parts.filter((p) => area(p) >= area(floor)).slice(0, MAX_PARTS)
  }
  kept.sort(byReading)

  // The main regions, largest first, none a near copy of another, then outside-in in reading order.
  const most = Math.max(2, Math.min(9, Math.round(Math.sqrt(fb.w * fb.h) / 110)))
  const chosen: typeof candidates = []
  for (const c of [...candidates].sort((a, b) => area(b) - area(a))) {
    if (chosen.length >= most) break
    const near = chosen.some((o) => {
      const ix = Math.max(0, Math.min(o.x + o.w, c.x + c.w) - Math.max(o.x, c.x))
      const iy = Math.max(0, Math.min(o.y + o.h, c.y + c.h) - Math.max(o.y, c.y))
      return (ix * iy) / area(c) > 0.82 && area(c) / area(o) > 0.7
    })
    if (!near) chosen.push(c)
  }
  chosen.sort((a, b) => a.depth - b.depth || byReading(a, b))

  // A draftsman finishes a region before moving on: a part is read where its smallest region starts, then in reading order inside it.
  const inside = (r: Box, p: Box) => p.x + p.w / 2 >= r.x && p.x + p.w / 2 <= r.x + r.w && p.y + p.h / 2 >= r.y && p.y + p.h / 2 <= r.y + r.h
  const anchor = new Map<Part, Box>()
  for (const p of kept) {
    const home = chosen
      .filter((r) => inside(r, p) && !(r.x === p.x && r.y === p.y && r.w === p.w && r.h === p.h))
      .sort((a, b) => area(a) - area(b))[0]
    anchor.set(p, home ?? p)
  }
  kept.sort((a, b) => byReading(anchor.get(a)!, anchor.get(b)!) || byReading(a, b))

  return {
    x: 0,
    y: 0,
    w: fb.w,
    h: fb.h,
    rtl,
    scale: k,
    parts: kept,
    regions: chosen.map(({ depth: _d, order: _o, ...r }) => r),
    floating,
    style: styleOf(rootStyle),
  }
}

/** The parts that appear as units: the outermost part of each branch, small enough to read as one piece (a card, a
 *  control, a row, a paragraph). What's inside a unit comes with it, and a box too big to read as a piece (a panel, the
 *  page body) is left to the look's wipe: every element animated on its own costs the compositor a layer, so a screen
 *  animates tens, not hundreds. In build order. */
export function units(plan: Plan, node: Element) {
  const chosen = new Set<Element>()
  const big = plan.w * plan.h * 0.2
  for (const p of plan.parts) {
    if (p.w * p.h > big || chosen.has(p.el)) continue
    let inside = false
    for (let a = p.el.parentElement; a && a !== node && !inside; a = a.parentElement) inside = chosen.has(a)
    if (inside) continue
    for (const u of [...chosen]) if (p.el.contains(u)) chosen.delete(u)
    chosen.add(p.el)
  }
  return plan.parts.filter((p) => chosen.delete(p.el))
}
