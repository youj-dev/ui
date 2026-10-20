import { C, FRONT, matrix, NS, OX, OY, P, type Part, poly, S, SIDE, TOP, frameBox, type Vec3 } from './projection'

/* The drawing kit: the lab files' shared engine (el, group, rect… box,
 * cylinder, frame), with the same names, signatures, defaults and output, so a
 * ported figure calls it unchanged. The one difference is invisible to the
 * figure: it's bound to one host (its svg, and a getter for the figure's
 * current parent group, which the figure keeps reassigning). */

type Attrs = Record<string, unknown>
type Axis = 'x' | 'y' | 'z'

export interface Kit {
  readonly NS: string
  readonly C: number
  readonly S: number
  readonly OX: number
  readonly OY: number
  readonly P: typeof P
  readonly matrix: typeof matrix
  readonly TOP: typeof TOP
  readonly FRONT: typeof FRONT
  readonly SIDE: typeof SIDE
  readonly poly: typeof poly
  set(node: Element, name: string, value: unknown): void
  /** A new SVG element with these attributes, appended to `parent` (the current group). */
  el(tag: string, attrs?: Attrs, parent?: Element): SVGElement
  group(transform: string, parent?: Element, attrs?: Attrs): SVGGElement
  rect(g: Element, x: number, y: number, w: number, h: number, r?: number, cls?: string): SVGRectElement
  circle(g: Element, x: number, y: number, r: number, cls?: string): SVGCircleElement
  line(g: Element, x1: number, y1: number, x2: number, y2: number, cls?: string): SVGLineElement
  text(g: Element, x: number, y: number, value: string, cls?: string): SVGTextElement
  /** A path through world points. */
  wire(pts: readonly Vec3[], cls?: string, parent?: Element): SVGPathElement
  /** A rounded box: its right side, front and top. */
  box(x: number, y: number, z: number, w: number, d: number, h: number, r?: number, cls?: string): SVGGElement
  /** A circle on the plane across `axis` at (x, y, z). */
  ellipse(x: number, y: number, z: number, r: number, axis?: Axis, cls?: string, parent?: Element): SVGCircleElement
  /** A cylinder from (x, y, z) along `axis`: its body and its end face (the group to draw on). */
  cylinder(x: number, y: number, z: number, r: number, h: number, axis?: Axis, cls?: string): { g: SVGGElement; face: SVGGElement }
  /** `n` recessed slits across a w×h area of a face. */
  slits(g: Element, x: number, y: number, w: number, h: number, n?: number, vertical?: boolean): void
  screw(g: Element, x: number, y: number): void
  /** Fits the svg's viewBox to these parts. */
  frame(parts: readonly Part[], pad?: number): void
}

export function createKit(svg: SVGSVGElement, getRoot: () => Element): Kit {
  const doc = svg.ownerDocument
  const set = (n: Element, k: string, v: unknown) => n.setAttribute(k, v as string)
  function el(tag: string, attrs: Attrs = {}, parent: Element = getRoot()) {
    const n = doc.createElementNS(NS, tag) as SVGElement
    for (const [k, v] of Object.entries(attrs)) set(n, k, v)
    parent.appendChild(n)
    return n
  }
  const group = (transform: string, parent: Element = getRoot(), attrs: Attrs = {}) => el('g', { transform, ...attrs }, parent) as SVGGElement
  const rect = (g: Element, x: number, y: number, w: number, h: number, r = 3, cls = 'face') =>
    el('rect', { x, y, width: w, height: h, rx: r, class: cls }, g) as SVGRectElement
  const circle = (g: Element, x: number, y: number, r: number, cls = 'face') => el('circle', { cx: x, cy: y, r, class: cls }, g) as SVGCircleElement
  const line = (g: Element, x1: number, y1: number, x2: number, y2: number, cls = 'detail') => el('line', { x1, y1, x2, y2, class: cls }, g) as SVGLineElement
  function text(g: Element, x: number, y: number, value: string, cls = 'label') {
    const n = el('text', { x, y, class: cls }, g) as SVGTextElement
    n.textContent = value
    return n
  }
  const wire = (pts: readonly Vec3[], cls = 'detail', parent: Element = getRoot()) => el('path', { d: poly(pts), class: cls }, parent) as SVGPathElement
  function box(x: number, y: number, z: number, w: number, d: number, h: number, r = 5, cls = '') {
    const g = el('g', {}, getRoot()) as SVGGElement
    rect(group(SIDE(x + w, y + d, z + h), g), 0, 0, d, h, r, 'face side ' + cls)
    rect(group(FRONT(x, y + d, z + h), g), 0, 0, w, h, r, 'face ' + cls)
    rect(group(TOP(x, y, z + h), g), 0, 0, w, d, r, 'face top ' + cls)
    return g
  }
  const PLANE = { z: TOP, y: FRONT, x: SIDE }
  function ellipse(x: number, y: number, z: number, r: number, axis: Axis = 'z', cls = 'face top', parent: Element = getRoot()) {
    return circle(group(PLANE[axis](x, y, z), parent), 0, 0, r, cls)
  }
  function cylinder(x: number, y: number, z: number, r: number, h: number, axis: Axis = 'z', cls = '') {
    const g = el('g', {}, getRoot()) as SVGGElement
    const f = PLANE[axis]
    const end: [number, number, number] = [x, y, z]
    const along = { x: 0, y: 1, z: 2 }[axis]
    end[along] = end[along]! + h
    const a = C
    const b = axis === 'x' ? -S : S
    const c = axis === 'z' ? -C : 0
    const d = axis === 'z' ? S : 1
    const p = P(x, y, z)
    const q = P(...end)
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const det = a * d - b * c
    const u = (d * dx - c * dy) / det
    const v = (-b * dx + a * dy) / det
    const l = Math.hypot(u, v) || 1
    const tx = (-v * r) / l
    const ty = (u * r) / l
    el('path', { d: `M${tx},${ty} A${r},${r} 0 0 1 ${-tx},${-ty} L${u - tx},${v - ty} A${r},${r} 0 0 1 ${u + tx},${v + ty} Z`, transform: f(x, y, z), class: 'face ' + cls }, g)
    const face = group(f(...end), g)
    circle(face, 0, 0, r, 'face top ' + cls)
    return { g, face }
  }
  function slits(g: Element, x: number, y: number, w: number, h: number, n = 10, vertical = true) {
    const step = (vertical ? w : h) / n
    for (let i = 0; i < n; i++) rect(g, x + (vertical ? i * step : 0), y + (vertical ? 0 : i * step), vertical ? step * 0.32 : w, vertical ? h : step * 0.32, 1, 'face recess')
  }
  function screw(g: Element, x: number, y: number) {
    circle(g, x, y, 1.5, 'face top')
    line(g, x - 0.75, y + 0.55, x + 0.75, y - 0.55)
  }
  const frame = (parts: readonly Part[], pad = 28) => set(svg, 'viewBox', frameBox(parts, pad))
  return { NS, C, S, OX, OY, P, matrix, TOP, FRONT, SIDE, poly, set, el, group, rect, circle, line, text, wire, box, ellipse, cylinder, slits, screw, frame }
}
