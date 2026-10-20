import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { icons, ICON_CATEGORIES, type YoujIconComponent } from '@youj/icons/components/youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
// The docs' definition of "an icon at rest": hidden parts dropped, dash
// bookkeeping and no-op masks removed. Plain TypeScript, shared on purpose.
import { cleanIcon, parseMarkup, type IconNode } from '../../../../apps/docs/components/icons/static-svg'
import type { IconPart, KitIcon } from '../kit'
import {
  bounds,
  ellipsePath,
  IDENTITY,
  multiply,
  onlyTranslates,
  overlaps,
  parseCssTransform,
  parsePath,
  parseSvgTransform,
  pathLength,
  rectPath,
  scaleOf,
  subpaths,
  toPathData,
  transformSegs,
  translate,
  type Box,
  type Matrix,
  type Seg,
} from './geometry'

/* Every Youj icon, rendered by React exactly as the docs render it (reduced
 * motion, trigger none, so each part sits in its pose), then flattened for
 * Figma: transforms baked into absolute path data, masks and clip paths turned
 * into explicit mask groups (Figma's SVG import drops SVG masks), zero-length
 * "dot" strokes turned into discs, and pathLength dashes measured. State icons
 * are rendered twice, at rest and active. */

type Paint = 'ink' | 'white' | 'black' | null

interface Context {
  m: Matrix
  stroke: Paint
  fill: Paint
  strokeWidth: number
}

const VIEW = 24

function paintOf(value: string | undefined, inherited: Paint): Paint {
  if (value === undefined) return inherited
  const v = value.trim().toLowerCase()
  if (v === 'none' || v === 'transparent') return null
  if (v === 'currentcolor') return 'ink'
  if (v === 'white' || v === '#fff' || v === '#ffffff') return 'white'
  if (v === 'black' || v === '#000' || v === '#000000') return 'black'
  throw new Error(`unexpected icon paint "${value}"`)
}

function styleMap(style: string | undefined): Map<string, string> {
  const out = new Map<string, string>()
  for (const decl of (style ?? '').split(';')) {
    const at = decl.indexOf(':')
    if (at > 0) out.set(decl.slice(0, at).trim(), decl.slice(at + 1).trim())
  }
  return out
}

const num = (v: string | undefined, fallback = 0) => (v === undefined ? fallback : Number.parseFloat(v))

/** A leaf's outline in its own coordinates. */
function leafSegs([tag, a]: IconNode): Seg[] {
  switch (tag) {
    case 'path':
      return parsePath(a.d ?? '')
    case 'circle':
      return ellipsePath(num(a.cx), num(a.cy), num(a.r), num(a.r))
    case 'ellipse':
      return ellipsePath(num(a.cx), num(a.cy), num(a.rx), num(a.ry))
    case 'rect': {
      const rx = a.rx ?? a.ry
      const ry = a.ry ?? a.rx
      return rectPath(num(a.x), num(a.y), num(a.width), num(a.height), num(rx), num(ry))
    }
    case 'line':
      return [
        { type: 'M', x: num(a.x1), y: num(a.y1) },
        { type: 'L', x: num(a.x2), y: num(a.y2) },
      ]
    case 'polyline':
    case 'polygon': {
      const pts = (a.points ?? '').trim().split(/[\s,]+/).map(Number)
      const segs: Seg[] = []
      for (let i = 0; i + 1 < pts.length; i += 2) segs.push({ type: i ? 'L' : 'M', x: pts[i]!, y: pts[i + 1]! })
      if (tag === 'polygon') segs.push({ type: 'Z' })
      return segs
    }
    default:
      throw new Error(`unexpected icon element <${tag}>`)
  }
}

const LEAVES = new Set(['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'])

/** An element's own outline bounds (untransformed), for fill-box transform origins and clip culling. */
function ownBounds(node: IconNode): Box | null {
  if (LEAVES.has(node[0])) return bounds(leafSegs(node))
  const boxes = node[2].map(ownBounds).filter((b): b is Box => b !== null)
  if (!boxes.length) return null
  return {
    minX: Math.min(...boxes.map((b) => b.minX)),
    minY: Math.min(...boxes.map((b) => b.minY)),
    maxX: Math.max(...boxes.map((b) => b.maxX)),
    maxY: Math.max(...boxes.map((b) => b.maxY)),
  }
}

