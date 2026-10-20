// @vitest-environment node
import { levelCounts } from './catalog'
import { registryItem } from './registry'
import { blocks } from './showcase'
import { LEVELS, taxonomy, taxonomyOf } from './taxonomy'

/* The ladder as the docs read it (taxonomy.json). scripts/taxonomy.mjs checks
 * the file against the registry; these check what the docs build on. */

describe('the taxonomy in the docs', () => {
  it('gives every block and composition a level and a category of that level', () => {
    for (const entry of blocks()) {
      expect(LEVELS, entry.slug).toContain(entry.level)
      expect(taxonomy().levels[entry.level].categories[entry.category], `${entry.slug}: ${entry.category}`).toBeDefined()
    }
  })

  it('keeps each level on its own list: no block is a component', () => {
    const blockLevels = new Set(blocks().map((b) => b.level))
    expect(blockLevels).toEqual(new Set(['card', 'section', 'frame', 'screen']))
  })

  it('files a section-kind block as a section and the app frame as a frame and the auth shell as a screen', () => {
    expect(blocks().filter((b) => b.blockKind === 'section').map((b) => [b.slug, b.level]).filter(([, level]) => level !== 'section')).toEqual([])
    expect(taxonomyOf('frame-shell')?.level).toBe('frame')
    expect(taxonomyOf('auth-shell')?.level).toBe('screen')
    expect(taxonomyOf('marketing-cookie-consent')).toMatchObject({ level: 'card', category: 'forms-and-inputs' })
  })

  it('reads a registry item’s level and category from its meta', () => {
    expect(registryItem('app-percentile-trend').meta).toEqual({ kind: 'card', level: 'card', category: 'trends-and-comparisons' })
    expect(registryItem('button').meta).toEqual({ level: 'component', complexity: 'simple', category: 'actions' })
  })

  it('records the data fixes: product render is a part of product card, three empty-state blocks to merge', () => {
    expect(taxonomyOf('commerce-product-render')?.partOf).toBe('commerce-product-card')
    const merging = Object.entries(taxonomy().items).filter(([, e]) => e.merge === 'empty-states').map(([name]) => name)
    expect(merging.sort()).toEqual(['app-empty-states', 'app-first-source', 'content-illustrated-states'])
  })

  it('counts each level', () => {
    const counts = levelCounts()
    expect(Object.keys(counts)).toEqual([...LEVELS])
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(Object.keys(taxonomy().items).length)
  })
})

describe('the splits', () => {
  it('splits the Status family: the card is a card and the page a screen, each naming the other', () => {
    expect(taxonomyOf('app-status')).toMatchObject({ level: 'card', counterpart: 'app-public-status' })
    expect(taxonomyOf('app-public-status')).toMatchObject({ level: 'screen', counterpart: 'app-status' })
    for (const [name, entry] of Object.entries(taxonomy().items)) {
      if (entry.counterpart) expect(taxonomyOf(entry.counterpart)?.counterpart, name).toBe(name)
    }
  })

  it('files the overlays as cards, each with what it opens in', () => {
    const opens = Object.fromEntries(Object.entries(taxonomy().items).filter(([, e]) => e.opens).map(([name, e]) => [name, [e.level, e.category, e.opens]]))
    expect(opens).toEqual({
      'app-feedback': ['card', 'activity-and-conversations', 'dialog'],
      'app-support-chat': ['card', 'activity-and-conversations', 'popover'],
      'commerce-cart-drawer': ['card', 'forms-and-inputs', 'sheet'],
      'marketing-cookie-consent': ['card', 'forms-and-inputs', 'banner'],
      'surveys-widget': ['card', 'forms-and-inputs', 'popover'],
    })
  })

  it('files the chart marks as simple components and the rest of the charts, the pickers and the specialized components as composite ones', () => {
    for (const name of ['sparkline', 'gauge', 'share-bar', 'hatched-bar', 'segmented-meter', 'diff-bar']) expect(taxonomyOf(name), name).toMatchObject({ level: 'component', complexity: 'simple', category: 'data-marks' })
    for (const name of ['chart', 'stat-card', 'treemap']) expect(taxonomyOf(name), name).toMatchObject({ level: 'component', complexity: 'composite', category: 'charts-and-meters' })
    for (const name of ['date-picker', 'combobox', 'file-upload', 'color-picker']) expect(taxonomyOf(name), name).toMatchObject({ level: 'component', complexity: 'composite', category: 'pickers-and-inputs' })
    for (const name of ['day-rail', 'progress-path', 'refill-meter', 'segmented-ring', 'time-lanes', 'progress-list', 'level-matrix', 'rollout-ruler']) {
      expect(taxonomyOf(name), name).toMatchObject({ level: 'component', complexity: 'composite', category: 'specialized' })
    }
    // The nav chrome components stay composite components; the frame's parts are frames.
    for (const name of ['sidebar', 'app-header', 'account-menu', 'workspace-switcher']) expect(taxonomyOf(name), name).toMatchObject({ level: 'component', complexity: 'composite', category: 'navigation-and-app-chrome' })
    expect(blocks().filter((b) => b.slug.startsWith('frame-') && !b.slug.startsWith('frame-screen-')).filter((b) => b.level !== 'frame').map((b) => b.slug)).toEqual([])
    // Create's pages are frames, not Screens.
    expect(blocks().filter((b) => b.slug.startsWith('frame-screen-')).filter((b) => b.level !== 'frame').map((b) => b.slug)).toEqual([])
  })
})
