'use client'

import { useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { KeyIcon, PlusIcon, ShieldIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { ConfirmDialog } from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { Stat, StatBars, StatGroup, StatNote, StatValue } from '../../components/ui/stat-card'
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group'
import { CreateKeyDialog } from './api-keys/create-key-dialog'
import { cn } from '../../lib/utils'
import {
  DEFAULT_COPY,
  EXPIRY,
  HOUR,
  KEYS,
  NAV,
  NOW,
  RESOURCES,
  demo,
  secret,
  type ApiKey,
  type ApiKeyDraft,
  type ApiKeyExpiry,
  type ApiKeysCopy,
  type ApiKeysNavLink,
  type Env,
  type Scopes,
} from './api-keys/data'
import { KeysTable } from './api-keys/keys-table'
import { RolledDialog } from './api-keys/secret-reveal'
import { TopBar } from './api-keys/top-bar'

/* Ledger API's developer settings: the secret keys an integration signs its
 * requests with, per environment. A segmented Live / Test switch (its key
 * glides between the two) swaps the table; rows arrive and leave through
 * PresenceList. Creating a key asks for a name, a read / write scope per
 * resource and an expiry, then shows the secret exactly once: it decodes in
 * through ScrambleText, copies with a label that morphs to "Copied", and the
 * dialog closes only on "I've saved it". Rolling a key reveals its
 * replacement the same way; revoking asks for the key's name through
 * ConfirmDialog. Test starts empty. Until `onCreate`, `onRoll` and `onRevoke`
 * are wired to your API (which is what should mint the secret), demo stand-ins
 * run and warn once in development. Reduced motion: the switch,
 * rows and secret change in place.
 * Pass your own `brand`, `keys`, `resources` and `nav`, mint secrets in
 * `onCreate` and `onRoll`, revoke in `onRevoke`; every string is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page. */

const BRAND = { name: 'Ledger', logo: 'L/' }

interface ApiKeysProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** The environment shown when uncontrolled. Default 'live'. */
  defaultEnv?: Env
  /** The environment shown, controlled. Pair it with `onEnvChange`. */
  env?: Env
  /** Called with the environment the switch picks. */
  onEnvChange?: (env: Env) => void
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no top bar of its own. Default true; `false` draws its own page (the top bar and a centered canvas). */
  embedded?: boolean
  /** The product the keys are for, in the copy ("authenticate your server with …"). Default 'Ledger'. Prefer `brand`. */
  product?: string
  /** The product's name and mark: the top bar's brand and the name in the copy. Default: Ledger, with an "L/" mark. */
  brand?: { name: string; logo?: ReactNode }
  /** The title's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Formats relative times and counts. Default: the app's locale (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** The keys, both environments; the block keeps its own copy as keys are created, rolled and revoked. Default: the demo's four live keys. */
  keys?: ApiKey[]
  /** The resources a key can be granted read or write on. Default: Charges, Customers, Payouts, Webhooks. */
  resources?: string[]
  /** The expiry choices in the create dialog; `'never'` reads as no expiry. Default: never, 30 days, 90 days, a year. */
  expiries?: ApiKeyExpiry[]
  /** The top bar's links (standalone only). Default: the demo's five, on API keys. */
  nav?: ApiKeysNavLink[]
  /** "Now", for "last used" times and the unused count. Default: a fixed demo instant. */
  now?: Date | number
  /** Creates a key on your server and returns its full secret, which is shown once. Default: a demo wait and a random secret. */
  onCreate?: (key: ApiKeyDraft) => Promise<string> | string
  /** Rolls a key's secret on your server and returns the new one. Default: a demo random secret. */
  onRoll?: (key: ApiKey) => Promise<string> | string
  /** Revokes a key; resolve when it's gone, throw to show why it failed. Default: a short demo wait. */
  onRevoke?: (key: ApiKey) => Promise<unknown> | unknown
  /** Shows skeleton rows in place of the table while keys load. Default false. */
  loading?: boolean
  /** Replaces the empty state shown when an environment has no keys. */
  empty?: ReactNode
  /** A load failure, shown over the table with a Retry button when `onRetry` is set. */
  error?: ReactNode
  /** Called from the error's Retry button. */
  onRetry?: () => void
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<ApiKeysCopy>
  /** Whether the create-key dialog is open when uncontrolled; true opens it with the page. Default false. */
  defaultCreateOpen?: boolean
  /** Whether the create-key dialog is open, controlled. Pair it with `onCreateOpenChange`. */
  createOpen?: boolean
  /** Called with the create-key dialog's new open state. */
  onCreateOpenChange?: (open: boolean) => void
  /** Renders the top bar's links, e.g. Next.js `Link`. Default 'a'. */
  linkComponent?: ElementType
}

function ApiKeys({
  theme,
  defaultEnv = 'live',
  env: envProp,
  onEnvChange,
  defaultCreateOpen = false,
  createOpen: createOpenProp,
  onCreateOpenChange,
  embedded = true,
  product,
  brand: brandProp,
  headingLevel = 1,
  locale: localeProp,
  keys: initialKeys = KEYS,
  resources = RESOURCES,
  expiries = EXPIRY,
  nav = NAV,
  now: nowProp = NOW,
  onCreate,
  onRoll,
  onRevoke,
  loading = false,
  empty,
  error,
  onRetry,
  copy: copyProp,
  className,
  linkComponent = 'a',
  ...rest
}: ApiKeysProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const brand = brandProp ?? (product ? { ...BRAND, name: product } : BRAND)
  const now = +nowProp
  const Title = `h${headingLevel}` as const
  const [failure, setFailure] = useState<string>()
  const [ownEnv, setOwnEnv] = useState<Env>(defaultEnv)
  const env = envProp ?? ownEnv
  const setEnv = (next: Env) => {
    setOwnEnv(next)
    onEnvChange?.(next)
  }
  const [keys, setKeys] = useState(initialKeys)
  const [ownCreating, setOwnCreating] = useState(defaultCreateOpen)
  const creating = createOpenProp ?? ownCreating
  const setCreating = (next: boolean) => {
    setOwnCreating(next)
    onCreateOpenChange?.(next)
  }
  const [revoking, setRevoking] = useState<ApiKey>()
  const [rolled, setRolled] = useState<{ name: string; secret: string }>()
  const visible = keys.filter((key) => key.env === env)
  // Requests a day over the week, across the environment's keys.
  const daily = Array.from({ length: 7 }, (_, day) => visible.reduce((sum, key) => sum + (key.traffic[day] ?? 0), 0))
  const requests = daily.reduce((a, b) => a + b, 0)
  const stale = visible.filter((key) => key.lastUsed === null || now - key.lastUsed > 24 * HOUR).length
  const peak = Math.max(0, ...keys.flatMap((key) => key.traffic))
  const envLabel = env === 'live' ? copy.live : copy.test

  const controls = (
    <>
      <ToggleGroup variant="segmented" aria-label={copy.environment} value={[env]} onValueChange={(next: unknown[]) => next[0] && setEnv(next[0] as Env)} className="w-40">
        <ToggleGroupItem value="live">
          <span aria-hidden className="size-1.5 rounded-full bg-success" /> {copy.live}
        </ToggleGroupItem>
        <ToggleGroupItem value="test">
          <span aria-hidden className="size-1.5 rounded-full bg-warning" /> {copy.test}
        </ToggleGroupItem>
      </ToggleGroup>
      <Button onClick={() => setCreating(true)}>
        <PlusIcon size={14} /> {copy.createKey}
      </Button>
    </>
  )

  const content = (
    <>
      <StatGroup aria-label={copy.health} className="grid-cols-3 *:data-[slot=stat]:p-3 *:data-[slot=stat]:md:px-4">
        <Stat label={env === 'live' ? copy.liveKeys : copy.testKeys}>
          <StatValue size="sm" value={visible.length} locale={locale} />
          <StatNote className="truncate">{copy.active}</StatNote>
        </Stat>
        <Stat label={copy.requests}>
          <div className="flex items-end justify-between gap-3">
            <StatValue size="sm" value={requests} locale={locale} format={{ notation: 'compact', maximumFractionDigits: 1 }} />
            <StatBars data={daily} highlight={requests ? 6 : 'none'} className="mt-0 h-5 w-20 shrink-0 max-sm:hidden" />
          </div>
          <StatNote className="truncate">{copy.lastWeek}</StatNote>
        </Stat>
        <Stat label={copy.unused}>
          <StatValue size="sm" value={stale} locale={locale} />
          <StatNote className={stale ? 'truncate text-warning-text' : 'truncate'}>{copy.unusedNote}</StatNote>
        </Stat>
      </StatGroup>

      {(error || failure) && (
        <Alert variant="danger">
          <AlertTitle>{error ? copy.errorTitle : copy.failed}</AlertTitle>
          <AlertDescription>{error ?? failure}</AlertDescription>
          {error && onRetry && (
            <AlertAction>
              <Button size="sm" variant="outline" onClick={onRetry}>
                {copy.retry}
              </Button>
            </AlertAction>
          )}
        </Alert>
      )}

      <section aria-label={copy.keysRegion(envLabel)} className="overflow-hidden rounded-md border border-line bg-surface">
        <Reveal key={env} inView={false} variant="fade" duration="fast">
          {loading ? (
            <div role="status" aria-label={copy.loading} className="flex flex-col gap-3 p-4">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-8 w-full" />
              ))}
            </div>
          ) : visible.length > 0 ? (
            <KeysTable
              keys={visible}
              copy={copy}
              resources={resources}
              expiries={expiries}
              now={now}
              peak={peak}
              locale={locale}
              onRoll={async (key) => {
                setFailure(undefined)
                let value: string
                try {
                  value = onRoll ? await onRoll(key) : (await demo('ApiKeys: onRoll', 0), secret())
                } catch (failed) {
                  setFailure(failed instanceof Error && failed.message ? failed.message : copy.failed)
                  return
                }
                setKeys((list) => list.map((x) => (x.id === key.id ? { ...x, last4: value.slice(-4) } : x)))
                setRolled({ name: key.name, secret: value })
              }}
              onRevoke={setRevoking}
            />
          ) : (
            (empty ?? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <KeyIcon />
                  </EmptyMedia>
                  <EmptyTitle>{copy.emptyTitle(env)}</EmptyTitle>
                  <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => setCreating(true)}>
                    <PlusIcon size={14} /> {copy.emptyAction(env)}
                  </Button>
                </EmptyContent>
              </Empty>
            ))
          )}
        </Reveal>
      </section>

      <p className="flex items-center gap-2 text-ui-sm text-fg-muted">
        <ShieldIcon size={14} className="shrink-0" />
        {copy.footnote}
      </p>
    </>
  )
  const dialogs = (
    <>
      <CreateKeyDialog
        product={brand.name}
        copy={copy}
        resources={resources}
        expiries={expiries}
        mint={onCreate}
        env={env}
        open={creating}
        onOpenChange={setCreating}
        onCreate={(key) => setKeys((list) => [key, ...list])}
      />
      <RolledDialog product={brand.name} copy={copy} rolled={rolled} onClose={() => setRolled(undefined)} />
      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(next) => !next && setRevoking(undefined)}
        destructive
        title={copy.revokeTitle(revoking?.name ?? '')}
        description={copy.revokeDescription}
        confirmLabel={copy.revokeConfirm}
        challenge={revoking?.name}
        onConfirm={async () => {
          if (!revoking) return
          await (onRevoke ? onRevoke(revoking) : demo('ApiKeys: onRevoke', 700))
          const id = revoking.id
          setKeys((list) => list.filter((key) => key.id !== id))
        }}
      />
    </>
  )
  if (embedded) {
    const view = (
      <AppPage
        {...rest}
        title={copy.title}
        description={copy.description(brand.name)}
        actions={controls}
        headingLevel={headingLevel}
        width="fill"
        className={cn('text-fg', className)}
      >
        {content}
        {dialogs}
      </AppPage>
    )
    return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
  }
  return (
    <ThemeScope theme={theme}>
      <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
        <TopBar nav={nav} copy={copy} brand={brand} linkComponent={linkComponent} />
        <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 md:px-8 md:py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <Title className="text-xl font-semibold tracking-tight text-fg">{copy.title}</Title>
              <p className="text-ui text-fg-muted">{copy.description(brand.name)}</p>
            </div>
            <div className="flex items-center gap-2">{controls}</div>
          </div>
          {content}
        </main>
        {dialogs}
      </div>
    </ThemeScope>
  )
}

export {
  ApiKeys,
  type ApiKeysProps,
  type ApiKeysCopy,
  type ApiKey,
  type ApiKeyDraft,
  type ApiKeyExpiry,
  type ApiKeysNavLink,
  type Env as ApiKeyEnv,
  type Scopes as ApiKeyScopes,
}
