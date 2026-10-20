'use client'

import { useEffect, useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { Illustration, type IllustrationId, type IllustrationSlot } from '@youj/illustrations'
import { FolderIcon, GitBranchIcon, LockIcon, PlusIcon, SearchIcon, WifiIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card } from '../../components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { cn } from '../../lib/utils'

/* Four empty states an app always needs, each saying what isn't here, why,
 * and the one thing to do next: no projects yet, no results for a search, no
 * access to a page, and offline. Each opens on an isometric scene that
 * assembles as it comes into view (an open box, a lens over a match, a
 * vault, the cloud it syncs to); `illustration` swaps it for another scene
 * or your own picture, and `null` puts back the icon on its fanned plates,
 * which plays as its header is hovered. Actions that wait on a server run through
 * Button's onAction. Offline follows the browser's own online state and says
 * so as it changes. Use them one at a time; the gallery shows all four.
 * Every string is in `copy`; wire the buttons with the `on…` callbacks or
 * replace them with `actions`, and pass your router's Link as `linkComponent`.
 * The gallery is built for the compact layout density (ui.css), taken from the page.
 * Reduced motion: scenes finished and still, plates at rest, icons still. */

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

const DEFAULT_COPY = {
  galleryTitle: 'Empty states',
  galleryDescription: 'Nothing yet, nothing found, not allowed, not connected.',
  projectsTitle: 'No projects yet',
  projectsDescription: 'Projects hold your deployments, domains and environment variables. Start one from scratch or from a repository.',
  newProject: 'New project',
  importProject: 'Import from Git',
  resultsTitle: (query: string) => `No results for “${query}”`,
  resultsDescription: 'Check the spelling, try a broader term, or clear the filters to search everything.',
  clearFilters: 'Clear filters',
  accessTitle: 'You don’t have access',
  /** Before the switch link. */
  accessDescription: 'Billing is visible to workspace admins. Ask one for access, or ',
  switchWorkspace: 'switch workspace',
  /** After the switch link. */
  accessAfter: '.',
  requestAccess: 'Request access',
  requesting: 'Requesting…',
  requested: 'Request sent',
  requestFailed: 'Couldn’t send',
  offlineTitle: 'You’re offline',
  offlineDescription: 'Changes you make are saved on this device and sync when you reconnect.',
  retry: 'Try again',
  reconnecting: 'Reconnecting…',
  reconnected: 'Back online',
  stillOffline: 'Still offline',
  online: 'Your browser reports a connection.',
  waiting: 'Waiting for a connection…',
}

type EmptyStatesCopy = typeof DEFAULT_COPY

interface StateProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The picture over the state: a scene by id, your own node, or `null` for the icon. Default: a scene that fits the state. */
  illustration?: IllustrationSlot
  /** Any of the states' strings, to rewrite or translate. */
  copy?: Partial<EmptyStatesCopy>
  /** Replaces the state's buttons with your own. Default: the state's own action. */
  actions?: ReactNode
}

/** A state's picture: its scene, or the icon on its plates when the illustration is `null`. */
function Media({ illustration, fallback, icon }: Pick<StateProps, 'illustration'> & { fallback: IllustrationId; icon: ReactNode }) {
  if (illustration === null) return <EmptyMedia variant="icon">{icon}</EmptyMedia>
  return (
    <EmptyMedia className="mb-1">
      <Illustration scene={illustration} fallback={fallback} unit={15} />
    </EmptyMedia>
  )
}

interface NoProjectsProps extends StateProps {
  /** "New project". */
  onCreate?: () => void
  /** "Import from Git". */
  onImport?: () => void
}

function NoProjects({ onCreate, onImport, illustration, copy: copyProp, actions, ...rest }: NoProjectsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  return (
    <Empty {...rest}>
      <EmptyHeader>
        <Media illustration={illustration} fallback="empty" icon={<FolderIcon size={20} />} />
        <EmptyTitle>{copy.projectsTitle}</EmptyTitle>
        <EmptyDescription>{copy.projectsDescription}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {actions ?? (
          <>
            <Button onClick={onCreate}>
              <PlusIcon size={16} /> {copy.newProject}
            </Button>
            <Button variant="outline" onClick={onImport}>
              <GitBranchIcon size={16} /> {copy.importProject}
            </Button>
          </>
        )}
      </EmptyContent>
    </Empty>
  )
}

interface NoResultsProps extends StateProps {
  /** What was searched for. Default 'billing webhook'. */
  query?: string
  /** "Clear filters". */
  onClear?: () => void
}

