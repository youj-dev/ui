/* An icon at rest, as data: lucide's node format, `[tag, attributes, children]`.
 *
 * Youj icons are rendered once at build time (scripts/icon-svgs.ts) with
 * reduced motion and `trigger="none"`, so every part sits in its rest pose,
 * and the markup is cleaned to what a static SVG needs: parts hidden at rest
 * are dropped, fully drawn strokes lose their dash bookkeeping, identity
 * transforms go, no-op masks and bare groups unwrap, and ids get stable names.
 *
 * Plain TypeScript with relative imports only: the build script imports it
 * directly under Node. */

export type IconNode = [tag: string, attrs: Record<string, string>, children: IconNode[]]

/* ── Reading ───────────────────────────────────────────────────────────── */

const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g
const ATTR = /([\w:-]+)="([^"]*)"/g

const unescape = (v: string) => v.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')

/** Parses React's server markup (well-formed, quoted attributes, no text) into nodes. Returns the first <svg>. */
export function parseMarkup(html: string): IconNode {
  const top: IconNode = ['#root', {}, []]
  const stack: IconNode[] = [top]
  for (const [, close, tag, rawAttrs, selfClose] of html.matchAll(TAG)) {
    if (close) {
      if (stack.length > 1) stack.pop()
      continue
    }
    const attrs: Record<string, string> = {}
    for (const [, name, value] of rawAttrs!.matchAll(ATTR)) attrs[name!] = unescape(value!)
    const node: IconNode = [tag!, attrs, []]
    stack[stack.length - 1]![2].push(node)
    if (!selfClose) stack.push(node)
  }
  const svg = find(top, 'svg')
  if (!svg) throw new Error('No <svg> in markup')
  return svg
}

function find(node: IconNode, tag: string): IconNode | undefined {
  if (node[0] === tag) return node
  for (const child of node[2]) {
    const hit = find(child, tag)
    if (hit) return hit
  }
  return undefined
}

/* ── Cleaning ──────────────────────────────────────────────────────────── */

function parseStyle(style: string | undefined): Map<string, string> {
  const out = new Map<string, string>()
  for (const decl of (style ?? '').split(';')) {
    const at = decl.indexOf(':')
    if (at > 0) out.set(decl.slice(0, at).trim(), decl.slice(at + 1).trim())
  }
  return out
}

/** Long fractions from computed transform origins (14.583333333333334%) read as noise. */
const tidyNumbers = (v: string) => v.replace(/-?\d+\.\d{4,}/g, (n) => String(Math.round(Number(n) * 1000) / 1000))

const firstNumber = (v: string | undefined) => (v === undefined ? undefined : Number.parseFloat(v))
const INVISIBLE_SCALE = /scale[XY]?\(\s*0(?:\.0+)?\s*[,)]/

function hasFill(attrs: Record<string, string>) {
  const fill = attrs.fill
  return fill !== undefined && fill !== 'none' && fill !== 'transparent'
}

/** Whether a part is invisible at rest: faded out, drawn to zero or scaled to nothing. */
function hidden(attrs: Record<string, string>, style: Map<string, string>) {
  if (style.get('opacity') === '0' || attrs.opacity === '0') return true
  if (style.get('visibility') === 'hidden' || attrs.visibility === 'hidden') return true
  if (INVISIBLE_SCALE.test(style.get('transform') ?? '')) return true
  const dash = firstNumber(attrs['stroke-dasharray'])
  return dash === 0 && attrs.pathLength !== undefined && !hasFill(attrs)
}

function cleanNode([tag, rawAttrs, children]: IconNode): IconNode | null {
  const attrs = { ...rawAttrs }
  const style = parseStyle(attrs.style)
  delete attrs.style
  if (hidden(attrs, style)) return null

  // Motion's pathLength bookkeeping: a fully drawn stroke needs none of it.
  const dash = firstNumber(attrs['stroke-dasharray'])
  if (attrs.pathLength !== undefined && dash !== undefined && dash >= 1 && !Number.parseFloat(attrs['stroke-dashoffset'] ?? '0')) {
    delete attrs.pathLength
    delete attrs['stroke-dasharray']
    delete attrs['stroke-dashoffset']
  }

  if (style.get('opacity') === '1') style.delete('opacity')
  const transform = style.get('transform')
  if (!transform || transform === 'none') {
    style.delete('transform')
    style.delete('transform-origin')
    style.delete('transform-box')
  }
  if (style.size) attrs.style = [...style].map(([k, v]) => `${k}:${tidyNumbers(v)}`).join(';')

  const kept = children.map(cleanNode).filter((c): c is IconNode => c !== null)
  if ((tag === 'g' || tag === 'defs') && kept.length === 0) return null
  return [tag, attrs, kept]
}

/** A mask that keeps everything: only its full white backdrop is left once hidden parts are gone. */
function noOpMask(node: IconNode) {
  if (node[0] !== 'mask' || node[2].length !== 1) return false
  const [tag, attrs] = node[2][0]!
  const white = attrs.fill === 'white' || attrs.fill === '#fff' || attrs.fill === '#ffffff'
  return tag === 'rect' && white && attrs.width === '24' && attrs.height === '24' && !Number(attrs.x ?? 0) && !Number(attrs.y ?? 0)
}

