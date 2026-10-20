'use client'

import type { ComponentProps, ElementType, ReactNode } from 'react'
import { PresenceSettled, ThemeScope, type ThemeInput } from '@youj/core'
import { Counter, PresenceItem, PresenceList, Reveal, ScrollProgress } from '@youj/motion'
import { RssIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { buttonVariants } from '../../components/ui/button'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible'
import { Skeleton } from '../../components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group'
import { Eyebrow } from '../../components/ui/typography'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { CHANGELOG_COPY, KIND_TONE, releaseId, RELEASES, type ChangelogCopy, type ChangelogFilter, type ChangelogKind, type ChangelogRelease } from './changelog/data'
import { Subscribe } from './changelog/subscribe'

/* Relay's changelog, set like a journal in the Brutal theme. A sticky masthead
 * carries Subscribe and a reading bar (ScrollProgress) along its foot; under
 * the headline, a segmented ToggleGroup filters by kind, its raised key
 * gliding between All, New, Improved and Fixed. Each release is an article with its version and date on a rail that
 * sticks beside it on wide screens and sits above it on phones; its body
 * rises in as it scrolls into view, some carry a media panel (a snippet or a
 * Counter that counts up to the headline number), and the small fixes fold
 * away in a Collapsible. Filtering runs through PresenceList, so releases
 * leave where they stand and the rest close the gap. Subscribe opens a
 * Popover with an email field saved through Button's onAction. Reduced
 * motion: filtering, the counters and the reveals are instant.
 *
 * Pass your `releases` and `brand`, wire `onSubscribe`, and set the feed and
 * archive links; every string is in `copy`. */

function Media({ media }: { media: NonNullable<ChangelogRelease['media']> }) {
  if (media.type === 'code') {
    return (
      <figure className="overflow-hidden rounded-md border border-line bg-surface">
        <div aria-hidden className="flex items-center gap-1.5 border-b border-line px-3 py-2">
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-ui-sm leading-relaxed text-fg">
          <code>{media.lines.join('\n')}</code>
        </pre>
      </figure>
    )
  }
  return (
    <figure className="flex flex-wrap items-end gap-x-5 gap-y-2 rounded-md border border-line bg-surface px-5 py-6">
      <Counter
        value={media.value}
        format={{ maximumFractionDigits: 0 }}
        className="text-3xl leading-none font-semibold tracking-tight text-accent-text"
        aria-label={`${media.value}${media.suffix}`}
      />
      <span aria-hidden className="-ms-4 text-4xl leading-none font-semibold text-accent-text">
        {media.suffix}
      </span>
      <figcaption className="max-w-60 pb-1 text-ui text-fg-muted">{media.caption}</figcaption>
    </figure>
  )
}

function Fixes({ fixes, copy }: { fixes: string[]; copy: ChangelogCopy }) {
  return (
    <Collapsible className="rounded-md border border-line">
      <CollapsibleTrigger className="focus-ring flex w-full items-center gap-2 rounded-md px-4 py-3 text-start text-ui font-medium text-fg hover:bg-hover">
        <Badge variant="secondary">
          <BadgeDot />
          {copy.filters.fixed}
        </Badge>
        {copy.smallerFixes(fixes.length)}
        <CollapsibleChevron size={14} className="ms-auto text-fg-muted" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex list-disc flex-col gap-1.5 ps-9 pe-4 pb-4 text-ui text-fg-muted marker:text-line-strong">
          {fixes.map((fix) => (
            <li key={fix}>{fix}</li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function Entry({ release, copy }: { release: ChangelogRelease; copy: ChangelogCopy }) {
  return (
    <div className="grid gap-4 border-t border-line py-12 md:grid-cols-[9rem_1fr] md:gap-10">
      <div className="md:sticky md:top-32 md:self-start">
        <p className="font-mono text-ui-sm text-accent-text">v{release.version}</p>
        <Eyebrow render={<time />} className="text-ui-sm text-fg-muted">
          {release.date}
        </Eyebrow>
      </div>
      <Reveal className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-wrap gap-1.5">
          {release.kinds.map((k) => (
            <Badge key={k} variant={KIND_TONE[k]}>
              <BadgeDot />
              {copy.filters[k]}
            </Badge>
          ))}
        </div>
        <h2 id={releaseId(release)} className="text-3xl leading-tight font-semibold tracking-tight text-balance text-fg">
          {release.title}
        </h2>
        {release.body.map((p) => (
          <p key={p.slice(0, 24)} className="max-w-[62ch] text-lg leading-relaxed text-fg">
            {p}
          </p>
        ))}
        {release.media && <Media media={release.media} />}
        {release.fixes && <Fixes fixes={release.fixes} copy={copy} />}
      </Reveal>
    </div>
  )
}

function Masthead({ label, children }: { label: string; children: ReactNode }) {
  return (
    <header data-yj-tone="header" className="sticky top-0 z-20 border-b border-line yj-glass">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-3 md:px-8">{children}</div>
      <ScrollProgress label={label} className="absolute inset-x-0 -bottom-px" />
    </header>
  )
}

interface ChangelogProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, with no masthead of its own (the feed and Subscribe move to the header's actions). Default true; `false` draws its own page (the masthead, a reading bar and the hero). */
  embedded?: boolean
  /** The releases, newest first. Default: the demo's four. */
  releases?: ChangelogRelease[]
  /** The product's name and mark in the masthead. Default: Relay. */
  brand?: { name: string; logo?: ReactNode }
  /** Saves a subscriber's email; reject with an Error whose message shows under the field. Default: a short demo wait. */
  onSubscribe?: (email: string) => Promise<unknown> | unknown
  /** The kind shown, controlled: pair it with `onFilterChange`. */
  filter?: ChangelogFilter
  /** The kind shown first, when the page owns it. Default 'all'. */
  defaultFilter?: ChangelogFilter
  onFilterChange?: (filter: ChangelogFilter) => void
  /** The feed's URL; `null` hides the button. Default '#rss'. */
  rssHref?: string | null
  /** Where older releases live; `null` hides the line. Default '#archive'. */
  archiveHref?: string | null
  /** Renders the archive link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** Shows placeholders while the releases load. Default false. */
  loading?: boolean
  /** Replaces the message when no release matches. */
  empty?: ReactNode
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<ChangelogCopy>
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

function Changelog({
  theme,
  embedded = true,
  releases = RELEASES,
  brand = { name: 'Relay' },
  onSubscribe = () => demo('Changelog: onSubscribe', 900),
  filter: filterProp,
  defaultFilter = 'all',
  onFilterChange,
  rssHref = '#rss',
  archiveHref = '#archive',
  linkComponent: Link = 'a',
  loading = false,
  empty,
  copy: copyProp,
  className,
  ...rest
}: ChangelogProps) {
  const copy = { ...CHANGELOG_COPY, ...copyProp }
  const [filter, setOwnedFilter] = useControllableState(filterProp, defaultFilter)
  const setFilter = (next: ChangelogFilter) => (setOwnedFilter(next), onFilterChange?.(next))
  const shown = releases.filter((r) => filter === 'all' || r.kinds.includes(filter))
  const feed = (
    <>
      {rssHref !== null && (
        <a href={rssHref} aria-label={copy.rss} className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}>
          <RssIcon size={16} />
        </a>
      )}
      <Subscribe copy={copy} onSubscribe={onSubscribe} />
    </>
  )
  const releasesView = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <ToggleGroup variant="segmented" aria-label={copy.filter} value={[filter]} onValueChange={(value) => value[0] && setFilter(value[0] as ChangelogFilter)}>
          {(['all', 'new', 'improved', 'fixed'] as const).map((f) => (
            <ToggleGroupItem key={f} value={f} className="px-3">
              {copy.filters[f]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p role="status" className="text-ui-sm text-fg-muted tabular-nums">
          {loading ? copy.loading : copy.count(shown.length, releases.length)}
        </p>
      </div>
      {/* Every release's height at 100%: a kind's fewer releases never shrink the page; side by side, opened fixes scroll here. */}
      <div className="min-h-456 md:h-456 md:overflow-y-auto md:yj-scrollbar">
        {loading ? (
          <div aria-hidden className="flex flex-col">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="grid gap-4 border-t border-line py-12 md:grid-cols-[9rem_1fr] md:gap-10">
                <Skeleton className="h-4 w-16" />
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <PresenceList as="div" aria-label={copy.list}>
              {shown.map((r) => (
                <PresenceItem as="article" key={r.version} aria-labelledby={releaseId(r)}>
                  <PresenceSettled>
                    <Entry release={r} copy={copy} />
                  </PresenceSettled>
                </PresenceItem>
              ))}
            </PresenceList>
            {shown.length === 0 && (empty ?? <p className="border-t border-line py-12 text-center text-ui text-fg-muted">{copy.empty}</p>)}
          </>
        )}
      </div>
      {archiveHref !== null && (
        <p className="border-t border-line pt-10 text-center text-ui text-fg-muted">
          {copy.archiveBefore}
          <Link href={archiveHref} className="focus-ring rounded-sm text-accent-text underline underline-offset-4">
            {copy.archiveLink}
          </Link>
          {copy.archiveAfter}
        </p>
      )}
    </>
  )

  if (embedded) {
    const page = (
      <AppPage {...rest} title={copy.title} description={copy.description} actions={feed} className={cn('text-fg', className)}>
        <div className="flex flex-col">{releasesView}</div>
      </AppPage>
    )
    return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
  }
  return (
    <ThemeScope theme={theme}>
      <div className={cn('min-h-dvh bg-canvas text-fg', className)} {...rest}>
        <Masthead label={copy.readingProgress}>
          <span className="me-auto flex items-center gap-2 text-ui font-semibold tracking-tight">
            {brand.logo}
            <span>
              {brand.name} <span className="font-normal text-fg-muted">{copy.section}</span>
            </span>
          </span>
          {feed}
        </Masthead>
        <main className="mx-auto max-w-4xl px-4 pt-14 pb-24 md:px-8 md:pt-20">
          <Reveal inView={false} className="flex flex-col gap-4 pb-10">
            <p className="font-mono text-ui-sm tracking-wide text-accent-text uppercase">{copy.eyebrow}</p>
            <h1 className="max-w-[18ch] text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl">{copy.title}</h1>
            <p className="max-w-[52ch] text-lg leading-relaxed text-fg-muted">{copy.description}</p>
          </Reveal>
          {releasesView}
        </main>
      </div>
    </ThemeScope>
  )
}

export { Changelog, CHANGELOG_COPY }
export type { ChangelogCopy, ChangelogFilter, ChangelogKind, ChangelogProps, ChangelogRelease }
