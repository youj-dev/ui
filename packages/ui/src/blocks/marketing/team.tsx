'use client'

import { useId, useMemo, useState, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { PresenceItem, PresenceList, Reveal } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { buttonVariants } from '../../components/ui/button'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useIsPhone } from '../../hooks/use-mobile'
import { useNow } from '../../hooks/use-now'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, PEOPLE, type MarketingTeamCopy, type TeamCta, type TeamPerson, type TeamPersonLink } from './team/data'
import { Person } from './team/person'

/* The people behind the product, as portraits that look designed even before there's a photo: each person's initials
 * set large and cropped by the frame, the place they work from and their local time (day or night, ticking each
 * minute once the page is in the browser), their name and role. A bio rises over the portrait on hover or keyboard
 * focus; the name pins it open (a tap on touch) and Escape lets it go. A team filter with counts re-flows the grid:
 * the ones that stay glide to their places and the rest fade where they stand. Reduced motion: the grid changes and
 * the bios appear at once.
 *
 * Pass your `people` (a `photo`, `timeZone` and `bio` each, ideally), follow or drive the team shown (`team`), link
 * the whole team through `cta`, and set `now` to fix the clock; every string is in `copy`. */

type HeadingLevel = 1 | 2 | 3

interface MarketingTeamProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The people, in order; their teams come from them. Default: the demo's eight. */
  people?: TeamPerson[]
  /** The team shown (`''` is everyone), controlled. */
  team?: string
  /** The team shown first, uncontrolled. Default everyone. */
  defaultTeam?: string
  /** Called with the team picked (`''` for everyone). */
  onTeamChange?: (team: string) => void
  /** The time the local clocks show. Default: the browser's, ticking each minute. */
  now?: Date | number
  /** The locale the local times are written in. Default: the YoujProvider's. */
  locale?: string
  /** A link to the whole team, beside the heading; `null` hides it. Default: "Meet all 126" → `#team`. */
  cta?: TeamCta | null
  /** Renders the link to the whole team: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MarketingTeamCopy>
  /** The section heading's level; the people's names sit one below. Default 2. */
  headingLevel?: HeadingLevel
}

function MarketingTeam({
  theme,
  embedded = false,
  people = PEOPLE,
  team: teamProp,
  defaultTeam = '',
  onTeamChange,
  now: nowProp,
  locale: localeProp,
  cta = { label: 'Meet all 126', href: '#team' },
  linkComponent: Link = 'a',
  copy: copyProp,
  headingLevel = 2,
  className,
  ...rest
}: MarketingTeamProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const phone = useIsPhone()
  // The browser's clock, a minute at a time; a fixed `now` stops it.
  const ticking = useNow(nowProp === undefined ? 60_000 : 0)
  const now = nowProp === undefined ? ticking : new Date(nowProp).getTime()
  const [team, setTeam] = useControllableState(teamProp, defaultTeam)
  const [pinned, setPinned] = useState<string | null>(null)
  const teams = useMemo(
    () => [...new Set(people.map((p) => p.team))].map((name) => ({ name, count: people.filter((p) => p.team === name).length })),
    [people],
  )
  const shown = team ? people.filter((p) => p.team === team) : people
  const pick = (next: string) => {
    setTeam(next)
    onTeamChange?.(next)
  }

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="flex max-w-2xl flex-col gap-3">
            {copy.eyebrow && <p className="text-ui-sm font-medium text-fg-muted">{copy.eyebrow}</p>}
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            {copy.description && <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>}
          </div>
          {cta && (
            <Link href={cta.href} onClick={cta.onClick} data-yj-trigger="" className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
              {cta.label} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
            </Link>
          )}
        </Reveal>
        {teams.length > 1 &&
          (phone ? (
            <Select
              items={{ '': copy.all, ...Object.fromEntries(teams.map((t) => [t.name, t.name])) }}
              value={team}
              onValueChange={(next) => pick(next ?? '')}
            >
              <SelectTrigger aria-label={copy.filterLabel} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{copy.all}</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <SegmentedControl
              value={team || '*'}
              onValueChange={(next) => pick(next === '*' ? '' : next)}
              aria-label={copy.filterLabel}
              className="self-start"
            >
              {[{ name: '*', label: copy.all, count: people.length }, ...teams.map((t) => ({ ...t, label: t.name }))].map((t) => (
                <SegmentedControlItem key={t.name} value={t.name} className="gap-1.5 px-3">
                  {t.label}
                  <span className="font-mono text-ui-xs text-fg-subtle tabular-nums">{t.count}</span>
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          ))}
        {/* Everyone's height at 100%: a team's fewer portraits never shrink the section. */}
        <div className="-m-1 h-202 overflow-y-auto p-1 yj-scrollbar">
          {shown.length > 0 ? (
            <PresenceList aria-label={copy.title} className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {shown.map((person) => (
                <PresenceItem key={person.id} className="min-w-0">
                  <Person
                    person={person}
                    copy={copy}
                    headingLevel={headingLevel + 1}
                    now={now}
                    locale={locale}
                    open={pinned === person.id}
                    onToggle={() => setPinned(pinned === person.id ? null : person.id)}
                  />
                </PresenceItem>
              ))}
            </PresenceList>
          ) : (
            <p className="rounded-2xl border border-dashed border-line py-16 text-center text-ui text-fg-muted">{copy.empty}</p>
          )}
        </div>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { MarketingTeam }
export type { MarketingTeamProps, MarketingTeamCopy, TeamCta, TeamPerson, TeamPersonLink }
