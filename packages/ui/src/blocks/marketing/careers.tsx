'use client'

import { useId, useMemo, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { PresenceItem, PresenceList, Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckIcon, SearchIcon, XIcon } from '@youj/icons'
import { Button, buttonVariants } from '../../components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../components/ui/input-group'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useIsPhone } from '../../hooks/use-mobile'
import { useNow } from '../../hooks/use-now'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, PERKS, ROLES, type CareersCopy, type CareersCta, type CareersRole } from './careers/data'
import { fold, RoleRow } from './careers/role-row'

/* The open roles, findable. A heading with what you get (the perks, checked off), then one row of controls: the
 * teams as tabs with live counts (a select on a phone), a search that marks its words in titles and places, and a
 * location filter (anywhere, remote, or a city). The roles sit under their team's heading, each a row that is one
 * link with the place, the kind and the salary band lined up in columns; the last fortnight's say New. Rows that stop
 * matching fade where they stand while the rest glide up, and the count is announced. Nothing matching says so, with
 * a way back and the open application. Reduced motion: the list changes at once.
 *
 * Pass your `roles` and `perks`, own the team, search and location when the URL should hold them, point the open
 * application at your form through `cta`, and set `now` for the New marks; every string is in `copy`. */

type HeadingLevel = 1 | 2 | 3

interface CareersProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The open roles; their teams come from them. Default: the demo's eight. `[]` leaves only the open application. */
  roles?: CareersRole[]
  /** What working here gets you, checked off under the heading; `[]` hides them. */
  perks?: string[]
  /** The team shown (`''` is all), controlled. */
  team?: string
  /** The team shown first, uncontrolled. Default all. */
  defaultTeam?: string
  onTeamChange?: (team: string) => void
  /** The search, controlled. */
  query?: string
  /** The search first shown, uncontrolled. Default none. */
  defaultQuery?: string
  onQueryChange?: (query: string) => void
  /** The place (`''` anywhere, `'remote'`, or a role's `location`), controlled. */
  location?: string
  /** The place first shown, uncontrolled. Default anywhere. */
  defaultLocation?: string
  onLocationChange?: (location: string) => void
  /** The open application, at the end; `null` hides it. Default: "Send an open application" → `#apply`. */
  cta?: CareersCta | null
  /** When "now" is, for the New marks. Default: the browser's clock. */
  now?: Date | number
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<CareersCopy>
  /** The section heading's level; the teams sit one below. Default 2. */
  headingLevel?: HeadingLevel
}

/** Roles posted within this many days say New. */
const FRESH_DAYS = 14

