'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ElementType } from 'react'
import { BookOpenIcon, ExternalLinkIcon } from '@youj/icons'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { safeLink } from '../../../lib/safe-href'
import type { SupportArticle, SupportRequestCopy } from './data'

/* Answers before asking: once the subject says enough (and typing pauses),
 * the help center is searched for it and up to three articles rise in under
 * the field, each opening in a new tab so nothing typed here is lost. New
 * results replace old ones row by row; an empty search folds the list away.
 * It's a labelled region the subject points to, and it says nothing aloud
 * while you type. */

interface ArticlesProps {
  query: string
  topic: string
  copy: SupportRequestCopy
  search: (query: string, topic: string) => Promise<SupportArticle[]> | SupportArticle[]
  linkComponent: ElementType
  /** The list's id, for the subject's `aria-controls`. */
  id?: string
}

export function Articles({ query, topic, copy, search, linkComponent: Link, id }: ArticlesProps) {
  const ownId = useId()
  const [found, setFound] = useState<{ query: string; articles: SupportArticle[] }>({ query: '', articles: [] })
  const latest = useRef(search)
  useLayoutEffect(() => {
    latest.current = search
  })
  const asks = query.trim().length >= 4

  useEffect(() => {
    if (!asks) return
    let live = true
    const timer = setTimeout(() => {
      Promise.resolve(latest.current(query.trim(), topic)).then(
        (articles) => live && setFound({ query, articles }),
        () => live && setFound({ query, articles: [] }),
      )
    }, 350)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [asks, query, topic])

  const articles = asks ? found.articles : []
  const titleId = `${id ?? ownId}-title`
  return (
    <div id={id ?? ownId}>
      <Collapse open={articles.length > 0}>
        <section aria-labelledby={titleId} className="flex flex-col gap-1.5 pt-1">
          <p id={titleId} className="flex items-center gap-1.5 text-ui-sm font-medium text-fg-muted">
            <BookOpenIcon size={13} aria-hidden />
            {copy.articles}
          </p>
          <PresenceList className="flex flex-col gap-1">
            {articles.map((article) => (
              <PresenceItem key={article.id}>
                <Link
                  href={safeLink(article.href) ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-3 rounded-md border border-line bg-surface px-3 py-2 transition-[background-color,border-color] yj-duration-fast ease-standard hover:bg-hover focus-ring"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-ui font-medium text-fg">{article.title}</span>
                    {article.excerpt && <span className="text-ui-sm text-fg-muted">{article.excerpt}</span>}
                  </span>
                  <ExternalLinkIcon
                    size={13}
                    aria-hidden
                    className="mt-1 shrink-0 text-fg-subtle transition-colors yj-duration-fast group-hover:text-fg-muted rtl:-scale-x-100"
                  />
                  <span className="sr-only">{copy.newTab}</span>
                </Link>
              </PresenceItem>
            ))}
          </PresenceList>
        </section>
      </Collapse>
    </div>
  )
}
