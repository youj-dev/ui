'use client'

import { useId, useState, type ReactNode } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { ChevronRightIcon, SearchIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group'
import { useAnnouncer } from '../../../hooks/use-announcer'
import { safeLink } from '../../../lib/safe-href'
import { useSupportChat } from './context'
import type { SupportArticle } from './data'

/* Help articles, searchable. Popular ones show until you type; results
 * enter and leave through PresenceList while the rest close ranks, the
 * matched words are marked, and the count is announced. Nothing matching
 * offers to ask the team instead, carrying the question over. */

const POPULAR = 4

function matches(article: SupportArticle, words: string[]) {
  const haystack = `${article.title} ${article.topic}`.toLowerCase()
  return words.every((word) => haystack.includes(word))
}

/** The title with the first match of each word marked. */
function Marked({ text, words }: { text: string; words: string[] }) {
  const lower = text.toLowerCase()
  const ranges = words
    .map((word) => [lower.indexOf(word), word.length] as const)
    .filter(([at]) => at >= 0)
    .sort((a, b) => a[0] - b[0])
  const parts: ReactNode[] = []
  let cursor = 0
  for (const [at, length] of ranges) {
    if (at < cursor) continue
    parts.push(text.slice(cursor, at))
    parts.push(
      <mark key={at} className="rounded-xs bg-accent-subtle text-fg">
        {text.slice(at, at + length)}
      </mark>,
    )
    cursor = at + length
  }
  parts.push(text.slice(cursor))
  return <>{parts}</>
}

export function HelpSearch({ onAsk }: { onAsk: (question: string) => void }) {
  const [query, setQuery] = useState('')
  const headingId = useId()
  const { announce, announcer } = useAnnouncer()
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const { copy, articles, articleHref, linkComponent: Link } = useSupportChat()
  const results = words.length ? articles.filter((a) => matches(a, words)) : articles.slice(0, POPULAR)

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-xl border border-line bg-overlay p-3 shadow-xs">
      <h3 id={headingId} className="px-1 pt-1 text-ui font-medium text-fg">
        {copy.findAnswer}
      </h3>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon size={16} strokeWidth={1.75} />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label={copy.searchHelp}
          placeholder={copy.searchPlaceholder}
          value={query}
          onChange={(event) => {
            const next = event.target.value
            setQuery(next)
            const n = next.trim() ? articles.filter((a) => matches(a, next.toLowerCase().split(/\s+/).filter(Boolean))).length : POPULAR
            announce(next.trim() ? copy.articlesFound(n) : copy.popularArticles)
          }}
        />
      </InputGroup>
      {announcer}
      <p className="px-1 text-ui-xs font-medium tracking-wide text-fg-muted uppercase">{words.length ? copy.results : copy.popular}</p>
      {results.length > 0 ? (
        <PresenceList as="ul" className="-mx-1 flex flex-col">
          {results.map((article) => (
            <PresenceItem key={article.id} as="li">
              <Link
                href={safeLink(articleHref(article)) ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="group/article focus-ring flex items-center gap-3 rounded-lg px-2 py-2 transition-colors yj-duration-fast ease-standard hover:bg-hover"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-ui text-fg">
                    <Marked text={article.title} words={words} />
                  </span>
                  <span className="text-ui-sm text-fg-muted">
                    {article.topic} · {copy.minutesRead(article.minutes)}
                  </span>
                </span>
                <ChevronRightIcon
                  size={16}
                  strokeWidth={1.75}
                  className="shrink-0 text-fg-muted transition-transform yj-duration-fast ease-standard group-hover/article:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/article:-translate-x-0.5 reduced:translate-x-0"
                />
              </Link>
            </PresenceItem>
          ))}
        </PresenceList>
      ) : (
        <div className="flex flex-col items-start gap-2 px-1 pb-1">
          <p className="text-ui text-fg-muted">
            {copy.noArticles(query.trim())}
          </p>
          <Button variant="outline" size="sm" onClick={() => onAsk(query.trim())}>
            {copy.askTeam}
          </Button>
        </div>
      )}
    </section>
  )
}
