/* Downloads of a scene's current frame, standalone. The scene paints with the
 * theme's custom properties (every face is a color-mix of --color-* tokens,
 * set on its group as --kg-*), which mean nothing outside the page, so the
 * SVG is rebuilt from what the browser computed: every paint becomes a plain
 * sRGB color on a presentation attribute, the styles and data attributes
 * go, and what's left opens anywhere (a browser, Figma, an <img>). The PNG
 * is that SVG drawn on a canvas, at 1× or 2× the scene's natural size. */

/** The properties a scene paints with, written back as attributes. */
const PAINT = ['fill', 'stroke', 'stop-color'] as const
const PLAIN = ['stroke-width', 'stroke-linejoin', 'stroke-linecap', 'stroke-dasharray', 'vector-effect', 'opacity', 'fill-opacity', 'stroke-opacity', 'stop-opacity', 'fill-rule'] as const
/** Values a property has anyway, left off to keep the file small. */
const INITIAL: Record<string, string> = {
  opacity: '1',
  'fill-opacity': '1',
  'stroke-opacity': '1',
  'stop-opacity': '1',
  'stroke-dasharray': 'none',
  'vector-effect': 'none',
  'fill-rule': 'nonzero',
  'stroke-linejoin': 'miter',
  'stroke-linecap': 'butt',
}

export interface ColorProbe {
  /** Any CSS color as sRGB bytes, 0–255 each (alpha too). */
  rgba: (color: string) => [number, number, number, number]
}

/** Resolves colors by painting a pixel: exact for any color the browser knows (oklab, color-mix, display-p3, clipped to sRGB). */
export function canvasProbe(): ColorProbe {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const cache = new Map<string, [number, number, number, number]>()
  return {
    rgba(color) {
      const hit = cache.get(color)
      if (hit) return hit
      let out: [number, number, number, number] = [0, 0, 0, 0]
      if (ctx) {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = '#000'
        ctx.fillStyle = color
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
        out = [r!, g!, b!, a!]
      }
      cache.set(color, out)
      return out
    },
  }
}

const hex = (n: number) => n.toString(16).padStart(2, '0')
const round = (n: number) => String(Math.round(n * 1000) / 1000)

/** A computed paint as an attribute value and its opacity: `url(#id)` stays a reference, a color becomes #rrggbb. */
export function paintOf(value: string, probe: ColorProbe): { paint: string; alpha?: number } {
  const v = value.trim()
  if (!v || v === 'none' || v === 'transparent') return { paint: 'none' }
  const ref = v.match(/^url\(\s*["']?(#[^"')]+)["']?\s*\)/)
  if (ref) return { paint: `url(${ref[1]})` }
  const [r, g, b, a] = probe.rgba(v)
  if (a === 0) return { paint: 'none' }
  return { paint: `#${hex(r)}${hex(g)}${hex(b)}`, alpha: a < 255 ? Math.round((a / 255) * 1000) / 1000 : undefined }
}

/** `3px, 3px` → `6 6` at twice the size; `none` stays none. */
function scaleLengths(value: string, scale: number) {
  if (value === 'none') return value
  return value
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((part) => round(parseFloat(part) * scale))
    .join(' ')
}

export interface SerializeOptions {
  /** Names the drawing: a <title>. */
  title: string
  /** Output size relative to the scene's natural size. Hairlines scale with it, as they would on a screen that dense. Default 1. */
  scale?: number
  /** A color to paint behind the scene; transparent without one. */
  background?: string
  probe?: ColorProbe
  /** How to read a live element's styles. Default getComputedStyle. */
  computed?: (el: Element) => Pick<CSSStyleDeclaration, 'getPropertyValue'>
}

/** The natural size of a scene's drawing: its viewBox, one user unit to a CSS pixel. */
export function naturalSize(svg: SVGSVGElement): { width: number; height: number; viewBox: string } {
  const viewBox = svg.getAttribute('viewBox') ?? '0 0 0 0'
  const [, , w = 0, h = 0] = viewBox.split(/[\s,]+/).map(Number)
  return { width: Math.round(w), height: Math.round(h), viewBox }
}

/**
 * The scene as a standalone SVG document: the live element's computed paints
 * as attributes on a copy, no styles, no custom properties, no data attributes.
 */
