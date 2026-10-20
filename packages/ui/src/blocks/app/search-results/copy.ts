import { createContext, useContext, type ElementType, type ReactNode } from 'react'
import { ITEMS, PEOPLE, POPULAR, TODAY, type Person, type ResultType, type SearchItem, type Updated } from './data'
import type { Sort } from './model'

/* Every string the search page shows, and the context that hands the
 * page's copy, people and settings to its parts. Strings that name the
 * product take the brand's name. */

export const DEFAULT_COPY = {
  title: 'Search',
  /** The crumb after the brand in the standalone top bar. */
  section: 'Search',
  fieldLabel: (brand: string) => `Search ${brand}`,
  placeholder: 'Search docs, people and projects',
  clear: 'Clear search',
  suggestions: 'Search suggestions',
  groupSearch: 'Search',
  searchFor: 'Search for',
  jumpTo: 'Jump to',
  recentSearches: 'Recent searches',
  clearRecent: 'Clear recent searches',
  popularIn: (brand: string) => `Popular in ${brand}`,
  popular: 'Popular',
  filters: 'Filters',
  filtersApplied: (count: number) => `Filters, ${count} applied`,
  filtersHint: 'Filters by type, owner, date and tag appear once you search.',
  results: 'Results',
  searching: 'Searching…',
  resultsWord: (count: number) => (count === 1 ? 'result' : 'results'),
  resultsFor: ' for ',
  typeToSearch: 'Type to search, then press Enter',
  sortResults: 'Sort results',
  sorts: { relevance: 'Best match', recent: 'Last updated', title: 'Title A–Z' } as Record<Sort, string>,
  sheetDescription: (count: number, q: string) => `${count} results for “${q}”`,
  sheetEmpty: 'Search first, then narrow it down.',
  clearAll: 'Clear all',
  showResults: (count: number) => `Show ${count} results`,
  opening: (title: string) => `Opening ${title}`,
  linkToSearch: 'Link to this search',
  copyLink: 'Copy link',
  copied: 'Copied',
  copyFailed: 'Couldn’t copy',
  activeFilters: 'Active filters',
  facetType: 'Type',
  facetOwner: 'Owner',
  facetUpdated: 'Updated',
  facetTag: 'Tag',
  facetTags: 'Tags',
  removeFilter: (facet: string, label: string) => `Remove filter ${facet}: ${label}`,
  types: { document: 'Documents', person: 'People', project: 'Projects' } as Record<ResultType, string>,
  updatedOptions: { any: 'Any time', '7d': 'Past week', '30d': 'Past month', '90d': 'Past 3 months', '1y': 'Past year' } as Record<Updated, string>,
  noOwners: 'No owners for this search.',
  noTags: 'No tags for this search.',
  startTitle: (brand: string) => `Search everything in ${brand}`,
  startDescription: 'Documents, people and projects, in one place. Press / from anywhere on the page to start typing.',
  noResults: (q: string) => `No results for “${q}”`,
  filtersHide: (count: number) => `The filters hide all ${count} ${count === 1 ? 'result' : 'results'}. Loosen one, or clear them.`,
  checkSpelling: 'Check the spelling, or try a broader word.',
  tryBroader: 'Try fewer or broader words, or one of the popular searches below.',
  didYouMean: (fix: string) => `Did you mean “${fix}”?`,
  clearFilters: 'Clear filters',
  errorTitle: 'Search isn’t answering',
  retry: 'Try again',
  showing: (shown: number, total: number) => `Showing ${shown} of ${total}`,
  showingLabel: (shown: number, total: number) => `Showing ${shown} of ${total} results`,
  loadingMore: 'Loading…',
  loaded: 'Loaded',
  showMore: (count: number) => `Show ${count} more`,
  everything: 'That’s everything for this search.',
  keyMove: 'to move',
  keyOpen: 'to open',
  keySearch: 'to search',
  updated: (when: string) => `Updated ${when}`,
  today: 'today',
  yesterday: 'yesterday',
  daysAgo: (days: number) => `${days} days ago`,
  minRead: (minutes: number) => `${minutes} min read`,
  person: 'Person',
  localTime: (time: string) => `${time} local`,
  ledBy: (name: string) => `Project · led by ${name}`,
  projectStatus: { 'on-track': 'On track', 'at-risk': 'At risk', done: 'Shipped' } as Record<'on-track' | 'at-risk' | 'done', string>,
  progress: (title: string) => `${title} progress`,
  members: (count: number) => `${count} members`,
  shipped: (due: string) => `Shipped ${due}`,
  due: (due: string) => `Due ${due}`,
}

export type SearchCopy = typeof DEFAULT_COPY

/** The product in the standalone top bar, and in the strings that name it. */
export interface SearchBrand {
  name: string
  /** Default: the name's first letter on a primary tile. */
  logo?: ReactNode
}

export const BRAND: SearchBrand = { name: 'Kestrel' }

export interface SearchConfig {
  copy: SearchCopy
  brand: string
  people: Record<string, Person>
  popular: string[]
  items: SearchItem[]
  today: Date
  /** Default: the app's (useLocale). */
  locale?: string
  /** Renders every result link. */
  link: ElementType
  getHref: (item: SearchItem) => string
}

const SearchContext = createContext<SearchConfig>({
  copy: DEFAULT_COPY,
  brand: BRAND.name,
  people: PEOPLE,
  popular: POPULAR,
  items: ITEMS,
  today: TODAY,
  link: 'a',
  getHref: (item) => item.href,
})

export const SearchProvider = SearchContext.Provider
export const useSearchConfig = () => useContext(SearchContext)

/** A person by id; an unknown id reads as itself, so a missing entry never breaks a result. */
export const personOf = (people: Record<string, Person>, id: string): Person =>
  people[id] ?? { id, name: id, initials: id.slice(0, 2).toUpperCase(), role: '', team: '', location: '', utc: 0, email: '' }
