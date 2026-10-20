import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import { Explore } from './explore'
import { EXPLORE_TILES } from './tiles'

const DOCS = join(__dirname, '../../../content/docs')
const CELLS = { lg: 4, wide: 2, tall: 2, sm: 1 } as const

/** Every MDX page's URL under /docs, route groups (`(forms)`) left out as the site leaves them. */
function docsUrls(dir = DOCS, base = '/docs'): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return docsUrls(join(dir, entry.name), /^\(.*\)$/.test(entry.name) ? base : `${base}/${entry.name}`)
    return entry.name.endsWith('.mdx') ? [entry.name === 'index.mdx' ? base : `${base}/${entry.name.slice(0, -4)}`] : []
  })
}

describe('Explore', () => {
  beforeEach(() => {
    // Nothing nears the screen: the tiles stay as the server draws them.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('is a section named by its heading, with twenty-eight titled tiles, each linking to its docs from a corner', () => {
    render(<Explore />)
    const section = screen.getByRole('region', { name: 'Try the parts, live.' })
    const tiles = within(section).getAllByRole('article')
    expect(tiles).toHaveLength(28)
    EXPLORE_TILES.forEach((tile, i) => {
      expect(tiles[i]).toHaveAccessibleName(tile.name)
      const link = within(tiles[i]!).getByRole('link')
      expect(link).toHaveAttribute('href', tile.href)
      expect(link).toHaveAccessibleName(`View docs: ${tile.name}`)
      // The tile itself isn't a link: the demos in it hold controls.
      expect(tiles[i]!.closest('a')).toBeNull()
    })
  })

  it('fills four columns with no holes, every tile a rectangle as wide as its size says, the heights staggered', () => {
    const count = (size: keyof typeof CELLS) => EXPLORE_TILES.filter((t) => t.size === size).length
    expect([count('lg'), count('wide'), count('tall'), count('sm')]).toEqual([3, 11, 6, 8])
    const css = readFileSync(join(__dirname, '../../../styles/site.css'), 'utf8')
    const rows = [...css.match(/grid-template-areas:([^;]+);/)![1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!.split(' '))
    expect(rows.every((row) => row.length === 4 && !row.includes('.'))).toBe(true)
    for (const tile of EXPLORE_TILES) {
      const cells = rows.flatMap((row, y) => row.flatMap((id, x) => (id === tile.id ? [[x, y] as const] : [])))
      const xs = new Set(cells.map(([x]) => x))
      const ys = new Set(cells.map(([, y]) => y))
      // A rectangle: every cell of its bounding box is its own.
      expect(cells.length, tile.id).toBe(xs.size * ys.size)
      expect(xs.size, tile.id).toBe(tile.size === 'lg' || tile.size === 'wide' ? 2 : 1)
    }
    // Staggered: the two halves (columns 1–2 and 3–4) don't share every row edge.
    const edges = (cols: number[]) => new Set(rows.flatMap((row, y) => (y > 0 && cols.some((c) => row[c] !== rows[y - 1]![c]) ? [y] : [])))
    const left = edges([0, 1])
    const right = edges([2, 3])
    expect([...left].filter((y) => right.has(y)).length).toBeLessThan(left.size)
  })

  it('links only to pages the site has', () => {
    const urls = new Set(docsUrls())
    for (const { href } of EXPLORE_TILES) {
      const path = href.split(/[?#]/)[0]!
      if (path.startsWith('/docs')) expect(urls.has(path), href).toBe(true)
      else expect(['/loaders', '/icons', '/illustrations', '/miniatures']).toContain(path)
    }
  })
})
