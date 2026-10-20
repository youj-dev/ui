'use client'

import { useEffect, useRef, useState, type ElementType } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { FileTextIcon, SearchIcon, XIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../../components/ui/input-group'
import type { HelpArticle, HelpCategory, HelpCenterCopy } from './data'

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function Marked({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const parts = text.split(new RegExp(`(${escape(query)})`, 'ig'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="rounded-xs bg-accent-line text-fg">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

interface SearchProps {
  copy: HelpCenterCopy
  articles: HelpArticle[]
  categories: HelpCategory[]
  popular: string[]
  /** Finds the articles for a query (your search API, say); without it, titles are matched here. */
  onSearch?: (query: string) => HelpArticle[] | Promise<HelpArticle[]>
  Link: ElementType
}

const matchTitles = (articles: HelpArticle[], q: string) => articles.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()))

function Search({ copy, articles, categories, popular, onSearch, Link }: SearchProps) {
  const [query, setQuery] = useState('')
  const [found, setFound] = useState<HelpArticle[]>([])
  const input = useRef<HTMLInputElement>(null)
  const q = query.trim()
  // Your search answers asynchronously; only the latest query's answer lands.
  useEffect(() => {
    if (!onSearch || !q) return
    let current = true
    Promise.resolve(onSearch(q)).then((list) => current && setFound(list))
    return () => {
      current = false
    }
  }, [onSearch, q])
  const results = !q ? [] : onSearch ? found : matchTitles(articles, q)
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.title ?? id
  return (
    <div className="relative flex w-full max-w-2xl flex-col gap-3">
      <InputGroup className="h-control-lg rounded-field-lg shadow-sm">
        <InputGroupAddon>
          <SearchIcon size={18} />
        </InputGroupAddon>
        <InputGroupInput
          ref={input}
          type="search"
          aria-label={copy.search}
          placeholder={copy.searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="text-ui-lg [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={copy.clearSearch}
              onClick={() => {
                setQuery('')
                input.current?.focus()
              }}
            >
              <XIcon size={14} />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      {popular.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-ui-sm text-fg-muted">
          <span>{copy.popular}</span>
          {popular.map((p) => (
            <button key={p} type="button" onClick={() => setQuery(p)} className="focus-ring rounded-md border border-line bg-canvas px-2 py-0.5 text-fg transition-colors yj-duration-fast ease-standard hover:bg-hover">
              {p}
            </button>
          ))}
        </div>
      )}
      <p role="status" className="sr-only">
        {q ? copy.resultCount(results.length, q) : ''}
      </p>
      {/* The results float over the page under the search, like a menu: typing never moves what's below. */}
      {q && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-96 overflow-y-auto rounded-xl border border-line bg-overlay text-start shadow-md yj-scrollbar">
          <PresenceList aria-label={copy.results} className="flex flex-col p-1.5">
            {results.map((a) => (
              <PresenceItem key={a.id}>
                <Link href={a.href ?? `#${a.id}`} className="focus-ring group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-hover">
                  <FileTextIcon size={16} className="shrink-0 text-fg-muted" />
                  <span className="min-w-0 flex-1 truncate text-ui text-fg">
                    <Marked text={a.title} query={q} />
                  </span>
                  <Badge variant="secondary" className="max-sm:hidden">
                    {categoryName(a.category)}
                  </Badge>
                  <span className="text-ui-sm text-fg-muted tabular-nums">{copy.minutes(a.minutes)}</span>
                </Link>
              </PresenceItem>
            ))}
          </PresenceList>
          {results.length === 0 && (
            <p className="px-4 py-5 text-ui text-fg-muted">
              {copy.noResultsBefore(q)}
              <a href="#contact" className="focus-ring rounded-sm text-accent-text underline underline-offset-4">
                {copy.noResultsLink}
              </a>
              {copy.noResultsAfter}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export { Search }