export function serializeScene(svg: SVGSVGElement, options: SerializeOptions): string {
  const { title, scale = 1, background, probe = canvasProbe(), computed = (el) => getComputedStyle(el) } = options
  const { width, height, viewBox } = naturalSize(svg)
  const copy = svg.cloneNode(true) as SVGSVGElement
  const live = [svg, ...svg.querySelectorAll('*')]
  const out = [copy, ...copy.querySelectorAll('*')]

  live.forEach((el, i) => {
    const target = out[i]!
    const style = computed(el)
    const tag = el.tagName.toLowerCase()
    for (const attr of [...target.attributes]) {
      const name = attr.name
      if (name === 'style' || name === 'class' || name.startsWith('data-') || name.startsWith('aria-') || name === 'focusable' || name === 'role') target.removeAttribute(name)
    }
    if (tag === 'title' || tag === 'desc') return
    if (tag === 'stop') {
      const { paint, alpha } = paintOf(style.getPropertyValue('stop-color'), probe)
      target.setAttribute('stop-color', paint === 'none' ? '#000000' : paint)
      const opacity = (alpha ?? 1) * (parseFloat(style.getPropertyValue('stop-opacity')) || (paint === 'none' ? 0 : 1))
      if (opacity < 1) target.setAttribute('stop-opacity', round(opacity))
      return
    }
    if (tag === 'g' || tag === 'svg') {
      // A group carries its motion as a transform (a part lifted apart); the paint lives on its shapes.
      const transform = style.getPropertyValue('transform')
      if (tag === 'g' && transform && transform !== 'none') target.setAttribute('transform', transform.replace(/,\s*/g, ' '))
      const opacity = style.getPropertyValue('opacity')
      if (opacity && opacity !== '1') target.setAttribute('opacity', opacity)
      return
    }
    if (tag === 'defs' || tag === 'lineargradient' || tag === 'radialgradient' || tag === 'clippath' || tag === 'mask') return
    for (const prop of PAINT) {
      if (prop === 'stop-color') continue
      const { paint, alpha } = paintOf(style.getPropertyValue(prop), probe)
      target.setAttribute(prop, paint)
      if (alpha !== undefined) target.setAttribute(`${prop}-opacity`, String(alpha))
    }
    for (const prop of PLAIN) {
      let value = style.getPropertyValue(prop).trim()
      if (!value || value === INITIAL[prop]) continue
      if (prop === 'stroke-width') value = round(parseFloat(value) * (style.getPropertyValue('vector-effect').trim() === 'non-scaling-stroke' ? scale : 1))
      if (prop === 'stroke-dasharray') value = scaleLengths(value, scale)
      // An opacity from the paint's alpha is already set; multiply rather than overwrite.
      if ((prop === 'fill-opacity' || prop === 'stroke-opacity') && target.hasAttribute(prop)) value = round(parseFloat(value) * parseFloat(target.getAttribute(prop)!))
      target.setAttribute(prop, value)
    }
  })

  // The serializer declares the SVG namespace itself (setting xmlns too would write it twice, which no XML parser accepts).
  copy.setAttribute('viewBox', viewBox)
  copy.setAttribute('width', String(Math.round(width * scale)))
  copy.setAttribute('height', String(Math.round(height * scale)))
  copy.setAttribute('role', 'img')
  for (const old of copy.querySelectorAll(':scope > title, :scope > desc')) old.remove()
  const doc = copy.ownerDocument
  const name = doc.createElementNS('http://www.w3.org/2000/svg', 'title')
  name.textContent = title
  copy.insertBefore(name, copy.firstChild)
  if (background) {
    const [x = 0, y = 0, w = 0, h = 0] = viewBox.split(/[\s,]+/).map(Number)
    const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
    for (const [k, v] of Object.entries({ x, y, width: w, height: h })) rect.setAttribute(k, String(v))
    const { paint } = paintOf(background, probe)
    rect.setAttribute('fill', paint)
    name.after(rect)
  }
  // Ids stay as the scene wrote them: unique within the file, which is all a standalone document needs.
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(copy)}\n`
}

/** Draws a standalone SVG on a canvas at its own size and returns the PNG. */
export async function rasterize(svgText: string, width: number, height: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }))
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No 2D canvas')
    ctx.drawImage(image, 0, 0, width, height)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The canvas made no PNG'))), 'image/png'))
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Saves a file through a temporary link. */
export function download(data: Blob | string, filename: string, type = 'image/svg+xml') {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const fileName = (id: string, ext: 'svg' | 'png', scale = 1) => `youj-${id}${scale > 1 ? `@${scale}x` : ''}.${ext}`