function Careers({
  theme,
  embedded = false,
  roles = ROLES,
  perks = PERKS,
  team: teamProp,
  defaultTeam = '',
  onTeamChange,
  query: queryProp,
  defaultQuery = '',
  onQueryChange,
  location: locationProp,
  defaultLocation = '',
  onLocationChange,
  cta = { label: 'Send an open application', href: '#apply' },
  now: nowProp,
  linkComponent: Link = 'a',
  copy: copyProp,
  headingLevel = 2,
  className,
  ...rest
}: CareersProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const Group = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const phone = useIsPhone()
  const clock = useNow(0)
  const now = nowProp === undefined ? clock : new Date(nowProp).getTime()
  const [team, setTeam] = useControllableState(teamProp, defaultTeam)
  const [query, setQuery] = useControllableState(queryProp, defaultQuery)
  const [place, setPlace] = useControllableState(locationProp, defaultLocation)
  const pickTeam = (next: string) => (setTeam(next), onTeamChange?.(next))
  const pickQuery = (next: string) => (setQuery(next), onQueryChange?.(next))
  const pickPlace = (next: string) => (setPlace(next), onLocationChange?.(next))

  const terms = fold(query).split(/\s+/).filter(Boolean)
  const inPlace = (r: CareersRole) => !place || (place === 'remote' ? r.remote : r.location === place)
  const inQuery = (r: CareersRole) => terms.every((t) => fold(`${r.title} ${r.location} ${r.team}`).includes(t))
  const matching = roles.filter((r) => inPlace(r) && inQuery(r))
  const teams = useMemo(() => [...new Set(roles.map((r) => r.team))], [roles])
  const cities = useMemo(() => [...new Set(roles.filter((r) => !r.remote).map((r) => r.location))], [roles])
  const shown = team ? matching.filter((r) => r.team === team) : matching
  const groups = teams.map((name) => ({ name, roles: shown.filter((r) => r.team === name) })).filter((g) => g.roles.length > 0)
  const fresh = (r: CareersRole) => now !== null && r.posted !== undefined && now - new Date(r.posted).getTime() < FRESH_DAYS * 86_400_000
  const clear = () => {
    pickTeam('')
    pickQuery('')
    pickPlace('')
  }
  const apply = cta && (
    <Link href={cta.href} onClick={cta.onClick} data-yj-trigger="" className={buttonVariants({ variant: 'outline', className: 'gap-2' })}>
      {cta.label} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
    </Link>
  )

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <Reveal className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div className="flex flex-col gap-3">
            {copy.eyebrow && <p className="text-ui-sm font-medium text-fg-muted">{copy.eyebrow}</p>}
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            {copy.description && <p className="max-w-xl text-pretty text-ui-lg text-fg-muted">{copy.description}</p>}
          </div>
          {perks.length > 0 && (
            <ul aria-label={copy.perksLabel} className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-ui text-fg">
                  <span aria-hidden className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-fg text-canvas">
                    <CheckIcon size={10} strokeWidth={2.5} />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          )}
        </Reveal>
        {roles.length > 0 && (
          <div className="flex flex-col gap-4 border-b border-line lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            {phone || teams.length < 2 ? (
              teams.length > 1 && (
                <Select
                  items={{ '': copy.all, ...Object.fromEntries(teams.map((t) => [t, t])) }}
                  value={team}
                  onValueChange={(next) => pickTeam(next ?? '')}
                >
                  <SelectTrigger aria-label={copy.teamsLabel} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{copy.all}</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            ) : (
              <SegmentedControl
                value={team || '*'}
                onValueChange={(next) => pickTeam(next === '*' ? '' : next)}
                aria-label={copy.teamsLabel}
                className="-mb-px shadow-none"
              >
                {['*', ...teams].map((t) => (
                  <SegmentedControlItem key={t} value={t} className="gap-1.5 px-3">
                    {t === '*' ? copy.all : t}
                    <span className="font-mono text-ui-xs text-fg-subtle tabular-nums">
                      {t === '*' ? matching.length : matching.filter((r) => r.team === t).length}
                    </span>
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            )}
            <div className="flex items-center gap-2 pb-3 lg:pb-2">
              <InputGroup className="h-control-sm min-w-0 flex-1 lg:w-56 lg:flex-none">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  aria-label={copy.search}
                  placeholder={copy.searchPlaceholder}
                  value={query}
                  onChange={(event) => pickQuery(event.target.value)}
                  onKeyDown={(event) => event.key === 'Escape' && query && (event.preventDefault(), pickQuery(''))}
                  className="[&::-webkit-search-cancel-button]:appearance-none"
                />
                {query && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton size="icon-xs" aria-label={copy.clearSearch} onClick={() => pickQuery('')}>
                      <XIcon />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>
              <Select
                items={{ '': copy.anywhere, remote: copy.remote, ...Object.fromEntries(cities.map((c) => [c, c])) }}
                value={place}
                onValueChange={(next) => pickPlace(next ?? '')}
              >
                <SelectTrigger size="sm" aria-label={copy.location} className="w-36 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="">{copy.anywhere}</SelectItem>
                  <SelectItem value="remote">{copy.remote}</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {roles.length > 0 && (
          <div className="flex flex-col gap-4">
            <p role="status" className="text-ui-sm text-fg-muted tabular-nums">
              {copy.count(shown.length)}
            </p>
            {/* Every role's height at 100%: a team, a place or a search never resize the section. */}
            <div className="-mx-1 h-141.5 overflow-y-auto px-1 yj-scrollbar">
              {groups.length > 0 ? (
                <PresenceList as="div" className="flex flex-col">
                  {groups.flatMap((group) => [
                    <PresenceItem as="div" key={`team:${group.name}`} className="flex items-baseline justify-between gap-4 pt-6 pb-2 first:pt-0">
                      <Group className="text-ui-sm font-medium text-fg-muted">{group.name}</Group>
                      <span aria-hidden className="font-mono text-ui-xs text-fg-subtle tabular-nums">
                        {group.roles.length}
                      </span>
                    </PresenceItem>,
                    ...group.roles.map((role) => (
                      <PresenceItem as="div" key={role.id} className="border-t border-line-subtle">
                        <RoleRow role={role} terms={terms} fresh={fresh(role)} copy={copy} Link={Link} />
                      </PresenceItem>
                    )),
                  ])}
                </PresenceList>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
                  <p className="text-ui-lg font-medium">{copy.emptyTitle}</p>
                  <p className="max-w-sm text-pretty text-ui text-fg-muted">{copy.emptyDescription}</p>
                  <Button variant="outline" onClick={clear} className="mt-1">
                    {copy.clearFilters}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        {apply && (
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-ui-lg font-medium">{copy.openTitle}</p>
              <p className="text-pretty text-ui text-fg-muted">{copy.openDescription}</p>
            </div>
            {apply}
          </div>
        )}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { Careers }
export type { CareersProps, CareersCopy, CareersCta, CareersRole }
