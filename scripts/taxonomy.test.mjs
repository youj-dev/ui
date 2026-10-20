// node --test scripts/taxonomy.test.mjs (part of pnpm check:taxonomy)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ladderViolations, readRegistry, readTaxonomy, taxonomyProblems } from './taxonomy.mjs'

const taxonomy = readTaxonomy()
const registry = readRegistry()
const clone = (value) => structuredClone(value)

test('every UI component and block has a level and a category, and every entry names an item', () => {
  assert.deepEqual(taxonomyProblems(taxonomy, registry), [])
})

test('the generated registry carries each item’s level and category as meta', () => {
  for (const item of registry.values()) {
    const entry = taxonomy.items[item.name]
    if (item.package !== 'ui' || !entry) continue
    assert.equal(item.meta?.level, entry.level, item.name)
    assert.equal(item.meta?.category, entry.category, item.name)
    assert.equal(item.meta?.complexity, entry.complexity, item.name)
  }
})

test('a registry item with no entry fails', () => {
  const t = clone(taxonomy)
  delete t.items.button
  assert.deepEqual(taxonomyProblems(t, registry), ['button: no level or category'])
})

test('an entry for no item fails', () => {
  const t = clone(taxonomy)
  t.items['not-an-item'] = { level: 'card', category: 'lifestyle' }
  assert.deepEqual(taxonomyProblems(t, registry), ['not-an-item: no registry item or block composition of that name'])
})

test('a block composition counts as an item', () => {
  assert.equal(taxonomy.items['marketing-landing']?.level, 'screen')
  assert.equal(registry.has('marketing-landing'), false)
})

test('a category of another level fails', () => {
  const t = clone(taxonomy)
  t.items.button.category = 'lifestyle'
  assert.deepEqual(taxonomyProblems(t, registry), ['button: component has no category "lifestyle"'])
})

test('a level its registry type can’t hold fails', () => {
  const t = clone(taxonomy)
  t.items['app-percentile-trend'] = { level: 'component', complexity: 'composite', category: 'charts-and-meters' }
  assert.deepEqual(taxonomyProblems(t, registry), ["app-percentile-trend: a registry:block can't be a component"])
})

test('a partOf on another level fails', () => {
  const t = clone(taxonomy)
  t.items['commerce-product-render'].partOf = 'commerce-checkout'
  assert.deepEqual(taxonomyProblems(t, registry), ['commerce-product-render: partOf "commerce-checkout" isn\'t a card in taxonomy.json'])
})

test('an opens that isn’t a card’s dialog, sheet, popover or banner fails', () => {
  const t = clone(taxonomy)
  t.items['app-feedback'].opens = 'modal'
  t.items['app-billing'].opens = 'dialog'
  assert.deepEqual(taxonomyProblems(t, registry), ['app-feedback: opens "modal" must be dialog, sheet, popover, banner, on a card', 'app-billing: opens "dialog" must be dialog, sheet, popover, banner, on a card'])
})

test('inApp is true, on a screen only', () => {
  const t = clone(taxonomy)
  t.items['app-feedback'].inApp = true
  t.items['auth-login'].inApp = 'yes'
  assert.deepEqual(taxonomyProblems(t, registry), ['app-feedback: inApp is true or left out, on a screen', 'auth-login: inApp is true or left out, on a screen'])
})

test('a counterpart must be on another level and name the item back', () => {
  const t = clone(taxonomy)
  assert.deepEqual(taxonomyProblems(t, registry), [])
  assert.equal(t.items['app-status'].counterpart, 'app-public-status')
  t.items['app-public-status'].counterpart = 'app-event-timeline'
  assert.deepEqual(taxonomyProblems(t, registry), [
    'app-status: counterpart "app-public-status" must be an item of another level that names it back',
    'app-public-status: counterpart "app-event-timeline" must be an item of another level that names it back',
  ])
})

test('the ladder flags an item that composes a higher level, and allows its own level and below', () => {
  const r = new Map(registry)
  r.set('app-percentile-trend', { ...r.get('app-percentile-trend'), registryDependencies: ['button', 'app-status', 'app-billing'] })
  assert.deepEqual(
    ladderViolations(taxonomy, r).filter((v) => v.item === 'app-percentile-trend'),
    [{ item: 'app-percentile-trend', level: 'card', uses: 'app-billing', usesLevel: 'screen' }],
  )
})

test('a component needs a complexity, and nothing else may have one', () => {
  const t = clone(taxonomy)
  delete t.items.button.complexity
  t.items['app-percentile-trend'].complexity = 'simple'
  assert.deepEqual(taxonomyProblems(t, registry), ["button: a component's complexity must be simple or composite", 'app-percentile-trend: a card has no complexity'])
})
