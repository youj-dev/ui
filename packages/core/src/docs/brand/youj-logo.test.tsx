import { render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '../../lib/youj/provider'
import { YoujLockup, YoujMark, YoujWordmark } from './youj-logo'
import {
  GRID,
  LOCKUP,
  LOCKUP_EM,
  LOCKUP_UI_EM,
  LOCKUP_UI_VIEWBOX,
  LOCKUP_UI_WIDTH,
  LOCKUP_VIEWBOX,
  WORDMARK_UI_VIEWBOX,
  WORDMARK_UI_WIDTH,
  WORDMARK_VIEWBOX,
  WORDMARK_WIDTH,
  appIconSvg,
  block,
  blockSvg,
  favicon,
  faviconSvg,
  lockupSvg,
  logoLetters,
  mark,
  markOnlySvg,
  tittle,
  uiTag,
  wordmarkLetters,
  wordmarkParticles,
} from './logo'

type Pt = [number, number]

/** Every end and control point of a path (M, L, H, V, Q, C, A, Z, absolute or relative), as absolute [x, y]. */
function points(d: string) {
  const out: Pt[] = []
  let x = 0
  let y = 0
  let start: Pt = [0, 0]
  for (const [, cmd, args] of d.matchAll(/([MLHVQCAZ])([^MLHVQCAZ]*)/gi)) {
    const n = (args!.match(/-?(\d+\.?\d*|\.\d+)/g) ?? []).map(Number)
    const rel = cmd !== cmd!.toUpperCase()
    const C = cmd!.toUpperCase()
    const ox = rel ? x : 0
    const oy = rel ? y : 0
    if (C === 'Z') [x, y] = start
    else if (C === 'H') out.push([(x = ox + n[0]!), y])
    else if (C === 'V') out.push([x, (y = oy + n[0]!)])
    else if (C === 'A') for (let i = 0; i + 6 < n.length; i += 7) out.push([(x = ox + n[i + 5]!), (y = oy + n[i + 6]!)])
    else {
      const step = C === 'Q' ? 4 : C === 'C' ? 6 : 2
      for (let i = 0; i + step - 1 < n.length; i += step) {
        const bx = rel ? x : 0
        const by = rel ? y : 0
        for (let j = 0; j < step; j += 2) out.push([bx + n[i + j]!, by + n[i + j + 1]!])
        ;[x, y] = out.at(-1)!
      }
      if (C === 'M') start = [x, y]
    }
  }
  return out
}
const box = (d: string) => {
  const p = points(d)
  const xs = p.map(([x]) => x)
  const ys = p.map(([, y]) => y)
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}

/** The cubic segments of an absolute M/H/V/C/Z path, each as its four points. */
function cubics(d: string) {
  const out: [Pt, Pt, Pt, Pt][] = []
  let at: Pt = [0, 0]
  for (const [, cmd, args] of d.matchAll(/([MHVCZ])([^MHVCZ]*)/g)) {
    const n = (args!.match(/-?(\d+\.?\d*|\.\d+)/g) ?? []).map(Number)
    if (cmd === 'M') at = [n[0]!, n[1]!]
    else if (cmd === 'H') at = [n[0]!, at[1]]
    else if (cmd === 'V') at = [at[0], n[0]!]
    else if (cmd === 'C') {
      const seg: [Pt, Pt, Pt, Pt] = [at, [n[0]!, n[1]!], [n[2]!, n[3]!], [n[4]!, n[5]!]]
      out.push(seg)
      at = seg[3]
    }
  }
  return out
}

/** A bend in a canonical pose: leaving its start vertically, turned into the positive quadrant, as its three points relative to the start. */
function pose([p0, p1, p2, p3]: [Pt, Pt, Pt, Pt]): Pt[] {
  const [a, b, c, e] = p1[0] === p0[0] ? [p0, p1, p2, p3] : [p3, p2, p1, p0]
  const sx = Math.sign(e[0] - a[0])
  const sy = Math.sign(e[1] - a[1])
  return [b, c, e].map(([x, y]) => [+((x - a[0]) * sx).toFixed(3), +((y - a[1]) * sy).toFixed(3)])
}

/** Signed area of a closed outline through its points (positive is clockwise on screen). */
function area(d: string) {
  const p = points(d)
  let s = 0
  p.forEach(([x, y], i) => {
    const [nx, ny] = p[(i + 1) % p.length]!
    s += x * ny - nx * y
  })
  return s / 2
}

const letter = (l: string) => wordmarkLetters.find((x) => x.letter === l)!
const stems = (l: string) =>
  points(letter(l).d)
    .filter(([, y]) => y === GRID.xHeight)
    .map(([x]) => x)
    .sort((p, q) => p - q)
const colors = { ink: '#14161c', accent: '#3553fb', canvas: '#efeff0', onAccent: '#fdfdfd' }

/** The j's hook, outside and inside: every corner in the word turns on one of these. */
const OUTER: Pt[] = [
  [0, 2.45],
  [1.2, 3.2],
  [2.59, 3.2],
]
const INNER: Pt[] = [
  [0, 0.8],
  [0.1, 1.2],
  [0.55, 1.2],
]

describe('the lettering', () => {
  test('spells youj, with one particle: the tittle of the j', () => {
    expect(wordmarkLetters.map((l) => l.letter).join('')).toBe('youj')
    expect(wordmarkParticles).toHaveLength(1)
  })

  test('every letter stands flat on the x-height and stays inside the viewBox; the o and u sit on the baseline, the y and j descend', () => {
    expect(Number(WORDMARK_VIEWBOX.split(' ')[2])).toBe(WORDMARK_WIDTH)
    for (const l of wordmarkLetters) {
      const b = box(l.d)
      expect(b.x0).toBeGreaterThanOrEqual(0)
      expect(b.x1).toBeLessThanOrEqual(WORDMARK_WIDTH)
      expect(b.y0).toBe(GRID.xHeight)
      expect(b.y1).toBe('yj'.includes(l.letter) ? GRID.descender : GRID.baseline)
    }
  })

  test('is one stroke: stems 2.19 wide, horizontals 1.95', () => {
    for (const l of 'yuj') {
      const s = stems(l)
      for (let i = 0; i < s.length; i += 2) expect(s[i + 1]! - s[i]!).toBeCloseTo(2.19, 5)
    }
    const [outline, counter] = letter('o').d.split(/(?=M)/)
    const a = box(outline!)
    const c = box(counter!)
    expect([c.x0 - a.x0, a.x1 - c.x1, c.y0 - a.y0, a.y1 - c.y1].map((v) => +v.toFixed(3))).toEqual([2.19, 2.19, 1.95, 1.95])
    /** The horizontal a letter draws between two x's and two y's: its two edges, as distinct y's. */
    const bar = (l: string, x0: number, x1: number, y0: number, y1: number) => [
      ...new Set(
        points(letter(l).d)
          .filter(([x, y]) => x > x0 && x < x1 && y >= y0 && y <= y1)
          .map(([, y]) => y),
      ),
    ]
    // the u's foot, the y's bowl and tail, the j's hook
    for (const edges of [
      bar('u', 25.46, 30.95, 0, 24),
      bar('y', 2.19, 7.68, 0, GRID.baseline),
      bar('y', 0, 7.68, 21, 24),
      bar('j', 0, 35.2, 21, 24),
    ]) {
      expect(edges).toHaveLength(2)
      expect(Math.abs(edges[0]! - edges[1]!)).toBeCloseTo(1.95, 5)
    }
  })

  test('turns every corner with the j’s bend: its outer curve, 2.59 by 3.2, or its inner, 0.55 by 1.2', () => {
    const count = { outer: 0, inner: 0 }
    for (const l of wordmarkLetters) {
      for (const c of cubics(l.d)) {
        const p = pose(c)
        const kind = p[2]![0] > 1 ? 'outer' : 'inner'
        expect(p, `${l.letter}: ${c.flat().join(' ')}`).toEqual(kind === 'outer' ? OUTER : INNER)
        count[kind] += 1
      }
    }
    // u 2 + 2, o 4 + 4, the y's bowl 1 + 2 and its tail 1 + 1, the j 1 + 1
    expect(count).toEqual({ outer: 9, inner: 10 })
  })

  test('the o is the u closed: as wide as the u, square to the x-height and baseline, its counter open under either fill rule', () => {
    const o = box(letter('o').d)
    const u = box(letter('u').d)
    expect(o.x1 - o.x0).toBeCloseTo(u.x1 - u.x0, 5)
    expect([o.y0, o.y1]).toEqual([GRID.xHeight, GRID.baseline])
    const [outline, counter] = letter('o').d.split(/(?=M)/)
    expect(Math.sign(area(outline!))).toBe(-Math.sign(area(counter!)))
  })

  test('the y is the u’s bowl lifted 1.25 on the j’s tail, at the j’s length and depth', () => {
    const y = letter('y').d
    const j = letter('j').d
    // the bowl's foot stands 1.25 above the baseline, as thick as the u's
    const foot = points(y)
      .filter(([x]) => x > 2 && x < 7.7)
      .map(([, v]) => v)
    expect(Math.max(...foot.filter((v) => v < GRID.baseline))).toBeCloseTo(GRID.baseline - 1.25, 5)
    // the tail is the j's hook, moved onto the y's right stem
    const tail = (d: string, right: number) =>
      points(d)
        .filter(([, v]) => v >= 20.8)
        .map(([x, v]) => [+(x - right).toFixed(3), v])
    expect(tail(y, stems('y').at(-1)!)).toEqual(tail(j, stems('j').at(-1)!))
  })

  test('the tittle sits on the ascender line, centred over the j’s stem and clear of the x-height', () => {
    const [p] = wordmarkParticles
    const s = stems('j')
    expect(p!.y).toBe(GRID.ascender)
    expect(p!.x + p!.size / 2).toBeCloseTo((s[0]! + s[1]!) / 2, 5)
    expect(p!.y + p!.size).toBeLessThan(GRID.xHeight - 1)
  })

  test('the text cut grows the tittle 1.3× about the same centre, and it still clears the x-height', () => {
    const { display, text } = tittle
    expect(text.size).toBeCloseTo(display.size * 1.3, 2)
    expect(text.x + text.size / 2).toBeCloseTo(display.x + display.size / 2, 5)
    expect(text.y + text.size / 2).toBeCloseTo(display.y + display.size / 2, 5)
    expect(GRID.xHeight - (text.y + text.size)).toBeGreaterThan(1.5)
  })

  test("the word's ink spans the viewBox", () => {
    expect(box(wordmarkLetters[0]!.d).x0).toBe(0)
    expect(Math.max(...wordmarkLetters.map((l) => box(l.d).x1))).toBeCloseTo(WORDMARK_WIDTH, 5)
  })

  test('the UI tag follows the word by a word space and closes the wider viewBox', () => {
    const tag = uiTag.map((l) => box(l.d))
    expect(Math.min(...tag.map((b) => b.x0)) - WORDMARK_WIDTH).toBeCloseTo(4.57, 5)
    expect(Math.max(...tag.map((b) => b.x1))).toBeCloseTo(WORDMARK_UI_WIDTH, 5)
    expect(Number(WORDMARK_UI_VIEWBOX.split(' ')[2])).toBe(WORDMARK_UI_WIDTH)
  })
})

describe('logo geometry', () => {
  test('the logo is the word itself', () => {
    expect(logoLetters).toBe(wordmarkLetters)
  })

  test('its box, set 1em tall, is the band from the ascender to the descender with half a unit around, flush with the y', () => {
    expect(LOCKUP.y).toBe(GRID.ascender - 0.5)
    expect(LOCKUP.y + LOCKUP.height).toBe(GRID.descender + 0.5)
    expect(LOCKUP.x).toBe(box(letter('y').d).x0)
    expect(LOCKUP.x + LOCKUP.width).toBeCloseTo(WORDMARK_WIDTH + 0.5, 5)
    expect(LOCKUP_VIEWBOX).toBe(`${LOCKUP.x} ${LOCKUP.y} ${LOCKUP.width} ${LOCKUP.height}`)
    expect(LOCKUP_EM).toBeCloseTo(LOCKUP.width / LOCKUP.height, 5)
    // either tittle stays inside it
    for (const t of Object.values(tittle)) {
      expect(t.y).toBeGreaterThanOrEqual(LOCKUP.y)
      expect(t.x + t.size).toBeLessThanOrEqual(LOCKUP.x + LOCKUP.width)
    }
  })

  test('the UI lockup is the same band, closed by the I', () => {
    expect(LOCKUP_UI_VIEWBOX).toBe(`${LOCKUP.x} ${LOCKUP.y} ${LOCKUP_UI_WIDTH} ${LOCKUP.height}`)
    expect(LOCKUP_UI_WIDTH).toBe(box(uiTag.at(-1)!.d).x1)
    expect(LOCKUP_UI_EM).toBeCloseTo(LOCKUP_UI_WIDTH / LOCKUP.height, 5)
  })
})

describe('mark geometry', () => {
  test("the mark is the logo's u in a square badge, 0.52 of it wide, centred across and a unit below centre", () => {
    const t = box(mark.tile)
    expect([t.x0, t.y0, t.x1, t.y1]).toEqual([0, 0, 24, 24])
    const ub = box(letter('u').d)
    const s = (24 * 0.52) / (ub.x1 - ub.x0)
    const ox = (24 - (ub.x1 - ub.x0) * s) / 2
    const oy = (24 - (ub.y1 - ub.y0) * s) / 2 + 1
    const u = points(letter('u').d)
    const scaled = points(mark.glyph)
    expect(scaled).toHaveLength(u.length)
    scaled.forEach(([x, y], i) => {
      expect(x).toBeCloseTo((u[i]![0] - ub.x0) * s + ox, 2)
      expect(y).toBeCloseTo((u[i]![1] - ub.y0) * s + oy, 2)
    })
    expect([mark.xHeight, mark.baseline]).toEqual([box(mark.glyph).y0, box(mark.glyph).y1])
  })

  test('the tittle stands in the counter, 0.38 of the u wide, as far off the floor as off either stem', () => {
    const [, inL, inR] = points(mark.glyph)
      .filter(([, y]) => y === mark.xHeight)
      .map(([x]) => x)
      .sort((p, q) => p - q)
    const floor = Math.max(
      ...points(mark.glyph)
        .filter(([x, y]) => x > inL! && x < inR! && y < mark.baseline)
        .map(([, y]) => y),
    )
    const t = mark.tittle
    const g = box(mark.glyph)
    expect(t.size / (g.x1 - g.x0)).toBeCloseTo(0.38, 2)
    expect(t.x - inL!).toBeCloseTo(inR! - (t.x + t.size), 2)
    expect(floor - (t.y + t.size)).toBeCloseTo(t.x - inL!, 2)
  })

  test('the hinted favicons stand on whole pixels: the u’s stems, foot and tittle, with air all round the tittle', () => {
    for (const [size, weight, dot, air] of [
      [16, 2, 4, 1],
      [32, 4, 8, 2],
    ] as const) {
      const { tile, glyph, tittle: t } = favicon[size]
      const b = box(tile)
      expect([b.x0, b.y0, b.x1, b.y1]).toEqual([0, 0, size, size])
      for (const [x, y] of points(glyph)) expect([x, y].every(Number.isInteger)).toBe(true)
      expect([t.x, t.y, t.size].every(Number.isInteger)).toBe(true)
      const g = box(glyph)
      const [l0, l1, r0, r1] = points(glyph)
        .filter(([, y]) => y === g.y0)
        .map(([x]) => x)
        .sort((p, q) => p - q)
      expect([l1! - l0!, r1! - r0!]).toEqual([weight, weight])
      // centred across, the tittle centred between the stems
      expect(g.x0).toBe(size - g.x1)
      expect(t.size).toBe(dot)
      expect([t.x - l1!, r0! - (t.x + t.size)]).toEqual([air, air])
      // the foot as heavy as the stems, the tittle as far off it as off the stems
      expect(g.y1 - weight - (t.y + t.size)).toBe(air)
    }
  })

  test('Block builds the tittle as an isometric block standing in the counter, its top face the tittle’s width', () => {
    const pts = (d: string) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as Pt)
    const top = pts(block.faces.top)
    const xs = top.map(([x]) => x)
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(0.46 * (box(mark.glyph).x1 - box(mark.glyph).x0) * block.scale, 2)
    // the block stands on its lowest point, inside the u's counter (grown with it about the badge's centre)
    const all = [...top, ...pts(block.faces.left), ...pts(block.faces.right)]
    const grow = (v: number) => 12 + (v - 12) * block.scale
    const [, inL, inR] = points(mark.glyph)
      .filter(([, y]) => y === mark.xHeight)
      .map(([x]) => x)
      .sort((p, q) => p - q)
    for (const [x] of all) expect(x).toBeGreaterThan(grow(inL!))
    for (const [x] of all) expect(x).toBeLessThan(grow(inR!))
    expect(Math.max(...all.map(([, y]) => y))).toBeLessThan(grow(17.761))
  })
})

