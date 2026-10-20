// @vitest-environment node
import { icons } from '@youj/icons/components/youj/icons'
import { youjEntries, lucideEntries, lucideName, pairNames } from './catalog'
import { DEFAULT_QUERY, parseQuery } from './query'

describe('the Youj set', () => {
  it('takes every icon from the generated index, with its meta and snapshot', () => {
    const entries = youjEntries({ bell: [['path', { d: 'M1 1' }, []]] }, { bell: 'Swings from its crown.' })
    expect(entries).toHaveLength(icons.length)
    const bell = entries.find((e) => e.name === 'bell')!
    expect(bell).toMatchObject({ id: 'bell', component: 'BellIcon', category: 'status', description: 'Swings from its crown.' })
    expect(bell.nodes).toHaveLength(1)
    expect(entries.find((e) => e.name === 'menu')!.states).toEqual(['menu', 'close'])
    expect(entries.find((e) => e.name === 'loader-ring')!.loops).toBe(true)
  })
})

describe('lucide', () => {
  it('spells export names as lucide file names', () => {
    expect(lucideName('Rocket')).toBe('rocket')
    expect(lucideName('ArrowDownAZ')).toBe('arrow-down-a-z')
    expect(lucideName('AArrowUp')).toBe('a-arrow-up')
    expect(lucideName('Grid2x2')).toBe('grid-2x2')
    expect(lucideName('Axis3d')).toBe('axis-3d')
    expect(lucideName('Clock10')).toBe('clock-10')
  })

  it('collects the other export names of each icon as keywords', () => {
    const Badge = { render: () => null }
    const Rocket = { render: () => null }
    const mod = { icons: { BadgeCheck: Badge, Rocket }, BadgeCheck: Badge, BadgeCheckIcon: Badge, Verified: Badge, LucideVerified: Badge, Rocket, RocketIcon: Rocket }
    const entries = lucideEntries(mod as never)
    expect(entries.map((e) => e.id)).toEqual(['lucide:badge-check', 'lucide:rocket'])
    expect(entries[0]!.keywords).toEqual(['verified'])
    expect(entries[1]!.keywords).toEqual([])
    expect(entries[0]!.component).toBe('BadgeCheck')
  })
})

describe('swap pairs', () => {
  it('pairs a name with its second state, its opposite and the curated pairs, each once', () => {
    const pairs = pairNames(['bell', 'bell-off', 'arrow-up', 'arrow-down', 'copy', 'check', 'undo', 'redo', 'mail', 'mail-open'])
    expect(pairs).toContainEqual(['bell', 'bell-off'])
    expect(pairs).toContainEqual(['arrow-up', 'arrow-down'])
    expect(pairs).toContainEqual(['copy', 'check'])
    expect(pairs).toContainEqual(['undo', 'redo'])
    expect(pairs).toContainEqual(['mail', 'mail-open'])
    expect(pairs).not.toContainEqual(['arrow-down', 'arrow-up'])
    const keys = pairs.map((p) => [...p].sort().join('|'))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('skips pairs whose icons are missing', () => {
    expect(pairNames(['copy'])).toEqual([])
  })

  it('finds pairs among the real set, so new icons pair themselves', () => {
    const pairs = pairNames(icons.map((i) => i.meta.name))
    expect(pairs.length).toBeGreaterThan(20)
    expect(pairs).toContainEqual(['bell', 'bell-off'])
  })
})

describe('the query string', () => {
  it('reads the defaults from an empty address', () => {
    expect(parseQuery('')).toEqual(DEFAULT_QUERY)
  })

  it('reads filters and search', () => {
    expect(parseQuery('?q=bell&type=morph&category=status')).toEqual({ q: 'bell', type: 'morph', categories: ['status'] })
  })

  it('takes several categories, comma-separated, and ignores repeats and unknown ones', () => {
    expect(parseQuery('?category=arrows,status,arrows,space').categories).toEqual(['arrows', 'status'])
  })

  it('opens an old static-type link on every icon, which is what it showed', () => {
    expect(parseQuery('?type=static').type).toBe('animated')
  })

  it('ignores anything it does not know, falling back to the defaults', () => {
    expect(parseQuery('?type=wobble&category=space&icon=<script>')).toEqual(DEFAULT_QUERY)
  })
})
