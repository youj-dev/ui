// @vitest-environment node
import { icons } from '@youj/icons/components/youj/icons'
import { editDistance, indexIcons, normalizeQuery, searchIndex, type Searchable } from './search'

const youj: Searchable[] = icons.map((Icon) => ({ name: Icon.meta.name, keywords: Icon.meta.keywords, category: Icon.meta.category }))
const index = indexIcons(youj, (i) => i, youj)
const names = (query: string) => searchIndex(index, query).map((i) => i.name)

describe('searching icons', () => {
  it('returns the whole set, in order, for an empty query', () => {
    expect(names('')).toEqual(youj.map((i) => i.name))
    expect(names('   ')).toHaveLength(youj.length)
  })

  it('puts the exact name first, then names that start with it', () => {
    const results = names('check')
    expect(results[0]).toBe('check')
    expect(results.slice(1, 3)).toContain('check-circle')
  })

  it('matches keywords, so meaning finds the icon: delete finds trash', () => {
    expect(names('delete')).toContain('trash')
    expect(names('DELETE')).toContain('trash')
  })

  it('needs every word to match, across names and keywords', () => {
    expect(names('dark mode')).toEqual(['theme'])
    expect(names('arrow up')[0]).toBe('arrow-up')
    expect(names('arrow-up')[0]).toBe('arrow-up')
  })

  it('forgives a typo and a missing letter', () => {
    expect(names('notifcation')).toContain('bell')
    expect(names('calender')).toContain('calendar')
    expect(names('trsh')).toContain('trash')
  })

  it('finds a name from its first letters in order', () => {
    expect(names('chk')).toContain('check')
  })

  it('matches a category', () => {
    const results = names('weather')
    expect(results.length).toBeGreaterThan(0)
    expect(results).toContain('cloud-rain')
  })

  it('uses the Youj keywords as synonyms for icons that have none', () => {
    const lucide = [{ name: 'bell-ring', keywords: [] }, { name: 'rocket', keywords: [] }]
    const withSynonyms = indexIcons(lucide, (i) => i, youj)
    expect(searchIndex(withSynonyms, 'notification').map((i) => i.name)).toEqual(['bell-ring'])
    // A prefix of four letters or more reaches the synonym too.
    expect(searchIndex(withSynonyms, 'notif').map((i) => i.name)).toEqual(['bell-ring'])
    expect(searchIndex(indexIcons(lucide, (i) => i), 'notification')).toEqual([])
  })

  it('searches descriptions last', () => {
    const set = [{ name: 'activity', keywords: [], description: 'A heartbeat trace' }]
    expect(searchIndex(indexIcons(set, (i) => i), 'heartbeat')).toHaveLength(1)
  })

  it('normalizes punctuation and case', () => {
    expect(normalizeQuery('  Bell!!  OFF ')).toBe('bell off')
  })
})

describe('editDistance', () => {
  it('counts edits, with a swap of neighbors as one', () => {
    expect(editDistance('bell', 'bell', 2)).toBe(0)
    expect(editDistance('bel', 'bell', 2)).toBe(1)
    expect(editDistance('lebl', 'bell', 2)).toBe(2)
    expect(editDistance('calender', 'calendar', 2)).toBe(1)
    expect(editDistance('ab', 'ba', 2)).toBe(1)
  })

  it('stops counting past its limit', () => {
    expect(editDistance('trash', 'settings', 1)).toBe(2)
  })
})
