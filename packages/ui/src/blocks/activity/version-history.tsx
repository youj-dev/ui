'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { CircleAlertIcon, HistoryIcon, RotateCcwIcon } from '@youj/icons'
import { ConfirmDialog } from '../../components/ui/alert-dialog'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { Label } from '../../components/ui/label'
import { Skeleton } from '../../components/ui/skeleton'
import { Switch } from '../../components/ui/switch'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, listFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  DEMO_NOW,
  DEMO_USER,
  type VersionHistoryBlock,
  type VersionHistoryCopy,
  type VersionHistoryDoc,
  type VersionHistoryPerson,
  type VersionHistoryVersion,
} from './version-history/data'
import { changesOf, Preview, stopsIn } from './version-history/preview'
import { dateTime, toTime, useClock } from './version-history/time'
import { CompareBar, VersionName } from './version-history/toolbar'
import { useVersions } from './version-history/use-versions'
import { VersionList } from './version-history/versions'

/* A document's history, the way Google Docs and Notion keep it: versions by
 * day beside the document as it was, with what changed marked word by word
 * (a Myers diff: insertions on green, removals struck through on red) and
 * changed properties as before → after. Compare a version to the one before
 * it, to the current one, or to any named version; step through the changes
 * (Alt+↑ / Alt+↓); give a version a name; restore one (after asking: the
 * restore lands at the top as a new version, so nothing is lost). ↑ and ↓
 * in the list move between versions. Restores and names show at once and
 * settle through `onRestore` and `onRename`. Reduced motion: no smooth
 * scrolling to a change. */