/** The element's local transform: its CSS transform (with transform-box and origin) or its transform attribute. */
function localMatrix(node: IconNode): Matrix {
  const [, attrs] = node
  const style = styleMap(attrs.style)
  const css = style.get('transform')
  if (css && css !== 'none') {
    const f = parseCssTransform(css)
    if (onlyTranslates(css)) return f
    const box = style.get('transform-box') === 'fill-box' ? ownBounds(node) : { minX: 0, minY: 0, maxX: VIEW, maxY: VIEW }
    if (!box) return f
    const [ox, oy] = (style.get('transform-origin') ?? '0 0').split(/\s+/).map((t, i) => {
      const size = i === 0 ? box.maxX - box.minX : box.maxY - box.minY
      const start = i === 0 ? box.minX : box.minY
      if (t.endsWith('%')) return start + (parseFloat(t) / 100) * size
      if (t === 'center') return start + size / 2
      return start + parseFloat(t)
    }) as [number, number]
    return multiply(translate(ox, oy), multiply(f, translate(-ox, -oy)))
  }
  return attrs.transform ? parseSvgTransform(attrs.transform) : IDENTITY
}

const refId = (v: string | undefined) => (v ? /^url\(#(.+)\)$/.exec(v)?.[1] : undefined)

/** A zero-length stroke with round caps paints a dot: a disc of the stroke's width. */
const DOT = 0.05

function pathParts(segs: Seg[], ctx: Context, attrs: Record<string, string>, opacity: number): IconPart[] {
  const width = ctx.strokeWidth * scaleOf(ctx.m)
  const world = transformSegs(segs, ctx.m)
  const parts: IconPart[] = []
  const lines: Seg[] = []
  for (const sub of subpaths(world)) {
    if (ctx.stroke && !ctx.fill && pathLength(sub) < DOT) {
      const start = sub[0]!
      if (start.type === 'Z') continue
      parts.push({ kind: 'path', d: toPathData(ellipsePath(start.x, start.y, width / 2, width / 2)), stroke: null, fill: ctx.stroke, strokeWidth: 0, opacity })
    } else lines.push(...sub)
  }
  if (lines.length) {
    const part: IconPart = { kind: 'path', d: toPathData(lines), stroke: ctx.stroke, fill: ctx.fill, strokeWidth: ctx.stroke ? round(width) : 0, opacity }
    const dash = attrs['stroke-dasharray']
    if (dash && dash !== 'none') {
      if (num(attrs['stroke-dashoffset']) !== 0) throw new Error('icons: dash offsets are not supported')
      const unit = attrs.pathLength ? pathLength(world) / num(attrs.pathLength) : scaleOf(ctx.m)
      const [on, off] = dash.split(/[\s,]+/).map((v) => round(num(v) * unit)) as [number, number]
      part.dash = [on, off ?? on]
    }
    parts.push(part)
  }
  return parts
}

const round = (v: number) => Math.round(v * 1000) / 1000

function flatten(nodes: IconNode[], parent: Context, defs: Map<string, IconNode>, root: Context): IconPart[] {
  const out: IconPart[] = []
  for (const node of nodes) {
    const [tag, attrs, children] = node
    if (tag === 'mask' || tag === 'clipPath' || tag === 'defs') continue
    const style = styleMap(attrs.style)
    const ctx: Context = {
      m: multiply(parent.m, localMatrix(node)),
      stroke: paintOf(attrs.stroke ?? style.get('stroke'), parent.stroke),
      fill: paintOf(attrs.fill ?? style.get('fill'), parent.fill),
      strokeWidth: attrs['stroke-width'] !== undefined ? num(attrs['stroke-width']) : parent.strokeWidth,
    }
    const opacity = num(attrs.opacity ?? style.get('opacity'), 1)
    let parts: IconPart[]
    if (tag === 'g') parts = flatten(children, ctx, defs, root)
    else if (LEAVES.has(tag)) parts = pathParts(leafSegs(node), ctx, attrs, opacity)
    else throw new Error(`unexpected icon element <${tag}>`)
    if (tag === 'g' && opacity !== 1) parts = parts.map((p) => (p.kind === 'path' ? { ...p, opacity: p.opacity * opacity } : p))

    const maskId = refId(attrs.mask)
    if (maskId && parts.length) {
      const def = defs.get(maskId)
      if (!def) throw new Error(`icons: missing mask #${maskId}`)
      // SVG masks paint in the referencing element's user space, with the root's inherited paints.
      parts = [{ kind: 'mask', type: 'LUMINANCE', mask: flatten(def[2], { ...root, m: ctx.m }, defs, root), content: parts }]
    }
    const clipId = refId(attrs['clip-path'])
    if (clipId && parts.length) {
      const def = defs.get(clipId)
      if (!def) throw new Error(`icons: missing clip path #${clipId}`)
      if (!def[2].length) parts = []
      else {
        const clip = flatten(def[2], { m: ctx.m, stroke: null, fill: 'black', strokeWidth: 0 }, defs, root).map((p) => (p.kind === 'path' ? { ...p, stroke: null, fill: 'black' as const } : p))
        parts = culled(parts, clip)
        if (parts.length) parts = [{ kind: 'mask', type: 'ALPHA', mask: clip, content: parts }]
      }
    }
    out.push(...parts)
  }
  return out
}

/** Drops content entirely outside a clip region (a part hidden by being moved out of view). */
function culled(parts: IconPart[], clip: IconPart[]): IconPart[] {
  const box = partsBounds(clip)
  if (!box) return []
  return parts.filter((p) => {
    const b = partsBounds([p])
    return b !== null && overlaps(b, box)
  })
}

function partsBounds(parts: IconPart[]): Box | null {
  const boxes: Box[] = []
  for (const p of parts) {
    if (p.kind === 'path') {
      const b = bounds(parsePath(p.d))
      const pad = p.stroke ? p.strokeWidth / 2 : 0
      boxes.push({ minX: b.minX - pad, minY: b.minY - pad, maxX: b.maxX + pad, maxY: b.maxY + pad })
    } else {
      const b = partsBounds(p.content)
      if (b) boxes.push(b)
    }
  }
  if (!boxes.length) return null
  return {
    minX: Math.min(...boxes.map((b) => b.minX)),
    minY: Math.min(...boxes.map((b) => b.minY)),
    maxX: Math.max(...boxes.map((b) => b.maxX)),
    maxY: Math.max(...boxes.map((b) => b.maxY)),
  }
}

function collectDefs(nodes: IconNode[], out = new Map<string, IconNode>()) {
  for (const node of nodes) {
    if ((node[0] === 'mask' || node[0] === 'clipPath') && node[1].id) out.set(node[1].id, node)
    collectDefs(node[2], out)
  }
  return out
}

function render(Icon: YoujIconComponent, active: boolean): { root: IconNode; parts: IconPart[] } {
  // biome-ignore lint/correctness/noChildrenProp: the provider's props type requires `children` in the props object
  const html = renderToStaticMarkup(createElement(YoujProvider, { reducedMotion: 'always', children: createElement(Icon, { trigger: 'none', active }) }))
  const svg = parseMarkup(html)
  const nodes = cleanIcon(svg, `ki-${Icon.meta.name}-`)
  const a = svg[1]
  const root: Context = { m: IDENTITY, stroke: paintOf(a.stroke, 'ink'), fill: paintOf(a.fill, null), strokeWidth: num(a['stroke-width'], 1.5) }
  return { root: svg, parts: flatten(nodes, root, collectDefs(nodes), root) }
}

export interface KitIcons {
  icons: KitIcon[]
  categories: string[]
  /** The default stroke width every icon is drawn with. */
  strokeWidth: number
}

export function kitIcons(): KitIcons {
  let strokeWidth = 0
  const out = icons.map((Icon): KitIcon => {
    const { meta } = Icon
    const rest = render(Icon, false)
    strokeWidth = num(rest.root[1]['stroke-width'], 1.5)
    const icon: KitIcon = {
      name: meta.name,
      category: meta.category,
      keywords: meta.keywords,
      component: Icon.displayName ?? meta.name,
      rest: rest.parts,
    }
    if (meta.states) {
      icon.states = meta.states
      icon.active = render(Icon, true).parts
    }
    return icon
  })
  return { icons: out, categories: [...ICON_CATEGORIES], strokeWidth }
}
