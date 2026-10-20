'use client'

import { useId, useMemo, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { PresenceItem, PresenceList, Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckIcon, RssIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { buttonVariants } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useIsPhone } from '../../hooks/use-mobile'
import { cn, dateTimeFormat } from '../../lib/utils'
import { DEFAULT_COPY, ENTRIES, NOW, type WhatsNewCopy, type WhatsNewEntry, type WhatsNewKind } from './whats-new/data'
import { Row } from './whats-new/rows'

/* The changelog as a marketing section. The newest change is a feature card:
 * its release, date, title, what it does in a sentence, the highlights and,
 * if it has one, a picture or live piece; under it, the earlier changes as a
 * dated list (each with its area, a kind tag, and a disclosure for the
 * details) that re-flows as the area filter changes. The list can ask for
 * more (`hasMore`, `onLoadMore`), and the header links to a feed. Dates are
 * written in the locale, with how long ago next to them; every entry is an
 * `article` with a `time`. Reduced motion: no glide, the details open in place.
 *
 * Pass your `entries` (newest first), follow or drive the area filter
 * (`category`), give the clock as `now` and the `locale`; every string is in
 * `copy`. */

interface WhatsNewProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The changes, newest first; the first is the feature card. Default: the demo's six. */
  entries?: WhatsNewEntry[]
  /** The area shown (`''` is all), controlled. */
  category?: string
  /** The area shown first, uncontrolled. Default all. */
  defaultCategory?: string
  /** Called with the area the visitor picked (`''` for all). */
  onCategoryChange?: (category: string) => void
  /** There are earlier changes to load. Default false. */
  hasMore?: boolean
  /** Load earlier changes; the button shows it working until the promise settles. Add them to `entries` when it resolves. */
  onLoadMore?: () => Promise<unknown> | unknown
  /** Show skeletons in place of the changes, while they load. Default false. */
  loading?: boolean
  /** Where "Subscribe" goes (a feed or a signup); `null` hides it. Default `#subscribe`. */
  subscribeHref?: string | null
  /** Where "See the full changelog" goes; `null` hides it. Default `#changelog`. */
  changelogHref?: string | null
  /** The time "ago" is measured from. Default: the demo's clock. */
  now?: Date | number
  /** The locale dates are written in. Default: the YoujProvider's. */
  locale?: string
  /** Renders the links: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<WhatsNewCopy>
  /** The heading's level; each change's title sits one below. Default 2. */
  headingLevel?: 1 | 2 | 3
}

const DAY = 86_400_000

