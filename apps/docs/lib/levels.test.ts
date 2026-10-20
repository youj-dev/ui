// @vitest-environment node
import { basics, CATEGORY_ORDER, ESSENTIALS, isBasic } from './basics'
import { levelCategories, levelCategory, levelEntries, levelTotal } from './levels'
import { taxonomy } from './taxonomy'

describe('the components list', () => {
  it('lists every component with a docs page once, under its category, opening that page, each marked simple or composite', () => {
    const items = Object.entries(taxonomy().items).filter(([, e]) => e.level === 'component')
    const listed = levelEntries('component').filter(isBasic)
    expect(listed.map((e) => e.slug).sort()).toEqual(items.map(([name]) => name).sort())
    expect(new Set(listed.map((e) => e.slug)).size).toBe(listed.length)
    for (const e of listed) {
      // The page is a component's or a pattern's (a few simple ones are documented with the composite built on them: Table with Data Table).
      expect(e.href, e.slug).toMatch(/^\/docs\/(components|patterns)\//)
      expect(e.category, e.slug).toBe(taxonomy().items[e.slug]!.category)
      expect(e.complexity, e.slug).toBe(taxonomy().items[e.slug]!.complexity)
      expect(e.demo, `${e.slug} has a demo for its card`).toBeTruthy()
      expect(e.title, e.slug).toBeTruthy()
    }
    expect(new Set(listed.map((e) => e.complexity))).toEqual(new Set(['simple', 'composite']))
    expect(levelEntries('component').find((e) => e.slug === 'button')).toMatchObject({ href: '/docs/components/button', demo: 'async-button/demo', import: "import { Button } from '@youj/react'" })
    expect(levelTotal('component')).toBe(basics('component').length)
  })

  it('opens Components with Essentials, runs the categories basics-first and leads each with its common items', () => {
    const cats = levelCategories('component')
    expect(cats[0]!.id).toBe('essentials')
    expect(cats[0]!.entries.map((e) => e.slug)).toEqual(ESSENTIALS)
    expect(cats.slice(1).map((c) => c.id)).toEqual(CATEGORY_ORDER)
    // Each essential is also in its own category, and the repeat adds nothing to the total.
    for (const e of cats[0]!.entries) expect(cats.find((c) => c.id === e.category)!.entries, e.slug).toContain(e)
    // Every category of the list is in its order list, so none is left to the end by accident, and the order names every category of the level.
    const filed = new Set(basics('component').map((e) => e.category))
    expect([...filed].filter((id) => !CATEGORY_ORDER.includes(id))).toEqual([])
    expect([...CATEGORY_ORDER].sort()).toEqual(Object.keys(taxonomy().levels.component.categories).sort())
    const slugs = (id: string) => levelCategory('component', id)!.entries.map((e) => e.slug)
    expect(slugs('actions')[0]).toBe('button')
    expect(slugs('form-controls').slice(0, 9)).toEqual(['input', 'select', 'checkbox', 'switch', 'radio-group', 'textarea', 'label', 'field', 'form'])
    expect(slugs('overlays').slice(0, 5)).toEqual(['dialog', 'tooltip', 'popover', 'dropdown-menu', 'sheet'])
    expect(slugs('display').slice(0, 4)).toEqual(['card', 'badge', 'avatar', 'table'])
  })

  it('files every component under a category of its own level, in the taxonomy’s order', () => {
    const cats = levelCategories('component')
    // Essentials (Components) is a group over the others, not a taxonomy category.
    const ids = Object.keys(taxonomy().levels.component.categories)
    expect([...cats.filter((c) => !c.repeats).map((c) => c.id)].sort()).toEqual([...ids].sort())
    expect(cats.filter((c) => !c.repeats).reduce((n, c) => n + c.entries.length, 0)).toBe(levelEntries('component').length)
    for (const c of cats) for (const e of c.entries) expect(e.level, `component/${c.id}/${e.slug}`).toBe('component')
  })

  it('keeps a components category’s id from naming a component, so a URL means one thing', () => {
    const slugs = new Set(levelEntries('component').map((e) => e.slug))
    expect(levelCategories('component').filter((c) => slugs.has(c.id)).map((c) => c.id)).toEqual([])
  })
})