describe('static SVGs', () => {
  const fills = (svg: string) => [...svg.matchAll(/fill="([^"]+)"/g)].map((m) => m[1])
  const rect = (t: { x: number; y: number; size: number }, fill: string) =>
    `<rect x="${t.x}" y="${t.y}" width="${t.size}" height="${t.size}" fill="${fill}"/>`

  test('the logo is the word in the ink and the tittle in the accent, no badge; grown at text size unless asked for display', () => {
    const svg = lockupSvg(colors)
    expect(svg).toContain(`viewBox="${LOCKUP_VIEWBOX}" width="${+(LOCKUP_EM * 24).toFixed(3)}" height="24"`)
    expect(svg).toContain(`<path d="${logoLetters.map((l) => l.d).join('')}" fill="${colors.ink}"/>`)
    expect(svg).toContain(rect(tittle.text, colors.accent))
    expect(lockupSvg(colors, 'display')).toContain(rect(tittle.display, colors.accent))
    expect(fills(svg)).toEqual([colors.ink, colors.accent])
    expect(svg).not.toMatch(/stroke|evenodd|mask/)
  })

  test('the mark cuts the u out of the badge; the tittle is its one colour', () => {
    const only = markOnlySvg(colors)
    expect(only).toContain(`<path d="${mark.tile}${mark.glyph}" fill-rule="evenodd" fill="${colors.ink}"/>`)
    expect(fills(only)).toEqual([colors.ink, colors.accent])
  })

  test('the favicon draws the hinted design for its size, 32 by default: the badge in the ink, the u in the canvas', () => {
    expect(faviconSvg(colors)).toMatch(/viewBox="0 0 32 32"/)
    for (const size of [16, 32] as const) {
      const svg = faviconSvg(colors, size)
      const { tile, glyph, tittle: t } = favicon[size]
      expect(svg).toContain(`viewBox="0 0 ${size} ${size}"`)
      expect(svg).toContain(`<path d="${tile}" fill="${colors.ink}"/><path d="${glyph}" fill="${colors.canvas}"/>`)
      expect(svg).toContain(rect(t, colors.accent))
    }
  })

  test('the app icon is the mark full bleed: the square in the ink, the u in the canvas, the tittle in the accent', () => {
    const svg = appIconSvg(colors)
    expect(svg).toContain('viewBox="0 0 24 24" width="180" height="180"><rect width="24" height="24"')
    expect(svg).toContain(`<path d="${mark.glyph}" fill="${colors.canvas}"/>`)
    expect(svg).toContain(rect(mark.tittle, colors.accent))
    expect(fills(svg)).toEqual([colors.ink, colors.canvas, colors.accent])
    expect(svg).not.toContain(' rx=')
  })

  test('Block is full bleed: the u in the canvas, the block’s top in the accent, its sides the canvas and a mix toward the ink', () => {
    const svg = blockSvg(colors)
    expect(fills(svg)).toEqual([colors.ink, colors.canvas, colors.accent, colors.canvas, '#8c8d91'])
    expect(svg).toContain(`d="${block.faces.top}" fill="${colors.accent}"`)
    expect(svg).not.toContain(' rx=')
  })
})

