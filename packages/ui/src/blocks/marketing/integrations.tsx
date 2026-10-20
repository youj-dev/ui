'use client'

import { useId, useMemo, useState, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { PresenceItem, PresenceList, Reveal } from '@youj/motion'
import { SearchIcon, XIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { IntegrationCard, IntegrationCardSkeleton } from './integrations/card'
import {
  DEFAULT_COPY,
  INTEGRATIONS,
  NOW,
  type Integration,
  type IntegrationConnection,
  type IntegrationHealth,
  type IntegrationStatus,
  type IntegrationSyncDay,
  type MarketingIntegrationsCopy,
} from './integrations/data'
import { IntegrationDetail } from './integrations/detail'

/* An integrations hub: every integration as a card, searchable (name, line,
 * category and keywords) and browsable by category (with Connected as its own
 * list at the top), each card showing its status and, when connected, its
 * health. Choosing a card opens the connection detail in a sheet: what it is
 * and does, what it can access and, for a live connection, who connected it,
 * its last sync, its health and a month of sync history, with Connect,
 * Disconnect or Reconnect in the footer. The grid re-flows as the filter
 * changes (cards glide, the rest fade where they stand), the result count is
 * announced, and an empty search offers to clear it or to request the tool.
 * Reduced motion: no glide.
 *
 * Pass your `integrations`, follow or drive the search and category
 * (`query`, `category`), wire `onConnect` / `onDisconnect` (they run through
 * Button's pending / success / error; where unwired the demo flips the
 * connection locally), give the clock as `now` and the `locale`; every
 * string is in `copy`. */

type Pick = 'all' | 'connected' | string

interface MarketingIntegrationsProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** Everything on offer. Default: the demo's twelve. */
  integrations?: Integration[]
  /** The search text, controlled. */
  query?: string
  /** The search text at first, uncontrolled. Default empty. */
  defaultQuery?: string
  /** Called as the visitor types. */
  onQueryChange?: (query: string) => void
  /** The category shown (`'all'`, `'connected'` or a category name), controlled. */
  category?: string
  /** The category shown first, uncontrolled. Default `'all'`. */
  defaultCategory?: string
  /** Called with the category the visitor picked. */
  onCategoryChange?: (category: string) => void
  /** Called when a card is opened. */
  onOpen?: (integration: Integration) => void
  /** Connect (or reconnect). Resolve for success, reject (an Error's message is shown) to fail. Default: a demo wait that marks it connected. */
  onConnect?: (integration: Integration) => Promise<unknown> | unknown
  /** Disconnect. Default: a demo wait that marks it available. */
  onDisconnect?: (integration: Integration) => Promise<unknown> | unknown
  /** Where "Request an integration" goes; without it the button is hidden. Default `#request`. */
  requestHref?: string | null
  /** Show skeletons in place of the cards, while the list loads. Default false. */
  loading?: boolean
  /** The time relative times are measured from. Default: the demo's clock. */
  now?: Date | number
  /** The locale dates and counts are written in. Default: the YoujProvider's. */
  locale?: string
  /** Renders the links (docs, request): pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MarketingIntegrationsCopy>
  /** The heading's level. Default 2. */
  headingLevel?: 1 | 2 | 3
}

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  // lint-blocks-allow: this is demo()'s own wait, behind the warning
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function MarketingIntegrations({
  theme,
  embedded = false,
  integrations = INTEGRATIONS,
  query: queryProp,
  defaultQuery = '',
  onQueryChange,
  category: categoryProp,
  defaultCategory = 'all',
  onCategoryChange,
  onOpen,
  onConnect,
  onDisconnect,
  requestHref = '#request',
  loading = false,
  now: nowProp = NOW,
  locale: localeProp,
  linkComponent: Link = 'a',
  copy: copyProp,
  headingLevel = 2,
  className,
  ...rest
}: MarketingIntegrationsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const now = +nowProp
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const [query, setQuery] = useControllableState(queryProp, defaultQuery)
  const [category, setCategory] = useControllableState<Pick>(categoryProp, defaultCategory)
  const [openId, setOpenId] = useState<string | null>(null)
  // Where the app wired no handler, the demo flips the connection here.
  const [local, setLocal] = useState<Record<string, { status: IntegrationStatus; connection?: IntegrationConnection }>>({})

  const effective = (item: Integration) => local[item.id] ?? { status: item.status, connection: item.connection }
  const categories = useMemo(() => [...new Set(integrations.map((item) => item.category))], [integrations])
  const needle = query.trim().toLowerCase()
  const matches = (item: Integration) =>
    !needle || [item.name, item.description, item.category, ...(item.keywords ?? [])].some((text) => text.toLowerCase().includes(needle))
  const inCategory = (item: Integration) => (category === 'all' ? true : category === 'connected' ? effective(item).status === 'connected' : item.category === category)
  const shown = integrations.filter((item) => matches(item) && inCategory(item))
  const countIn = (pick: Pick) =>
    integrations.filter((item) => matches(item) && (pick === 'all' ? true : pick === 'connected' ? effective(item).status === 'connected' : item.category === pick)).length
  const opened = integrations.find((item) => item.id === openId) ?? null

  const choose = (next: Pick) => {
    setCategory(next)
    onCategoryChange?.(next)
  }
  const search = (next: string) => {
    setQuery(next)
    onQueryChange?.(next)
  }
  const connect = async (item: Integration) => {
    if (onConnect) return onConnect(item)
    await demo('Integrations: onConnect', 1200)
    const history: IntegrationSyncDay[] | undefined = item.connection?.history
    setLocal((all) => ({
      ...all,
      [item.id]: { status: 'connected', connection: { account: 'acme-org', connectedBy: 'You', connectedAt: now, lastSync: now, health: 'healthy', history } },
    }))
  }
  const disconnect = async (item: Integration) => {
    if (onDisconnect) return onDisconnect(item)
    await demo('Integrations: onDisconnect', 900)
    setLocal((all) => ({ ...all, [item.id]: { status: 'available' } }))
  }

  const tabs: { id: Pick; label: string }[] = [{ id: 'all', label: copy.all }, { id: 'connected', label: copy.connected }, ...categories.map((name) => ({ id: name, label: name }))]
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal className="flex max-w-xl flex-col gap-3">
            <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          </Reveal>
          <InputGroup className="md:max-w-xs">
            <InputGroupAddon>
              <SearchIcon size={16} aria-hidden />
            </InputGroupAddon>
            <InputGroupInput type="search" value={query} onChange={(event) => search(event.target.value)} placeholder={copy.searchPlaceholder} aria-label={copy.search} />
            {query && (
              <InputGroupAddon align="inline-end">
                <Button variant="ghost" size="icon-sm" aria-label={copy.clearSearch} onClick={() => search('')}>
                  <XIcon size={14} />
                </Button>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>

        <div className="grid gap-6 md:grid-cols-[--spacing(52)_minmax(0,1fr)] md:gap-10">
          <nav aria-label={copy.categories} className="md:sticky md:top-6 md:self-start">
            <ul className="flex flex-wrap gap-1 md:flex-col">
              {tabs.map((tab) => (
                <li key={tab.id} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={category === tab.id}
                    onClick={() => choose(tab.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-ui font-medium whitespace-nowrap text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring aria-pressed:bg-selected aria-pressed:text-fg"
                  >
                    {tab.label}
                    <span className="text-ui-sm font-normal tabular-nums">{loading ? '' : countIn(tab.id)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex min-w-0 flex-col gap-4">
            <p role="status" className="text-ui-sm text-fg-muted">
              {loading ? copy.loadingLabel : copy.results(shown.length)}
            </p>
            {/* The catalog's height at 100%: a category, Connected or a search never resize the section. */}
            <div className="-m-1 flex h-210 flex-col overflow-y-auto p-1 yj-scrollbar">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <IntegrationCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <PresenceList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {shown.map((item) => {
                    const state = effective(item)
                    return (
                      <PresenceItem key={item.id} className="flex">
                        <IntegrationCard
                          integration={item}
                          status={state.status}
                          health={state.status === 'connected' ? (state.connection?.health as IntegrationHealth | undefined) : undefined}
                          onOpen={() => {
                            setOpenId(item.id)
                            onOpen?.(item)
                          }}
                          copy={copy}
                        />
                      </PresenceItem>
                    )
                  })}
                </PresenceList>
              )}
              {!loading && shown.length === 0 && (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>{copy.noResultsTitle(query.trim())}</EmptyTitle>
                    <EmptyDescription>{copy.noResultsDescription}</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent className="flex-row justify-center">
                    {query && (
                      <Button variant="outline" onClick={() => search('')}>
                        {copy.clearSearch}
                      </Button>
                    )}
                    {requestHref && (
                      <Link href={requestHref} className="inline-flex h-control items-center rounded-md px-3 text-ui font-medium text-accent hover:underline focus-ring">
                        {copy.request}
                      </Link>
                    )}
                  </EmptyContent>
                </Empty>
              )}
            </div>
          </div>
        </div>
      </div>
      <IntegrationDetail
        integration={opened}
        status={opened ? effective(opened).status : 'available'}
        connection={opened ? effective(opened).connection : undefined}
        onOpenChange={(open) => !open && setOpenId(null)}
        onConnect={connect}
        onDisconnect={disconnect}
        locale={locale}
        now={now}
        copy={copy}
        Link={Link}
      />
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { MarketingIntegrations }
export type {
  MarketingIntegrationsProps,
  MarketingIntegrationsCopy,
  Integration,
  IntegrationConnection,
  IntegrationHealth,
  IntegrationStatus,
  IntegrationSyncDay,
}
