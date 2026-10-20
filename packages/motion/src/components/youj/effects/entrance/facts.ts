import type { Glyph, Reader } from './read'

/* An optional reader for a look that needs more than the parts (./read.ts): colours named by their token, the grey a
 * fill is drawn in, and each text's words line by line. A look opts in with `reader` (Blueprint does); one that doesn't
 * import it doesn't ship it. */

const COLOR_TOKENS =
  'canvas surface well chrome control field band fg fg-muted fg-subtle line line-subtle line-strong line-control accent accent-subtle accent-text accent-contrast action on-action on-accent inverse selected hover success danger warning info'.split(
    ' ',
  )

/** Resolves the theme's colour tokens to the strings computed styles use, so a fill reads as `surface`, not a number. */
function tokenNames(probeHost: Element) {
  const probe = document.createElement('i')
  probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden'
  probeHost.append(probe)
  const names = new Map<string, string>()
  let canvas = ''
  for (const name of COLOR_TOKENS) {
    probe.style.color = `var(--color-${name})`
    const value = getComputedStyle(probe).color
    if (!names.has(value)) names.set(value, name)
    if (name === 'canvas') canvas = value
  }
  probe.remove()
  return { name: (c: string) => names.get(c), canvas }
}

/** The element's own words, line by line, as the page broke them: each line is the longest run of a text node that
 * still lays out as one box (a binary search per line, so a paragraph costs a few dozen reads, not one per letter). */
function glyphLines(el: Element, ox: number, oy: number, k: number, transform: string) {
  const range = document.createRange()
  const out: Glyph[] = []
  const shape = (s: string) =>
    transform === 'uppercase'
      ? s.toUpperCase()
      : transform === 'lowercase'
        ? s.toLowerCase()
        : transform === 'capitalize'
          ? s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
          : s
  for (const n of el.childNodes) {
    if (n.nodeType !== 3) continue
    const text = n.textContent!
    const one = (start: number, end: number) => {
      range.setStart(n, start)
      range.setEnd(n, end)
      let boxes = 0
      for (const r of range.getClientRects()) if (r.width > 0) boxes++
      return boxes <= 1
    }
    let start = 0
    while (start < text.length) {
      while (start < text.length && /\s/.test(text[start]!)) start++
      if (start >= text.length) break
      let lo = start + 1
      let hi = text.length
      if (one(start, hi)) lo = hi
      else
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1
          if (one(start, mid)) lo = mid
          else hi = mid - 1
        }
      range.setStart(n, start)
      range.setEnd(n, lo)
      const r = range.getBoundingClientRect()
      const s = text.slice(start, lo).replace(/\s+/g, ' ').trim()
      if (s && r.width >= 1) out.push({ s: shape(s), x: (r.left - ox) / k, y: (r.top - oy) / k, w: r.width / k, h: r.height / k })
      start = lo
    }
  }
  range.detach()
  return out
}

/** How far a colour sits from the page, 0 to 1 (a translucent fill counts for its opacity): the drawing's grey for a filled box. */
function toneOf() {
  const c = document.createElement('canvas')
  c.width = c.height = 1
  const ctx = c.getContext('2d', { willReadFrequently: true })
  const seen = new Map<string, [number, number]>()
  const read = (color: string) => {
    let v = seen.get(color)
    if (!v && ctx) {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data
      v = [(0.299 * r + 0.587 * g + 0.114 * b) / 255, a / 255]
      seen.set(color, v)
    }
    return v
  }
  return (fill: string, page: string) => {
    const f = read(fill)
    const p = read(page)
    return f && p && f[1] ? Math.abs(f[0] - p[0]) * f[1] : undefined
  }
}

/** The reader with token names, tones and glyphs: `{ ..., reader }` on a look. */
export function reader(probeHost: Element): Reader {
  const { name, canvas } = tokenNames(probeHost)
  return { token: name, tone: toneOf(), canvas, glyphs: glyphLines }
}
