import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { footprint, loadItems, mostUsed } from './footprint.mjs'

/* `youj add <item>` copies the item and everything its registry dependencies
 * name. footprint-budget.json holds, per much-used component, the registry
 * items and the lines (youj-core, shared by every copy, counted apart) a copy
 * may reach, about 5% over what each measured when set. A component that starts
 * importing something heavy fails here instead of growing every app that copies
 * it. To raise one on purpose, edit the budget and say why in the commit. */
const budget = JSON.parse(readFileSync(join(import.meta.dirname, 'footprint-budget.json'), 'utf8'))
const items = loadItems()

describe('copy-in footprint', () => {
  test.each(Object.entries(budget.components))('%s stays inside its budget', (name, max) => {
    const { items: names, lines } = footprint(name, items)
    const own = lines - footprint('youj-core', items).lines
    expect({ items: names.length, ownLines: own }).toEqual({ items: expect.toSatisfy((n) => n <= max.items), ownLines: expect.toSatisfy((n) => n <= max.lines) })
  })

  test('youj-core, shared by every copy, stays inside its budget', () => {
    expect(footprint('youj-core', items).lines).toBeLessThanOrEqual(budget.core)
  })

  test('the budget covers the twenty most-used components', () => {
    const covered = Object.keys(budget.components)
    expect(mostUsed(20, items).filter((name) => !covered.includes(name))).toEqual([])
  })

  test('a plain Button copies none of the async button, morph or sound extras', () => {
    const { items: names } = footprint('button', items)
    for (const extra of ['async-button', 'async-feedback', 'morph-label']) expect(names).not.toContain(extra)
  })
})
