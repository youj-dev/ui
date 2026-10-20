'use client'

import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter, PresenceItem, PresenceList, SpotlightGroup } from '@youj/motion'
import { PlugIcon, SearchIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { AppPage } from '../../components/ui/app-page'
import { Button } from '../../components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group'
import { Skeleton } from '../../components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group'
import { cn, numberFormat } from '../../lib/utils'
import { AppCard } from './integrations/app-card'
import { AppSheet } from './integrations/app-sheet'
import { CategoryRail } from './integrations/category-rail'
import { APPS, CATEGORIES, DEFAULT_COPY, FEATURED, INSTALLED, type App, type Category, type IntegrationFeature, type IntegrationsCopy, type Tone } from './integrations/data'
import { Featured } from './integrations/featured'

/* Switchboard's integrations marketplace. A category rail on the side (its
 * highlight glides between categories; on phones it scrolls across the top),
 * a search and an All / Installed switch filter one grid of cards that sit
 * under a shared spotlight; cards that stop matching fade out and the rest
 * glide into their places (PresenceList). A featured app rides a slow
 * MeshGradient. Opening a card slides in a Sheet with a screenshot Carousel,
 * what the app can do and the permissions it asks for; Install runs through
 * Button's onAction and flips the card to Installed. Swap `APPS` and the
 * demo `wait` for your catalog and install API. Reduced motion: the
 * highlight jumps, the grid re-flows in place and the gradient holds still.
 * Pass your own `brand`, `integrations`, `categories` and `featured`, install
 * through `onConnect` / `onDisconnect`; every string is in `copy`. It is built
 * for the compact layout density (ui.css), taken from the page. */

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

const BRAND = { name: 'Switchboard', logo: <PlugIcon size={15} /> }

interface IntegrationsProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with the categories across the top and no brand header. Default true; `false` draws its own page (the brand header and a category column). */
  embedded?: boolean
  /** The product's name and mark, in the standalone header. Default: Switchboard, with a plug. */
  brand?: { name: string; logo?: ReactNode }
  /** The title's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Formats install counts ("48.2K"). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The catalog. Default: the demo's fifteen apps. */
  integrations?: App[]
  /** The rail's categories, in order; "All" comes first on its own. Default: the demo's six. */
  categories?: Category[]
  /** The banner over the grid, shown while nothing is filtered; null hides it. Default: Tracklight's two-way sync. */
  featured?: IntegrationFeature | null
  /** Ids of the installed apps, controlled. Pair it with `onInstalledChange`. */
  installed?: string[]
  /** Ids installed when the page opens, uncontrolled. Default: Parley, Forge and Lumen. */
  defaultInstalled?: string[]
  /** Called with the new installed ids after a connect or disconnect. */
  onInstalledChange?: (ids: string[]) => void
  /** Installs an app; resolve when it's connected, throw to show why it failed. Default: a short demo wait. */
  onConnect?: (app: App) => Promise<unknown> | unknown
  /** Uninstalls an app; resolve when it's gone. Default: a short demo wait. */
  onDisconnect?: (app: App) => Promise<unknown> | unknown
  /** Shows skeleton cards in place of the grid while the catalog loads. Default false. */
  loading?: boolean
  /** Replaces the "Nothing matches" state. */
  empty?: ReactNode
  /** A load failure, shown over the grid with a Retry button when `onRetry` is set. */
  error?: ReactNode
  /** Called from the error's Retry button. */
  onRetry?: () => void
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<IntegrationsCopy>
}

