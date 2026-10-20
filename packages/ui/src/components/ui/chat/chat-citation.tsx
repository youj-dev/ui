'use client'

import type { ComponentProps, ReactNode } from 'react'
import { useComponentLabels } from '@youj/core/labels'
import { chatCitationLabels } from '@youj/core/labels'
import { cn } from '../../../lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../hover-card'
import { safeHref } from '../../../lib/safe-href'

/* Where an answer came from.
 * - ChatCitation: the numbered marker in the text ("[1]" in markdown),
 *   a small chip that links to the source and previews it on hover or
 *   focus (HoverCard: it waits a beat, grows out of the chip with yj-pop, and
 *   stays while the pointer travels onto it).
 * - ChatSources: the same sources as a row of chips under the answer, each
 *   with a monogram and its domain.
 * The link is the accessible interface ("1, Regions and pricing"); the
 * preview is a sighted convenience. A source whose URL isn't http(s) is
 * shown, but not linked. Reduced motion: the preview appears at once. */

export interface ChatSource {
  /** Names the source in the preview, the chip and the marker's label. */
  title: string
  /** Opens in a new tab. Its domain shows in the preview and the monogram. */
  url: string
  /** A line or two from the source, for the preview. */
  snippet?: string
  /** Replaces the domain's monogram, e.g. a favicon. */
  icon?: ReactNode
}

/** The source's domain, or its title when the URL has no host (file:, a bare path). */
const domainOf = (source: ChatSource) => {
  try {
    return new URL(source.url).hostname.replace(/^www\./, '') || source.title
  } catch {
    return source.title
  }
}

function Monogram({ source, className }: { source: ChatSource; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'own:grid size-4 shrink-0 place-items-center overflow-hidden rounded-xs own:bg-well own:text-[0.625rem] own:leading-none own:font-semibold own:text-fg own:uppercase',
        className,
      )}
    >
      {source.icon ?? domainOf(source)[0]}
    </span>
  )
}

function SourcePreview({ source, index }: { source: ChatSource; index: number }) {
  return (
    <>
      <span className="own:flex items-center gap-2 own:text-ui-sm own:text-fg-muted">
        <Monogram source={source} />
        <span className="truncate">{domainOf(source)}</span>
        <span className="own:ms-auto own:font-mono own:text-ui-xs own:tabular-nums">{index}</span>
      </span>
      <span className="own:line-clamp-2 own:text-ui own:font-medium own:text-fg">{source.title}</span>
      {source.snippet && <span className="own:line-clamp-3 own:text-ui-sm own:text-fg-muted">{source.snippet}</span>}
    </>
  )
}

interface SourceLinkProps {
  index: number
  source: ChatSource
  className: string
  children: ReactNode
  defaultOpen?: boolean
  /** Adds the title to the accessible name, unless the chip already shows it. Default true. */
  titled?: boolean
}

/** A chip that links to its source and previews it; an unsafe URL renders it unlinked, without a preview. */
function SourceLink({ index, source, className, children, defaultOpen, titled = true }: SourceLinkProps) {
  const href = safeHref(source.url)
  const name = titled && <span className="sr-only">, {source.title}</span>
  if (!href) {
    return (
      <span data-slot="chat-source" className={className}>
        {children}
        {name}
      </span>
    )
  }
  return (
    <HoverCard defaultOpen={defaultOpen}>
      <HoverCardTrigger data-slot="chat-source" href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
        {name}
      </HoverCardTrigger>
      <HoverCardContent side="top" sideOffset={6} className="w-72 gap-1.5 p-3">
        <SourcePreview source={source} index={index} />
      </HoverCardContent>
    </HoverCard>
  )
}

export interface ChatCitationProps {
  /** The number in the text, 1-based. */
  index: number
  source: ChatSource
  /** Open the preview from the start (a story, a tour). */
  defaultOpen?: boolean
}

/** The inline, numbered marker for a source. */
function ChatCitation({ index, source, defaultOpen }: ChatCitationProps) {
  return (
    <SourceLink
      index={index}
      source={source}
      defaultOpen={defaultOpen}
      className={cn(
        'mx-px inline-flex h-4 min-w-4 -translate-y-px items-center justify-center rounded-xs own:bg-band px-1 align-middle',
        'own:font-mono own:text-ui-xs leading-none font-medium text-fg-muted own:tabular-nums no-underline',
        'transition-colors yj-duration-fast ease-standard own:hover:bg-accent-subtle hover:text-accent-text focus-ring own:data-popup-open:bg-accent-subtle data-popup-open:text-accent-text',
      )}
    >
      {index}
    </SourceLink>
  )
}

export interface ChatSourcesProps extends Omit<ComponentProps<'div'>, 'children'> {
  sources: ChatSource[]
  /** Default "Sources". */
  label?: string
}

/** The sources of an answer as a row of chips. */
function ChatSources({ sources, label, className, ...props }: ChatSourcesProps) {
  const labels = useComponentLabels(chatCitationLabels)
  label ??= labels.chatSources
  if (sources.length === 0) return null
  return (
    <div data-slot="chat-sources" className={cn('own:flex flex-col gap-2', className)} {...props}>
      <span className="own:text-ui-xs own:font-medium own:tracking-wide own:text-fg-muted own:uppercase">{label}</span>
      <ul aria-label={label} className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <li key={source.url + i}>
            <SourceLink
              index={i + 1}
              source={source}
              titled={domainOf(source) !== source.title}
              className={cn(
                'inline-flex h-7 max-w-64 items-center gap-1.5 rounded-md border own:border-line own:bg-canvas ps-1.5 pe-2 text-ui-sm text-fg',
                'transition-colors yj-duration-fast ease-standard own:hover:bg-hover focus-ring own:data-popup-open:bg-hover',
              )}
            >
              <Monogram source={source} />
              <span className="truncate">{domainOf(source)}</span>
              <span aria-hidden className="own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums">
                {i + 1}
              </span>
            </SourceLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { ChatCitation, ChatSources }
