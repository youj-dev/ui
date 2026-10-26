/* Draws a fake document as HTML so a page can be looked at without Figma:
 * auto layout becomes flexbox (hug, fill, gaps, padding, wrap, alignment),
 * paints resolve through the bound variables and the explicit modes up the
 * tree, effects become box-shadows, vectors become inline SVG with their
 * masks. An approximation of Figma's renderer, close enough to judge a
 * layout, a type scale or a theme. */

import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolveVariable, type FakeEnv, type FakeNode } from './fake-figma'

type Json = Record<string, unknown>
type Modes = Record<string, string>

const require = createRequire(import.meta.url)
const fontCss = () => {
  const inter = pathToFileURL(require.resolve('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')).href
  const mono = pathToFileURL(require.resolve('@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2')).href
  // Geist isn't installed here: Basalt's families render in Inter and JetBrains Mono (close enough for layout).
  return `@font-face{font-family:'Inter';src:url('${inter}') format('woff2');font-weight:100 900}
@font-face{font-family:'JetBrains Mono';src:url('${mono}') format('woff2');font-weight:100 800}
@font-face{font-family:'Geist';src:url('${inter}') format('woff2');font-weight:100 900}
@font-face{font-family:'Geist Mono';src:url('${mono}') format('woff2');font-weight:100 800}`
}