function WhatsNew({
  theme,
  embedded = false,
  entries = ENTRIES,
  category: categoryProp,
  defaultCategory = '',
  onCategoryChange,
  hasMore = false,
  onLoadMore,
  loading = false,
  subscribeHref = '#subscribe',
  changelogHref = '#changelog',
  now: nowProp = NOW,
  locale: localeProp,
  linkComponent: Link = 'a',
  copy: copyProp,
  headingLevel = 2,
  className,
  ...rest
}: WhatsNewProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const now = +nowProp
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const [category, setCategory] = useControllableState(categoryProp, defaultCategory)
  // Phones get a select: the row of segments would run off the screen.
  const phone = useIsPhone()
  const pickCategory = (next: string) => {
    const value = next === 'all' ? '' : next
    setCategory(value)
    onCategoryChange?.(value)
  }
  const formats = useMemo(
    () => ({ date: dateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }), ago: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }) }),
    [locale],
  )
  const ago = (at: number) => {
    const days = Math.round((at - now) / DAY)
    const abs = Math.abs(days)
    return abs < 14 ? formats.ago.format(days, 'day') : abs < 60 ? formats.ago.format(Math.round(days / 7), 'week') : formats.ago.format(Math.round(days / 30), 'month')
  }
  const categories = useMemo(() => [...new Set(entries.map((entry) => entry.category))], [entries])
  const shown = category ? entries.filter((entry) => entry.category === category) : entries
  const [latest, ...earlier] = shown
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal className="flex max-w-2xl flex-col gap-3">
            <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          </Reveal>
          {subscribeHref && (
            <Link href={subscribeHref} className={buttonVariants({ variant: 'outline', className: 'self-start md:self-auto' })}>
              <RssIcon size={15} aria-hidden />
              {copy.subscribe}
            </Link>
          )}
        </div>

        {categories.length > 1 && (
          phone ? (
            <Select items={{ all: copy.all, ...Object.fromEntries(categories.map((name) => [name, name])) }} value={category || 'all'} onValueChange={(next) => next && pickCategory(next)}>
              <SelectTrigger aria-label={copy.filterLabel} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.all}</SelectItem>
                {categories.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <SegmentedControl value={category || 'all'} onValueChange={pickCategory} aria-label={copy.filterLabel} className="self-start">
              <SegmentedControlItem value="all">{copy.all}</SegmentedControlItem>
              {categories.map((name) => (
                <SegmentedControlItem key={name} value={name}>
                  {name}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )
        )}

        {/* The notes scroll in their own height (1255px at 100%): a category, an opened note or an older page never resize the section. */}
        <div className="-m-1 h-315.75 overflow-y-auto p-1 yj-scrollbar">
          {loading ? (
            <div aria-label={copy.loadingLabel} role="status" className="flex flex-col gap-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !latest ? (
            <p className="py-10 text-center text-ui text-fg-muted">{copy.empty}</p>
          ) : (
            <div className="flex flex-col gap-4">
              <article className="grid gap-8 overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{copy.latest}</Badge>
                    <Badge variant="outline">{copy.kind[latest.kind]}</Badge>
                    <Badge variant="outline">{latest.category}</Badge>
                    {latest.version && <span className="font-mono text-ui-sm text-fg-muted">{copy.release(latest.version)}</span>}
                  </div>
                  <p className="text-ui-sm text-fg-muted">
                    <time dateTime={new Date(latest.date).toISOString()} className="font-medium text-fg">
                      {formats.date.format(latest.date)}
                    </time>{' '}
                    · {ago(latest.date)}
                  </p>
                  <h3 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{latest.title}</h3>
                  <p className="text-pretty text-ui-lg text-fg-muted">{latest.summary}</p>
                  {latest.highlights && latest.highlights.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {latest.highlights.map((point) => (
                        <li key={point} className="flex items-start gap-2.5 text-ui text-fg">
                          <CheckIcon size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href={latest.href} onClick={latest.onClick} className={buttonVariants({ className: 'self-start' })}>
                    {copy.readNotes}
                    <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
                  </Link>
                </div>
                {latest.media && (
                  <div aria-hidden className="min-w-0">
                    {latest.media}
                  </div>
                )}
              </article>

              <PresenceList as="div" className="flex flex-col">
                {earlier.map((entry) => (
                  <PresenceItem key={entry.id} as="div">
                    <Row entry={entry} date={formats.date.format(entry.date)} ago={ago(entry.date)} copy={copy} Link={Link} headingLevel={headingLevel + 1} />
                  </PresenceItem>
                ))}
              </PresenceList>
            </div>
          )}
        </div>

        {!loading && (hasMore || changelogHref) && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            {hasMore && onLoadMore ? (
              <AsyncButton variant="outline" onAction={() => onLoadMore()} pendingLabel={copy.loadingMore}>
                {copy.loadMore}
              </AsyncButton>
            ) : (
              <span />
            )}
            {changelogHref && (
              <Link href={changelogHref} className="inline-flex items-center gap-1.5 rounded-sm text-ui font-medium text-accent hover:underline focus-ring">
                {copy.changelog}
                <ArrowRightIcon size={14} aria-hidden className="rtl:-scale-x-100" />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { WhatsNew }
export type { WhatsNewProps, WhatsNewCopy, WhatsNewEntry, WhatsNewKind }