function NoResults({ query = 'billing webhook', onClear, illustration, copy: copyProp, actions, ...rest }: NoResultsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  return (
    <Empty {...rest}>
      <EmptyHeader>
        <Media illustration={illustration} fallback="search" icon={<SearchIcon size={20} />} />
        <EmptyTitle>{copy.resultsTitle(query)}</EmptyTitle>
        <EmptyDescription>{copy.resultsDescription}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {actions ?? (
          <Button variant="outline" onClick={onClear}>
            {copy.clearFilters}
          </Button>
        )}
      </EmptyContent>
    </Empty>
  )
}

interface NoAccessProps extends StateProps {
  /** Asks for access; resolve when the request is sent. Default: a short demo wait. */
  onRequest?: () => unknown
  /** Where "switch workspace" goes. Default '#switch'. */
  switchHref?: string
  /** The element for the switch link, e.g. Next.js `Link`; it gets `href`. Default 'a'. */
  linkComponent?: ElementType
}

function NoAccess({ onRequest = () => demo('NoAccess: onRequest', 1000), switchHref = '#switch', linkComponent: Link = 'a', illustration, copy: copyProp, actions, ...rest }: NoAccessProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  return (
    <Empty {...rest}>
      <EmptyHeader>
        <Media illustration={illustration} fallback="security" icon={<LockIcon size={20} />} />
        <EmptyTitle>{copy.accessTitle}</EmptyTitle>
        <EmptyDescription>
          {copy.accessDescription}
          <Link href={switchHref}>{copy.switchWorkspace}</Link>
          {copy.accessAfter}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {actions ?? (
          <AsyncButton onAction={onRequest} pendingLabel={copy.requesting} successLabel={copy.requested} errorLabel={copy.requestFailed}>
            {copy.requestAccess}
          </AsyncButton>
        )}
      </EmptyContent>
    </Empty>
  )
}

function useOnline() {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

interface OfflineProps extends StateProps {
  /** Tries to reconnect; the button fails while the browser is still offline. Default: a short demo wait. */
  onRetry?: () => unknown
}

function Offline({ onRetry = () => demo('Offline: onRetry', 900), illustration, copy: copyProp, actions, ...rest }: OfflineProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const online = useOnline()
  return (
    <Empty {...rest}>
      <EmptyHeader>
        <Media illustration={illustration} fallback="cloud" icon={<WifiIcon size={20} />} />
        <EmptyTitle>{copy.offlineTitle}</EmptyTitle>
        <EmptyDescription>{copy.offlineDescription}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-col">
        {actions ?? (
          <AsyncButton
            variant="outline"
            pendingLabel={copy.reconnecting}
            successLabel={copy.reconnected}
            errorLabel={copy.stillOffline}
            onAction={async () => {
              await onRetry()
              if (!navigator.onLine) throw new Error('offline')
            }}
          >
            {copy.retry}
          </AsyncButton>
        )}
        <p role="status" className="text-ui-sm text-fg-muted">
          {online ? copy.online : copy.waiting}
        </p>
      </EmptyContent>
    </Empty>
  )
}

interface EmptyStatesProps
  extends Omit<StateProps, 'actions'>,
    Pick<NoProjectsProps, 'onCreate' | 'onImport'>,
    Pick<NoResultsProps, 'query' | 'onClear'>,
    Pick<NoAccessProps, 'onRequest' | 'switchHref' | 'linkComponent'>,
    Pick<OfflineProps, 'onRetry'> {
  /** The gallery title's level. Default 1. */
  headingLevel?: 1 | 2 | 3
}

/** All four states. `illustration` draws that one scene in every state instead of each one's own (what the docs' picker sets). */
function EmptyStates({ illustration, copy: copyProp, className, headingLevel = 1, onCreate, onImport, query, onClear, onRequest, switchHref, linkComponent, onRetry, ...rest }: EmptyStatesProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const Heading = `h${headingLevel}` as const
  return (
    <div {...rest} className={cn('min-h-dvh bg-canvas px-4 py-8 md:px-8 md:py-10', className)}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Heading className="text-2xl font-semibold tracking-tight text-fg">{copy.galleryTitle}</Heading>
          <p className="text-ui text-fg-muted">{copy.galleryDescription}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            <NoProjects key="p" illustration={illustration} copy={copy} onCreate={onCreate} onImport={onImport} />,
            <NoResults key="r" illustration={illustration} copy={copy} query={query} onClear={onClear} />,
            <NoAccess key="a" illustration={illustration} copy={copy} onRequest={onRequest} switchHref={switchHref} linkComponent={linkComponent} />,
            <Offline key="o" illustration={illustration} copy={copy} onRetry={onRetry} />,
          ].map((state) => (
            <Card key={state.key} className="min-h-80 justify-center py-0">
              {state}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export {
  EmptyStates,
  NoAccess,
  NoProjects,
  NoResults,
  Offline,
  type EmptyStatesCopy,
  type EmptyStatesProps,
  type NoAccessProps,
  type NoProjectsProps,
  type NoResultsProps,
  type OfflineProps,
}