const cutOf = (svg: Element) => {
  const masked = svg.querySelector<SVGPathElement>('path[mask]')!
  const id = masked.getAttribute('mask')!.match(/^url\(#(.+)\)$/)![1]!
  return { masked, mask: svg.querySelector(`mask[id="${id}"]`)! }
}
const ty = (el: Element) => {
  const m = (el as SVGElement).style.transform.match(/translateY\((-?[\d.]+)px\)/)
  return m ? Number(m[1]) : 0
}
const square = (el: Element | null) => ['x', 'y', 'width'].map((a) => Number(el!.getAttribute(a)))

describe('logo components', () => {
  test('the lockup is one image named youj: the letters in the text colour, no badge, the tittle in the accent', () => {
    const { container } = render(<YoujLockup />)
    const img = screen.getByRole('img', { name: 'youj' })
    expect(img).toHaveAttribute('viewBox', LOCKUP_VIEWBOX)
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    expect(container.querySelector('mask')).toBeNull()
    expect([...img.querySelectorAll('.fill-fg path')].map((p) => p.getAttribute('d'))).toEqual(logoLetters.map((l) => l.d))
    expect(img.querySelectorAll('path')).toHaveLength(logoLetters.length)
    expect(img.querySelectorAll('rect.fill-accent')).toHaveLength(1)
  })

  test('the tittle is grown at text sizes, the default, and drawn as is for display', () => {
    const { container, rerender } = render(<YoujLockup />)
    expect(square(container.querySelector('rect.fill-accent'))).toEqual([tittle.text.x, tittle.text.y, tittle.text.size])
    rerender(<YoujLockup optical="display" />)
    expect(square(container.querySelector('rect.fill-accent'))).toEqual([tittle.display.x, tittle.display.y, tittle.display.size])
  })

  test('the lockup is set 1em tall and keeps its proportions', () => {
    render(<YoujLockup className="text-[24px]" />)
    const img = screen.getByRole('img', { name: 'youj' })
    expect(img).toHaveClass('h-[1em]')
    expect(img.style.aspectRatio).toBe(`${LOCKUP.width} / ${LOCKUP.height}`)
    expect(img.parentElement).toHaveClass('text-[24px]')
  })

  test('the UI lockup names itself youj UI and draws the tag in the muted ink after the word', () => {
    const { container } = render(<YoujLockup ui />)
    const img = screen.getByRole('img', { name: 'youj UI' })
    expect(img).toHaveAttribute('viewBox', LOCKUP_UI_VIEWBOX)
    expect(img.style.aspectRatio).toBe(`${LOCKUP_UI_WIDTH} / ${LOCKUP.height}`)
    expect([...container.querySelectorAll('.fill-fg-muted path')].map((p) => p.getAttribute('d'))).toEqual(uiTag.map((l) => l.d))
  })

  test('the mark is the u cut out of the badge, its tittle in the accent, and decorative', () => {
    const { container } = render(<YoujMark />)
    const svg = container.querySelector('svg[aria-hidden]')!
    const { masked, mask } = cutOf(svg)
    expect(masked).toHaveClass('fill-fg')
    expect([...mask.querySelectorAll('path')].map((p) => [p.getAttribute('d'), p.getAttribute('fill')])).toEqual([
      [mark.tile, 'white'],
      [mark.glyph, 'black'],
    ])
    expect(svg.querySelector('rect.fill-accent')).toHaveAttribute('width', String(mark.tittle.size))
  })

  test('the wordmark draws the same letters at page scale, its tittle as drawn', () => {
    render(<YoujWordmark className="h-16" />)
    const img = screen.getByRole('img', { name: 'youj' })
    expect(img).toHaveAttribute('viewBox', WORDMARK_VIEWBOX)
    expect(img.style.aspectRatio).toBe(`${WORDMARK_WIDTH} / 24`)
    expect([...img.querySelectorAll('.fill-fg path')].map((p) => p.getAttribute('d'))).toEqual(wordmarkLetters.map((l) => l.d))
    expect(square(img.querySelector('rect.fill-accent'))).toEqual([tittle.display.x, tittle.display.y, tittle.display.size])
  })

  test('at rest the letters sit home, uncut by any window, and the tittle shows', () => {
    const { container } = render(
      <>
        <YoujLockup ui />
        <YoujMark />
        <YoujWordmark />
      </>,
    )
    expect(container.querySelector('clipPath')).toBeNull()
    for (const el of container.querySelectorAll<SVGElement>('path, rect')) {
      expect(el.style.transform).toBe('')
      expect(el.style.opacity).not.toBe('0')
    }
  })

  test('animated, the letters wait below a window that ends at the lockup’s foot; the tittle waits above, hidden', () => {
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <YoujLockup animated ui />
        <YoujMark animated />
      </YoujProvider>,
    )
    const [lockup, markSvg] = [...container.querySelectorAll('svg')]
    /** The bottom of the clip window a group rises through, which must exist in the document. */
    const windowFoot = (svg: Element, group: Element) => {
      const id = group.getAttribute('clip-path')!.match(/^url\(#(.+)\)$/)![1]!
      const rect = svg.querySelector(`clipPath[id="${id}"] rect`)!
      return Number(rect.getAttribute('y') ?? 0) + Number(rect.getAttribute('height'))
    }
    const foot = LOCKUP.y + LOCKUP.height
    const word = lockup!.querySelector('g[clip-path]')!
    expect(windowFoot(lockup!, word)).toBeCloseTo(foot, 5)
    const letters = [...word.querySelectorAll('.fill-fg path')]
    expect(letters).toHaveLength(logoLetters.length)
    letters.forEach((l, i) => expect(box(logoLetters[i]!.d).y0 + ty(l)).toBeGreaterThanOrEqual(foot))
    // the tag rises through the same window, from deeper down: its capitals start at the ascender
    const tag = [...word.querySelectorAll('.fill-fg-muted path')]
    expect(tag).toHaveLength(uiTag.length)
    tag.forEach((t, i) => expect(box(uiTag[i]!.d).y0 + ty(t)).toBeGreaterThanOrEqual(foot))
    const u = cutOf(markSvg!).mask.querySelector('g')!
    expect(windowFoot(markSvg!, u)).toBeCloseTo(mark.baseline, 5)
    expect(box(mark.glyph).y0 + ty(u.querySelector('path')!)).toBeGreaterThanOrEqual(mark.baseline)
    for (const t of container.querySelectorAll<SVGRectElement>('rect.fill-accent')) {
      expect(t.style.opacity).toBe('0')
      expect(ty(t)).toBe(-6)
    }
  })

  test('the stamp lands on the rest frame', async () => {
    const { container } = render(
      <YoujProvider reducedMotion="never" timeScale={0.05}>
        <YoujLockup animated />
      </YoujProvider>,
    )
    await waitFor(() => {
      for (const l of container.querySelectorAll('.fill-fg path')) expect(ty(l)).toBe(0)
      const t = container.querySelector<SVGRectElement>('rect.fill-accent')!
      expect(ty(t)).toBe(0)
      expect(t.style.opacity).toBe('1')
    })
  })

  test('reduced motion renders the rest frame, nothing waiting to appear', () => {
    const { container } = render(
      <YoujProvider reducedMotion="always">
        <YoujLockup animated ui />
        <YoujMark animated />
        <YoujWordmark animated delay={200} />
      </YoujProvider>,
    )
    expect(container.querySelector('clipPath')).toBeNull()
    for (const el of container.querySelectorAll<SVGElement>('path, rect')) {
      expect(el.style.transform).toBe('')
      expect(el.style.opacity).not.toBe('0')
    }
  })
})
