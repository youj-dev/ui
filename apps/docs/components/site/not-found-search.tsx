'use client'

import { useEffect, useState } from 'react'
import { useSearchContext } from 'fumadocs-ui/contexts/search'
import { primeKeyboard } from '@youj/react/components/ui/presentation'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { seedSearch } from '@/components/site/search-seed'

/** The address's last segment as words: /docs/components/date-picker → "date picker". */
export function queryFromPath(pathname: string): string {
  const last = pathname.split('/').filter(Boolean).at(-1) ?? ''
  let words = last
  try {
    words = decodeURIComponent(last)
  } catch {}
  return words
    .replace(/\.(md|html?)$/i, '')
    .replace(/[-_+.]+/g, ' ')
    .trim()
    .slice(0, 60)
}

/**
 * The 404's search: a field that opens ⌘K already searching for what the
 * address asked for, so the near misses are the first thing shown. The page
 * is rendered once for every missing address, so the address is read after
 * hydration.
 */
export function NotFoundSearch() {
  const { setOpenSearch } = useSearchContext()
  const [query, setQuery] = useState('')
  useEffect(() => setQuery(queryFromPath(window.location.pathname)), [])
  return (
    <button
      type="button"
      onClick={() => {
        seedSearch(query)
        primeKeyboard()
        setOpenSearch(true)
      }}
      className="flex h-11 w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 text-start text-ui-lg text-fg-muted shadow-xs transition-colors yj-duration-fast ease-standard hover:border-line-control hover:text-fg focus-ring"
    >
      <SearchIcon size={16} strokeWidth={1.75} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        {query ? (
          <>
            Search for <span className="text-fg">“{query}”</span>
          </>
        ) : (
          'Search the docs…'
        )}
      </span>
    </button>
  )
}