function Integrations({
  theme,
  embedded = true,
  brand = BRAND,
  headingLevel = 1,
  locale: localeProp,
  integrations = APPS,
  categories = CATEGORIES,
  featured: feature = FEATURED,
  installed: installedProp,
  defaultInstalled = INSTALLED,
  onInstalledChange,
  onConnect,
  onDisconnect,
  loading = false,
  empty,
  error,
  onRetry,
  copy: copyProp,
  className,
  ...rest
}: IntegrationsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const Title = `h${headingLevel}` as const
  const [category, setCategory] = useState<Category | 'All'>('All')
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'all' | 'installed'>('all')
  const [ownInstalled, setOwnInstalled] = useState(defaultInstalled)
  const installed = new Set(installedProp ?? ownInstalled)
  const [openId, setOpenId] = useState<string>()
  const [lastApp, setLastApp] = useState<App>()
  const compact = useMemo(() => numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format, [locale])

  const pool = scope === 'installed' ? integrations.filter((a) => installed.has(a.id)) : integrations
  const counts: Record<string, number> = { All: pool.length }
  for (const a of pool) counts[a.category] = (counts[a.category] ?? 0) + 1
  const q = query.trim().toLowerCase()
  const shown = pool.filter((a) => (category === 'All' || a.category === category) && (!q || `${a.name} ${a.vendor} ${a.blurb}`.toLowerCase().includes(q)))
  const featuredApp = feature ? integrations.find((a) => a.id === feature.id) : undefined
  const open = (app: App) => {
    setLastApp(app)
    setOpenId(app.id)
  }
  const toggle = async (app: App, on: boolean) => {
    await (on ? (onConnect ? onConnect(app) : demo('Integrations: onConnect', 900)) : onDisconnect ? onDisconnect(app) : demo('Integrations: onDisconnect', 600))
    const next = new Set(installed)
    if (on) next.add(app.id)
    else next.delete(app.id)
    setOwnInstalled([...next])
    onInstalledChange?.([...next])
  }

  const heading = (
    <div className="flex flex-col gap-1">
      <Title className="text-2xl font-semibold tracking-tight">
        {copy.title}
      </Title>
      <p className="text-ui text-fg-muted">{copy.description}</p>
    </div>
  )
  const rail = <CategoryRail value={category} onChange={setCategory} counts={counts} across={embedded} categories={categories} label={copy.categories} allLabel={copy.allCategories} />
  const body = (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {/* The search stops at a field's width on a wide page; the switch keeps the row's end. */}
        <InputGroup className="min-w-0 max-w-md flex-1 basis-56">
          <InputGroupAddon>
            <SearchIcon size={15} />
          </InputGroupAddon>
          <InputGroupInput type="search" aria-label={copy.search} placeholder={copy.searchPlaceholder(integrations.length)} value={query} onChange={(event) => setQuery(event.target.value)} />
        </InputGroup>
        <ToggleGroup variant="segmented" aria-label={copy.show} value={[scope]} onValueChange={(next: unknown[]) => next[0] && setScope(next[0] as 'all' | 'installed')} className="ms-auto w-48">
          <ToggleGroupItem value="all">{copy.all}</ToggleGroupItem>
          <ToggleGroupItem value="installed">{copy.installed}</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* The featured app, the count and the catalog scroll in one height at an app's size: a category, Installed or a search never resize the page. */}
      <div className="-m-1 flex h-235.5 flex-col gap-5 overflow-y-auto p-1 yj-scrollbar">
        {feature && featuredApp && category === 'All' && scope === 'all' && !q && !loading && (
          <Featured app={featuredApp} feature={feature} copy={copy} installed={installed.has(featuredApp.id)} onOpen={() => open(featuredApp)} />
        )}

        {error && (
          <Alert variant="danger">
            <AlertTitle>{copy.errorTitle}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            {onRetry && (
              <AlertAction>
                <Button size="sm" variant="outline" onClick={onRetry}>
                  {copy.retry}
                </Button>
              </AlertAction>
            )}
          </Alert>
        )}

        {loading ? (
          <div role="status" aria-label={copy.loading} className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,--spacing(68)),1fr))] gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-36 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))]" />
            ))}
          </div>
        ) : (
          <>
            <p aria-live="polite" className="text-ui-sm text-fg-muted">
              <Counter value={shown.length} duration="fast" inView={false} className="font-medium text-fg" /> {copy.count(shown.length)}
              {category !== 'All' && copy.inCategory(category)}
            </p>

            {shown.length === 0 ? (
              (empty ?? (
                <Empty className="rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-dashed border-line">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <SearchIcon />
                    </EmptyMedia>
                    <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                    <EmptyDescription>{scope === 'installed' ? copy.emptyInstalled : copy.emptyAll}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ))
            ) : (
              <SpotlightGroup>
                <PresenceList aria-label={copy.list} className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,--spacing(68)),1fr))] gap-3">
                  {shown.map((app) => (
                    <PresenceItem key={app.id} className="min-w-0">
                      <AppCard app={app} copy={copy} compact={compact} installed={installed.has(app.id)} onOpen={() => open(app)} />
                    </PresenceItem>
                  ))}
                </PresenceList>
              </SpotlightGroup>
            )}
          </>
        )}
      </div>
    </div>
  )
  const sheet = (
    <AppSheet
      open={!!openId}
      app={lastApp}
      copy={copy}
      compact={compact}
      installed={!!lastApp && installed.has(lastApp.id)}
      onOpenChange={(next) => !next && setOpenId(undefined)}
      onInstall={() => lastApp && toggle(lastApp, true)}
      onUninstall={() => lastApp && toggle(lastApp, false)}
    />
  )

  if (embedded) {
    const view = (
      <AppPage
        {...rest}
        title={copy.title}
        description={copy.description}
        headingLevel={headingLevel}
        width="fill"
        className={cn('text-fg', className)}
      >
        {rail}
        {body}
        {sheet}
      </AppPage>
    )
    return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
  }
  return (
    <ThemeScope theme={theme}>
      <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
            <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-accent text-on-accent">
              {brand.logo}
            </span>
            <span className="font-semibold tracking-tight">{brand.name}</span>
            <span className="text-ui-sm text-fg-muted max-sm:hidden">{copy.tagline}</span>
            <span className="ms-auto text-ui-sm text-fg-muted tabular-nums">
              <Counter value={installed.size} duration="base" inView={false} /> {copy.installedCount}
            </span>
          </div>
        </header>
        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-8 lg:grid-cols-[--spacing(52)_minmax(0,1fr)] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            {heading}
            {rail}
          </div>

          {body}
        </main>
        {sheet}
      </div>
    </ThemeScope>
  )
}

export { IntegrationDetail, type IntegrationDetailProps } from './integrations/detail'
export type { ConnectionStatus as IntegrationConnectionStatus, IntegrationConnection, IntegrationDetailCopy, IntegrationPermission, IntegrationPreview } from './integrations/detail-data'
export {
  Integrations,
  type IntegrationsProps,
  type IntegrationsCopy,
  type App as IntegrationApp,
  type Category as IntegrationCategory,
  type IntegrationFeature,
  type Tone as IntegrationTone,
}