interface VersionHistoryProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`. Default true; `false` draws its own page around it. */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (960px at 100% scale). Default false. */
  fill?: boolean
  /** Classes for its parts: `card` holds the block's size (560px tall at 100%; the version and the list scroll inside it, so picking a version or filtering the list never resizes it). */
  classNames?: { card?: string }
  headingLevel?: 1 | 2 | 3
  locale?: string
  copy?: Partial<VersionHistoryCopy>
  /** The versions, newest first. Default: a pricing page's copy over two days (a demo, marked). */
  versions?: VersionHistoryVersion[]
  /** Who restores and names versions here. Default: the demo's Jordan. */
  user?: VersionHistoryPerson
  /** The version on show, when your app owns it; pair with `onVersionChange`. */
  version?: string
  /** The version on show at first. Default: the newest. */
  defaultVersion?: string
  onVersionChange?: (versionId: string) => void
  /** Only named versions in the list at first. Default false. */
  defaultNamedOnly?: boolean
  now?: Date | number
  loading?: boolean
  error?: ReactNode
  onRetry?: () => void
  demoMarker?: boolean
  /** Restores a version. Resolve with the new version's fields (its `id`) to keep the one shown. */
  onRestore?: (versionId: string) => Promise<Partial<VersionHistoryVersion> | void> | Partial<VersionHistoryVersion> | void
  /** Names a version; an empty name removes it. */
  onRename?: (versionId: string, name: string) => Promise<unknown> | unknown
}

function VersionHistory({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  locale: localeProp,
  copy: copyProp,
  versions: versionsProp,
  user = DEMO_USER,
  version: versionProp,
  defaultVersion,
  onVersionChange,
  defaultNamedOnly = false,
  now: nowProp,
  loading = false,
  error,
  onRetry,
  demoMarker = true,
  onRestore,
  onRename,
  classNames,
  className,
  ...rest
}: VersionHistoryProps) {
  const locale = useLocale(localeProp ?? copyProp?.locale)
  const copy: VersionHistoryCopy = { ...DEFAULT_COPY, ...copyProp, locale }
  const k = useYouj()
  const id = useId()
  const preview = useRef<HTMLDivElement>(null)
  const { announce, announcer } = useAnnouncer()
  const simulated = versionsProp === undefined
  const { now, read } = useClock(nowProp !== undefined ? +nowProp : simulated ? DEMO_NOW : undefined)
  const history = useVersions({ versions: versionsProp, user, copy, read, onRestore, onRename })
  const [namedOnly, setNamedOnly] = useState(defaultNamedOnly)
  const [compareTo, setCompareTo] = useState('previous')
  const [showChanges, setShowChanges] = useState(true)
  const [stop, setStop] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [picked, setPicked] = useControllableState(versionProp, defaultVersion)
  const level = headingLevel ?? (embedded ? 2 : 1)
  const Title = (['h1', 'h2', 'h3'] as const)[level - 1]!
  const DocTitle = (['h2', 'h3', 'h4'] as const)[level - 1]!

  const all = history.versions
  const listed = namedOnly ? all.filter((v, i) => v.name || i === 0) : all
  const current = all[0]
  const selected = all.find((v) => v.id === picked) ?? current
  const select = (versionId: string) => {
    setPicked(versionId)
    setStop(0)
    onVersionChange?.(versionId)
  }
  const named = all.filter((v) => v.name && v.id !== selected?.id)
  const base: VersionHistoryDoc | null = useMemo(() => {
    if (!selected) return null
    if (compareTo === 'current') return selected === current ? null : (current?.doc ?? null)
    if (compareTo !== 'previous') return all.find((v) => v.id === compareTo)?.doc ?? null
    const pool = namedOnly ? listed : all
    return pool[pool.indexOf(selected) + 1]?.doc ?? null
  }, [selected, current, compareTo, all, listed, namedOnly])
  const changes = useMemo(() => (selected ? changesOf(selected.doc, showChanges ? base : null) : null), [selected, base, showChanges])
  const stops = changes ? stopsIn(changes) : 0

  const when = (version: VersionHistoryVersion) => dateTime(toTime(version.createdAt), locale, now === null)
  const step = (by: 1 | -1) => {
    if (!stops) return
    const next = ((stop - 1 + by + stops) % stops) + 1
    setStop(next)
    const target = preview.current?.querySelectorAll<HTMLElement>('[data-yj-change]')[next - 1]
    target?.focus({ preventScroll: true })
    target?.scrollIntoView?.({ block: 'center', behavior: k.reduced ? 'auto' : 'smooth' })
    announce(copy.changeOf(next, stops))
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (!event.altKey || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return
    event.preventDefault()
    step(event.key === 'ArrowDown' ? 1 : -1)
  }

  const options = [
    { value: 'previous', label: copy.previous },
    { value: 'current', label: copy.currentShort },
    ...named.map((v) => ({ value: v.id, label: v.name! })),
  ]

  const body = loading ? (
    <div role="status" aria-label={copy.loading} className="flex flex-col gap-3 px-(--card-spacing) py-6">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  ) : error || !selected || !changes ? (
    <Empty className="border-0 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">{error ? <CircleAlertIcon /> : <HistoryIcon />}</EmptyMedia>
        <EmptyTitle>{error ? copy.errorTitle : copy.emptyTitle}</EmptyTitle>
        <EmptyDescription>{error ?? copy.emptyDescription}</EmptyDescription>
      </EmptyHeader>
      {error && onRetry && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {copy.retry}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  ) : (
    // Side by side, the version and the list each scroll in the card's height; stacked, they scroll together.
    <div className="grid min-h-0 flex-1 overflow-y-auto yj-scrollbar @3xl:grid-cols-[minmax(0,1fr)_--spacing(72)] @3xl:grid-rows-[minmax(0,1fr)] @3xl:overflow-hidden">
      <div className="flex min-w-0 flex-col">
        <CompareBar
          copy={copy}
          options={options}
          compareTo={options.some((o) => o.value === compareTo) ? compareTo : 'previous'}
          onCompareTo={(next) => {
            setCompareTo(next)
            setStop(0)
          }}
          showChanges={showChanges}
          onShowChanges={(show) => {
            setShowChanges(show)
            setStop(0)
          }}
          stop={stop}
          stops={stops}
          onStep={step}
          switchId={`${id}-changes`}
        />
        <div
          ref={preview}
          className="flex flex-col gap-4 px-(--card-spacing) py-5 yj-scrollbar @3xl:min-h-0 @3xl:flex-1 @3xl:overflow-y-auto"
          aria-labelledby={`${id}-doc`}
        >
          <div className="flex flex-col gap-1">
            <DocTitle id={`${id}-doc`} className="text-ui-lg font-semibold tracking-tight text-fg">
              {selected.doc.title}
            </DocTitle>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ui-sm text-fg-muted">
              <VersionName
                version={selected}
                label={selected.name ?? when(selected)}
                copy={copy}
                onRename={(name) => void history.rename(selected, name).then((ok) => ok && announce(copy.announceRenamed(name)))}
              />
              {selected.name && <span>{when(selected)}</span>}
              <span aria-hidden>·</span>
              <span>{listFormat(locale, { type: 'conjunction' }).format(selected.authors.map((a) => a.name))}</span>
            </div>
          </div>
          <Preview changes={changes} copy={copy} headingLevel={level < 2 ? 3 : 4} />
        </div>
      </div>
      <aside aria-label={copy.versions} className="flex flex-col gap-3 border-t border-line bg-band p-3 @3xl:border-s @3xl:border-t-0">
        <div className="flex items-center justify-between gap-2 px-2 pt-1">
          <Label htmlFor={`${id}-named`} className="font-normal text-fg-muted">
            {copy.namedOnly}
          </Label>
          <Switch id={`${id}-named`} size="sm" checked={namedOnly} onCheckedChange={setNamedOnly} />
        </div>
        <VersionList
          versions={listed}
          current={current?.id}
          selected={selected.id}
          counts={history.counts}
          copy={copy}
          now={now}
          onSelect={select}
          className="yj-scrollbar @3xl:-mx-3 @3xl:min-h-0 @3xl:flex-1 @3xl:overflow-y-auto @3xl:px-3"
        />
      </aside>
    </div>
  )

  const card = (
    <Card
      className={cn(
        '@container h-140 w-full gap-0 overflow-clip pb-0',
        !embedded && !fill && 'max-w-240',
        !embedded && 'shadow-lg',
        classNames?.card,
      )}
    >
      <CardHeader className="border-b border-line">
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={`${id}-title`}>{copy.title}</Title>
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        {current && <CardDescription>{current.doc.title}</CardDescription>}
        <CardAction>
          <Button variant="outline" size="sm" disabled={!selected || selected === current || loading} onClick={() => setConfirming(true)}>
            <RotateCcwIcon size={14} />
            <span className="max-sm:sr-only">{copy.restore}</span>
          </Button>
        </CardAction>
      </CardHeader>
      {body}
      {history.failure && (
        <p role="alert" className="border-t border-line px-(--card-spacing) py-3 text-ui-sm text-danger-text">
          {history.failure}
        </p>
      )}
      {announcer}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={copy.restoreTitle}
        description={selected ? copy.restoreDescription(when(selected)) : ''}
        confirmLabel={copy.restoreConfirm}
        cancelLabel={copy.cancel}
        onConfirm={() => {
          if (!selected) return
          const from = selected
          void history.restore(from, select).then((ok) => ok && announce(copy.announceRestored(when(from))))
        }}
      />
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={`${id}-title`} onKeyDown={onKeyDown} {...rest} className={cn('w-full', !fill && 'max-w-240', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={`${id}-title`}
      onKeyDown={onKeyDown}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export {
  VersionHistory,
  type VersionHistoryProps,
  type VersionHistoryCopy,
  type VersionHistoryVersion,
  type VersionHistoryDoc,
  type VersionHistoryBlock,
  type VersionHistoryPerson,
}