function dropMasks(nodes: IconNode[], noop: Set<string>): IconNode[] {
  return nodes.flatMap((node): IconNode[] => {
    if (noOpMask(node)) return []
    const [tag, attrs, children] = node
    const next = { ...attrs }
    const ref = /^url\(#(.+)\)$/.exec(next.mask ?? '')?.[1]
    if (ref && noop.has(ref)) delete next.mask
    const kept = dropMasks(children, noop)
    // A group with nothing left to say hands its children up.
    if (tag === 'g' && Object.keys(next).length === 0) return kept
    return [[tag, next, kept]]
  })
}

function collectNoOpMasks(nodes: IconNode[], out = new Set<string>()) {
  for (const node of nodes) {
    if (noOpMask(node) && node[1].id) out.add(node[1].id)
    collectNoOpMasks(node[2], out)
  }
  return out
}

/** Renames ids to `${prefix}0`, `${prefix}1`… and follows every `url(#…)` and `#…` reference. */
function renameIds(nodes: IconNode[], prefix: string): IconNode[] {
  const names = new Map<string, string>()
  const visit = (list: IconNode[]) =>
    list.forEach(([, attrs, children]) => {
      if (attrs.id && !names.has(attrs.id)) names.set(attrs.id, `${prefix}${names.size}`)
      visit(children)
    })
  visit(nodes)
  if (!names.size) return nodes
  const rewrite = (v: string) =>
    v.replace(/url\(#([^)]+)\)/g, (m, id: string) => (names.has(id) ? `url(#${names.get(id)})` : m)).replace(/^#(.+)$/, (m, id: string) => (names.has(id) ? `#${names.get(id)}` : m))
  const map = (list: IconNode[]): IconNode[] =>
    list.map(([tag, attrs, children]) => [tag, Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, k === 'id' ? (names.get(v) ?? v) : rewrite(v)])), map(children)])
  return map(nodes)
}

/** The drawable content of a rendered icon at rest: its <svg>'s children, cleaned. */
export function cleanIcon(svg: IconNode, idPrefix: string): IconNode[] {
  const children = svg[2].map(cleanNode).filter((c): c is IconNode => c !== null)
  return renameIds(dropMasks(children, collectNoOpMasks(children)), idPrefix)
}

/* ── Writing ───────────────────────────────────────────────────────────── */

export interface SvgOptions {
  size?: number
  strokeWidth?: number
  /** Any CSS color; default currentColor. */
  color?: string
}

const round = (n: number) => String(Math.round(n * 100) / 100)

function rootAttrs({ size = 24, strokeWidth = 1.5, color = 'currentColor' }: SvgOptions): Record<string, string> {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    width: round(size),
    height: round(size),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    'stroke-width': round(strokeWidth),
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }
}

const escapeAttr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function print(nodes: IconNode[], depth: number, attrsOf: (attrs: Record<string, string>) => string): string {
  const pad = '  '.repeat(depth)
  return nodes
    .map(([tag, attrs, children]) => {
      const open = `${pad}<${tag}${attrsOf(attrs)}`
      if (!children.length) return `${open} />`
      return `${open}>\n${print(children, depth + 1, attrsOf)}\n${pad}</${tag}>`
    })
    .join('\n')
}

const htmlAttrs = (attrs: Record<string, string>) =>
  Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join('')

/** A standalone SVG file's markup. */
export function svgMarkup(nodes: IconNode[], options: SvgOptions = {}): string {
  return print([['svg', rootAttrs(options), nodes]], 0, htmlAttrs)
}

/** One line, for tiles and data URLs. */
export function svgString(nodes: IconNode[], options: SvgOptions = {}): string {
  const one = (list: IconNode[]): string => list.map(([tag, attrs, children]) => `<${tag}${htmlAttrs(attrs)}>${one(children)}</${tag}>`).join('')
  return one([['svg', rootAttrs(options), nodes]])
}

const camel = (name: string) => name.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase())

/** Attribute names React spells differently; everything hyphenated becomes camelCase. */
function jsxName(name: string) {
  if (name === 'class') return 'className'
  if (name === 'xmlns' || name.startsWith('data-') || name.startsWith('aria-')) return name
  return camel(name)
}

function jsxAttrs(attrs: Record<string, string>) {
  return Object.entries(attrs)
    .map(([k, v]) => {
      if (k === 'style') {
        const style = [...parseStyle(v)].map(([p, value]) => `${camel(p)}: '${value.replace(/'/g, "\\'")}'`).join(', ')
        return ` style={{ ${style} }}`
      }
      return ` ${jsxName(k)}="${escapeAttr(v)}"`
    })
    .join('')
}

/** Attributes as React props: camelCase names and a style object. */
export function reactProps(attrs: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style') out.style = Object.fromEntries([...parseStyle(v)].map(([p, value]) => [camel(p), value]))
    else out[jsxName(k)] = v
  }
  return out
}

/** The same SVG as JSX, for pasting into a React component with no dependency. */
export function svgJsx(nodes: IconNode[], options: SvgOptions = {}): string {
  const root = rootAttrs(options)
  delete root.xmlns
  return print([['svg', root, nodes]], 0, jsxAttrs)
}