// For text and for double- or single-quoted attribute values alike.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export class Preview {
  private ids = 0
  constructor(private env: FakeEnv) {}

  private float(node: FakeNode, field: string, fallback: number, modes: Modes): number {
    const b = node.boundVariables[field] as Json | undefined
    if (b) {
      const v = resolveVariable(this.env, b.id as string, modes)
      if (typeof v === 'number') return v
    }
    return fallback
  }

  color(paint: Json, modes: Modes): string | null {
    if (paint.visible === false) return null
    let c = paint.color as Json
    const bound = (paint.boundVariables as Json | undefined)?.color as Json | undefined
    if (bound) c = (resolveVariable(this.env, bound.id as string, modes) as Json) ?? c
    const a = (typeof c.a === 'number' ? c.a : 1) * (typeof paint.opacity === 'number' ? paint.opacity : 1)
    const ch = (v: unknown) => Math.round((v as number) * 255)
    return `rgba(${ch(c.r)},${ch(c.g)},${ch(c.b)},${Math.round(a * 1000) / 1000})`
  }

  private background(node: FakeNode, modes: Modes): string {
    const layers: string[] = []
    for (const p of node.fills) {
      if (p.type === 'SOLID') {
        const c = this.color(p, modes)
        if (c) layers.unshift(`linear-gradient(${c},${c})`)
      } else if (p.type === 'IMAGE') {
        const bytes = this.env.images.get(p.imageHash as string)
        if (bytes) layers.unshift(`url(data:image/${bytes[0] === 0x89 ? 'png' : 'jpeg'};base64,${Buffer.from(bytes).toString('base64')}) center/cover no-repeat`)
      }
    }
    return layers.length ? `background:${layers.join(',')};` : ''
  }

  private shadows(node: FakeNode, modes: Modes): string[] {
    const out: string[] = []
    for (const e of node.effects) {
      if (e.visible === false) continue
      const bound = (e.boundVariables as Json | undefined)?.color as Json | undefined
      const color = this.color({ type: 'SOLID', color: bound ? (resolveVariable(this.env, bound.id as string, modes) as Json) : e.color }, modes)
      const o = e.offset as { x: number; y: number }
      out.push(`${e.type === 'INNER_SHADOW' ? 'inset ' : ''}${o.x}px ${o.y}px ${e.radius}px ${e.spread ?? 0}px ${color}`)
    }
    return out
  }

  private modesOf(node: FakeNode, parent: Modes): Modes {
    return { ...parent, ...node.explicitVariableModes }
  }

  private radius(node: FakeNode, modes: Modes): string {
    const r = (f: string, base: number) => this.float(node, f, base, modes)
    const [tl, tr, br, bl] = [r('topLeftRadius', node.topLeftRadius || node.cornerRadius), r('topRightRadius', node.topRightRadius || node.cornerRadius), r('bottomRightRadius', node.bottomRightRadius || node.cornerRadius), r('bottomLeftRadius', node.bottomLeftRadius || node.cornerRadius)]
    return tl || tr || br || bl ? `border-radius:${tl}px ${tr}px ${br}px ${bl}px;` : ''
  }

  /** Strokes: in layout as a border, otherwise drawn over the edge as box-shadows. */
  private strokes(node: FakeNode, modes: Modes, shadows: string[]): string {
    const paint = node.strokes[0]
    if (!paint) return ''
    const c = this.color(paint, modes) ?? 'transparent'
    const sides = { top: node.strokeTopWeight, right: node.strokeRightWeight, bottom: node.strokeBottomWeight, left: node.strokeLeftWeight }
    const uniform = Object.values(sides).every((w) => w === sides.top) ? node.strokeWeight : null
    const w = (side: keyof typeof sides) => (uniform ?? sides[side]) as number
    if (node.strokesIncludedInLayout && node.layoutMode !== 'NONE') {
      return `border-style:solid;border-color:${c};border-width:${w('top')}px ${w('right')}px ${w('bottom')}px ${w('left')}px;`
    }
    if (node.strokeAlign === 'OUTSIDE') shadows.unshift(`0 0 0 ${w('top')}px ${c}`)
    else if (uniform !== null) shadows.unshift(`inset 0 0 0 ${uniform}px ${c}`)
    else {
      if (w('top')) shadows.unshift(`inset 0 ${w('top')}px 0 ${c}`)
      if (w('bottom')) shadows.unshift(`inset 0 -${w('bottom')}px 0 ${c}`)
      if (w('left')) shadows.unshift(`inset ${w('left')}px 0 0 ${c}`)
      if (w('right')) shadows.unshift(`inset -${w('right')}px 0 0 ${c}`)
    }
    return ''
  }

  /** How this node sits in its parent: a flex item, or absolutely at x/y. */
  private placement(node: FakeNode, parent: FakeNode | null, modes: Modes): string {
    const auto = parent && parent.layoutMode !== 'NONE' && parent.type !== 'GROUP' && parent.type !== 'PAGE'
    const w = this.float(node, 'width', node.width, modes)
    const h = this.float(node, 'height', node.height, modes)
    if (!auto || node.layoutPositioning === 'ABSOLUTE') {
      // A hugging auto-layout frame sizes itself; anything else takes its size.
      const hugW = node.layoutMode !== 'NONE' && node.layoutSizingHorizontal === 'HUG'
      const hugH = node.layoutMode !== 'NONE' && node.layoutSizingVertical === 'HUG'
      return `position:absolute;left:${node.x}px;top:${node.y}px;${hugW ? '' : `width:${w}px;`}${hugH ? '' : `height:${h}px;`}`
    }
    const row = parent!.layoutMode === 'HORIZONTAL'
    let css = 'position:relative;flex-shrink:0;'
    const size = (axis: 'H' | 'V') => {
      const mode = axis === 'H' ? node.layoutSizingHorizontal : node.layoutSizingVertical
      const primary = (axis === 'H') === row
      const prop = axis === 'H' ? 'width' : 'height'
      const value = axis === 'H' ? w : h
      if (mode === 'FILL') return primary ? 'flex:1 1 0;min-width:0;' : 'align-self:stretch;'
      if (mode === 'HUG') return ''
      return `${prop}:${value}px;`
    }
    css += size('H') + size('V')
    return css
  }

  node(node: FakeNode, parent: FakeNode | null, modes: Modes): string {
    if (!node.visible) return ''
    const m = this.modesOf(node, modes)
    if (node.type === 'TEXT') return this.text(node, parent, m)
    if (node.type === 'VECTOR' || node.type === 'GROUP' || (this.vectorOnly(node) && node.type !== 'PAGE')) return this.svg(node, parent, m)
    const shadows = this.shadows(node, m)
    let css = this.placement(node, parent, m)
    css += this.background(node, m) + this.radius(node, m)
    css += this.strokes(node, m, shadows)
    if (shadows.length) css += `box-shadow:${shadows.join(',')};`
    if (node.opacity !== 1) css += `opacity:${node.opacity};`
    if (node.clipsContent) css += 'overflow:hidden;'
    const kids = node.rawChildren()
    let inner = ''
    if (node.layoutMode !== 'NONE' && node.type !== 'RECTANGLE' && node.type !== 'ELLIPSE') {
      const row = node.layoutMode === 'HORIZONTAL'
      const pad = (f: string, v: number) => this.float(node, f, v, m)
      const align = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', BASELINE: 'baseline' }[node.counterAxisAlignItems] ?? 'flex-start'
      const justify = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', SPACE_BETWEEN: 'space-between' }[node.primaryAxisAlignItems] ?? 'flex-start'
      css += `display:flex;flex-direction:${row ? 'row' : 'column'};align-items:${align};justify-content:${justify};`
      css += `gap:${node.layoutWrap === 'WRAP' ? `${node.counterAxisSpacing}px ` : ''}${pad('itemSpacing', node.itemSpacing)}px;`
      css += `padding:${pad('paddingTop', node.paddingTop)}px ${pad('paddingRight', node.paddingRight)}px ${pad('paddingBottom', node.paddingBottom)}px ${pad('paddingLeft', node.paddingLeft)}px;`
      if (node.layoutWrap === 'WRAP') css += 'flex-wrap:wrap;'
      css += 'box-sizing:border-box;'
    }
    inner = kids.map((k) => this.node(k, node, m)).join('')
    if (node.scale && node.scale !== 1) {
      const s = node.scale
      inner = `<div style="position:absolute;left:0;top:0;width:${node.width / s}px;height:${node.height / s}px;transform:scale(${s});transform-origin:0 0">${inner}</div>`
    }
    return `<div data-name="${esc(node.name)}" style="${esc(css)}">${inner}</div>`
  }

  private text(node: FakeNode, parent: FakeNode | null, modes: Modes): string {
    const font = node.fontName
    const weight = /semi ?bold/i.test(font.style) ? 600 : /bold/i.test(font.style) ? 700 : /medium/i.test(font.style) ? 500 : 400
    const lh = node.lineHeight as Json
    const ls = node.letterSpacing as Json
    const color = node.fills[0] ? this.color(node.fills[0], modes) : 'transparent'
    let css = this.placement(node, parent, modes)
    if (node.textAutoResize === 'WIDTH_AND_HEIGHT') css = css.replace(/(^|;)width:[^;]+;/, '$1').replace(/(^|;)height:[^;]+;/, '$1')
    if (node.textAutoResize === 'HEIGHT') css = css.replace(/(^|;)height:[^;]+;/, '$1')
    css += `font-family:'${font.family}';font-weight:${weight};font-size:${node.fontSize}px;color:${color};`
    css += lh.unit === 'PIXELS' ? `line-height:${lh.value}px;` : 'line-height:normal;'
    if (ls.value) css += `letter-spacing:${ls.unit === 'PERCENT' ? `${(ls.value as number) / 100}em` : `${ls.value}px`};`
    if (node.textCase === 'UPPER') css += 'text-transform:uppercase;'
    css += `text-align:${node.textAlignHorizontal.toLowerCase()};`
    if (node.textAutoResize === 'WIDTH_AND_HEIGHT') css += 'white-space:pre;'
    if (node.textTruncation === 'ENDING' && node.maxLines === 1) css += 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
    if (node.opacity !== 1) css += `opacity:${node.opacity};`
    return `<div data-name="${esc(node.name)}" style="${esc(css)}">${esc(node.characters)}</div>`
  }

  /** Whether a subtree is only vectors and groups (an icon, a plot): drawn as one SVG. */
  private vectorOnly(node: FakeNode): boolean {
    const kids = node.rawChildren()
    return (node.type === 'COMPONENT' || node.type === 'INSTANCE') && node.layoutMode === 'NONE' && kids.length > 0 && kids.every((k) => k.type === 'VECTOR' || k.type === 'GROUP')
  }

  private svg(node: FakeNode, parent: FakeNode | null, modes: Modes): string {
    // An icon-like container: one SVG in its own box. A lone vector or group: an SVG over its parent.
    const own = node.type !== 'VECTOR' && node.type !== 'GROUP'
    const w = own ? node.width : (parent?.width ?? 24)
    const h = own ? node.height : (parent?.height ?? 24)
    const s = own ? (node.scale ?? 1) : 1
    let css = own ? this.placement(node, parent, modes) : 'position:absolute;left:0;top:0;'
    if (!own) css += `width:${w}px;height:${h}px;`
    const body = own ? node.rawChildren().map((k) => this.draw(k, modes)).join('') : this.draw(node, modes)
    const content = s !== 1 ? `<g transform="scale(${s})">${body}</g>` : body
    return `<svg data-name="${esc(node.name)}" style="${esc(css)}overflow:visible" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${content}</svg>`
  }

  private draw(node: FakeNode, modes: Modes): string {
    if (!node.visible) return ''
    if (node.type === 'GROUP') {
      const kids = node.rawChildren()
      const mask = kids.find((k) => k.isMask)
      const rest = kids.filter((k) => !k.isMask).map((k) => this.draw(k, modes)).join('')
      if (!mask) return `<g>${rest}</g>`
      const id = `m${this.ids++}`
      const type = mask.maskType === 'LUMINANCE' ? 'luminance' : 'alpha'
      const drawnMask = mask.type === 'GROUP' ? mask.rawChildren().map((k) => this.draw(k, modes)).join('') : this.draw(Object.assign(Object.create(Object.getPrototypeOf(mask)), mask, { isMask: false }), modes)
      return `<mask id="${id}" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1000" height="1000" style="mask-type:${type}">${drawnMask}</mask><g mask="url(#${id})">${rest}</g>`
    }
    if (node.type === 'VECTOR' && node.svgPath) {
      const fill = node.fills[0] ? this.color(node.fills[0], modes) : 'none'
      const stroke = node.strokes[0] ? this.color(node.strokes[0], modes) : 'none'
      const dash = node.dashPattern.length ? ` stroke-dasharray="${node.dashPattern.join(' ')}"` : ''
      const o = node.svgOrigin ?? { x: node.x, y: node.y }
      const move = node.x !== o.x || node.y !== o.y ? ` transform="translate(${node.x - o.x} ${node.y - o.y})"` : ''
      const rule = node.windingRule === 'EVENODD' ? ' fill-rule="evenodd"' : ''
      return `<path${move} d="${node.svgPath}"${rule} fill="${fill}" stroke="${stroke}" stroke-width="${node.strokeWeight}" stroke-linecap="${node.strokeCap === 'ROUND' ? 'round' : 'butt'}" stroke-linejoin="${node.strokeJoin === 'ROUND' ? 'round' : 'miter'}" opacity="${node.opacity}"${dash}/>`
    }
    return ''
  }

  page(page: FakeNode, background = '#e7e7ea'): string {
    const kids = page.rawChildren()
    const width = Math.max(...kids.map((k) => k.x + k.width), 100)
    const body = kids.map((k) => this.node(k, page, this.modesOf(page, {}))).join('')
    return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss()}
*{box-sizing:border-box}body{margin:0;background:${background};font-synthesis:none;-webkit-font-smoothing:antialiased}
.page{position:relative;width:${width + 80}px;min-height:100px;padding:40px}</style></head>
<body><div class="page"><div style="position:relative">${body}</div></div></body></html>`
  }
}
