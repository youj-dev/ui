import { fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import { ICON_CATEGORIES, type YoujIconComponent } from './icon-base'
import { BrandDiscordIcon } from './brand-discord'
import { BrandFigmaIcon } from './brand-figma'
import { BrandGithubIcon } from './brand-github'
import { BrandLinkedinIcon } from './brand-linkedin'
import { BrandXIcon } from './brand-x'

beforeAll(installObservers)

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const svgOf = (c: HTMLElement) => c.querySelector('svg')!

const BRANDS: [string, YoujIconComponent][] = [
  ['brand-github', BrandGithubIcon],
  ['brand-x', BrandXIcon],
  ['brand-linkedin', BrandLinkedinIcon],
  ['brand-discord', BrandDiscordIcon],
  ['brand-figma', BrandFigmaIcon],
]

/* ── Geometry: the marks are absolute M/L/C/Z path data ─────────────────── */

type Pt = [number, number]

/** Each subpath as a closed polygon, cubics sampled finely. */
function polygons(d: string): Pt[][] {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g)!
  const out: Pt[][] = []
  let poly: Pt[] = []
  let cur: Pt = [0, 0]
  let i = 0
  const n = () => Number(tokens[i++])
  while (i < tokens.length) {
    const cmd = tokens[i++]
    if (cmd === 'M') {
      if (poly.length) out.push(poly)
      cur = [n(), n()]
      poly = [cur]
    } else if (cmd === 'L') {
      cur = [n(), n()]
      poly.push(cur)
    } else if (cmd === 'C') {
      const a = cur
      const c1: Pt = [n(), n()]
      const c2: Pt = [n(), n()]
      const b: Pt = [n(), n()]
      for (let s = 1; s <= 16; s++) {
        const t = s / 16
        const u = 1 - t
        poly.push([0, 1].map((k) => u * u * u * a[k]! + 3 * u * u * t * c1[k]! + 3 * u * t * t * c2[k]! + t * t * t * b[k]!) as Pt)
      }
      cur = b
    } else if (cmd === 'Z') {
      out.push(poly)
      poly = []
    } else throw new Error(`unexpected command ${cmd} in brand path data`)
  }
  if (poly.length) out.push(poly)
  return out
}

/** Nonzero winding number and even-odd crossings of a point, over every subpath. */
function coverage(p: Pt, polys: Pt[][]): { nonzero: boolean; evenodd: boolean } {
  let winding = 0
  let crossings = 0
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i]!
      const [x2, y2] = poly[(i + 1) % poly.length]!
      if (y1 <= p[1] !== y2 <= p[1]) {
        const x = x1 + ((p[1] - y1) * (x2 - x1)) / (y2 - y1)
        if (x > p[0]) {
          crossings++
          winding += y2 > y1 ? 1 : -1
        }
      }
    }
  }
  return { nonzero: winding !== 0, evenodd: crossings % 2 === 1 }
}

describe('brand marks', () => {
  test('there is a brand category, and every mark is in it', () => {
    expect(ICON_CATEGORIES).toContain('brand')
    for (const [name, Icon] of BRANDS) {
      expect(Icon.meta.name).toBe(name)
      expect(Icon.meta.category).toBe('brand')
      expect(Icon.meta.states).toBeUndefined()
      expect(Icon.meta.keywords).toEqual(expect.arrayContaining(['brand', 'logo', `sign in with ${name.slice('brand-'.length)}`]))
    }
  })

  test.each(BRANDS)('%s is filled with currentColor only, with no stroke', (_, Icon) => {
    const { container } = render(<Icon />, { wrapper: full })
    const paths = svgOf(container).querySelectorAll('path')
    expect(paths.length).toBeGreaterThan(0)
    for (const path of paths) {
      expect(path).toHaveAttribute('fill', 'currentColor')
      expect(path).toHaveAttribute('stroke', 'none')
      expect(path.getAttribute('fill-rule')).toBeNull()
    }
  })

  test.each(BRANDS)('%s holds still: hover, focus, mount and loop change nothing', (_, Icon) => {
    const { container, rerender } = render(<Icon />, { wrapper: full })
    const svg = svgOf(container)
    const before = svg.innerHTML
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
    expect(svg.innerHTML).toBe(before)
    // Even when a consumer asks for motion, there is no choreography to play.
    for (const trigger of ['hover', 'mount', 'loop'] as const) {
      rerender(<Icon trigger={trigger} />)
      fireEvent.pointerEnter(svgOf(container))
      expect(svgOf(container).innerHTML).toBe(before)
    }
    expect(svgOf(container).querySelector('[style*="transform"]')).toBeNull()
  })

  test.each(BRANDS)('%s stays inside the 2-unit padding of the 24 grid', (_, Icon) => {
    const { container } = render(<Icon />, { wrapper: full })
    const d = svgOf(container).querySelector('path')!.getAttribute('d')!
    const points = polygons(d).flat()
    const xs = points.map((p) => p[0])
    const ys = points.map((p) => p[1])
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(2)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(2)
    expect(Math.max(...xs)).toBeLessThanOrEqual(22)
    expect(Math.max(...ys)).toBeLessThanOrEqual(22)
    // Optically centered: the drawing's box is centered on the grid within half a unit.
    expect(Math.abs((Math.min(...xs) + Math.max(...xs)) / 2 - 12)).toBeLessThan(0.5)
    expect(Math.abs((Math.min(...ys) + Math.max(...ys)) / 2 - 12)).toBeLessThan(0.5)
  })

  test.each(BRANDS)('%s fills the same area under nonzero as under even-odd, so tools that drop fill-rule keep its holes', (_, Icon) => {
    const { container } = render(<Icon />, { wrapper: full })
    const polys = polygons(svgOf(container).querySelector('path')!.getAttribute('d')!)
    let filled = 0
    for (let x = 2.05; x < 22; x += 0.2) {
      for (let y = 2.05; y < 22; y += 0.2) {
        const c = coverage([x, y], polys)
        expect(c.nonzero, `(${x.toFixed(2)}, ${y.toFixed(2)})`).toBe(c.evenodd)
        if (c.nonzero) filled++
      }
    }
    expect(filled).toBeGreaterThan(100)
  })

  test('a labelled mark becomes an image with that name; unlabelled it stays decorative', () => {
    const { container, rerender } = render(<BrandGithubIcon />, { wrapper: full })
    expect(svgOf(container)).toHaveAttribute('aria-hidden', 'true')
    rerender(<BrandGithubIcon aria-label="GitHub" />)
    expect(svgOf(container)).toHaveAttribute('role', 'img')
    expect(svgOf(container)).toHaveAccessibleName('GitHub')
  })
})
