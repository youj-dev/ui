'use client'

import { type ComponentProps, useId, useState } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon, PowerIcon, RotateCcwIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { RolloutRuler, type RolloutStage } from '../../components/ui/rollout-ruler'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, ENVIRONMENTS, GUARDRAIL, ITEMS, demo, type StagedRolloutCopy, type StagedRolloutEnvironment, type StagedRolloutItem } from './staged-rollout/data'
import { ItemList } from './staged-rollout/item-list'

/* An item's staged rollout as an instrument (a feature flag in the demo; a
 * price variant or a firmware wave reads the same): the selected item's
 * share of its audience on a RolloutRuler cut into its stages (internal,
 * beta, 10%, 50%, GA by default), its playhead snapping gate to gate as you
 * drag it or step it with the keyboard, per environment. Under it, how many
 * that exposes, the watched rate against its guardrail, and the saved
 * state. The kill switch rolls the item back to 0% at once: the ruler
 * sweeps down, tick by tick, in the danger tone, and the switch becomes
 * Restore. Below, every item with a chip per environment and its own bare
 * ruler; pick one to steer it. Apply rollout runs on Button onAction; swap
 * the demo `wait` with `onApply`.
 * It is built for the compact layout density (ui.css), taken from the page; embedded
 * too, it stops at its natural width unless `fill`.
 * Reduced motion: the rulers take their values in place. */

interface StagedRolloutProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (736px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<StagedRolloutCopy>
  /** The items, as saved. Default: five demo flags. */
  items?: StagedRolloutItem[]
  /** The item shown first (its `key`). Default: the first. */
  defaultItem?: string
  /** Where items roll out, with the audience of each. Default: production, staging and development. */
  environments?: StagedRolloutEnvironment[]
  /** The environment shown first (its `id`). Default: the first. */
  defaultEnvironment?: string
  /** The gates on the ruler, with the share at each. Default: the ruler's own (internal, beta, 10%, 50%, GA). */
  stages?: RolloutStage[]
  /** The rate past which an item is failing, 0–1. Default 0.01. */
  guardrail?: number
  /** Saves a rollout; resolve when it's live. Default: a short demo wait. */
  onApply?: (item: StagedRolloutItem) => Promise<unknown> | unknown
  /** Called when the kill switch is thrown or restored, with the item as it now stands. */
  onStop?: (item: StagedRolloutItem, stopped: boolean) => void
  /** Formats counts and rates. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Writes the watched rate (a ratio, 0.0134) and the audience figures. Default: the locale's percent with two decimals, and its number format (compact for the whole audience). */
  format?: { rate?: (ratio: number) => string; audience?: (count: number) => string }
}


/* The ruler's label, stage names and figures in the text face and sentence
 * case (its slots), so the card reads as a release plan rather than a gauge. */
/** The record without `key`. */
const without = <T,>(record: Record<string, T>, key: string) => {
  const next = { ...record }
  delete next[key]
  return next
}

const SOFT_RULER = cn(
  '[&_:is([data-slot=rollout-ruler-label],[data-slot=rollout-ruler-stage],[data-slot=rollout-ruler-axis],[data-slot=rollout-ruler-value])]:font-sans',
  '[&_:is([data-slot=rollout-ruler-label],[data-slot=rollout-ruler-stage])]:tracking-normal [&_:is([data-slot=rollout-ruler-label],[data-slot=rollout-ruler-stage])]:normal-case',
  '[&_[data-slot=rollout-ruler-value]_span]:normal-case',
)

function StagedRollout({ theme, embedded = true, fill = false, copy: copyProp, items: initial = ITEMS, defaultItem, environments = ENVIRONMENTS, defaultEnvironment, stages, guardrail = GUARDRAIL, onApply, onStop, locale, format, className, ...rest }: StagedRolloutProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [items, setItems] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [selected, setSelected] = useState(defaultItem ?? initial[0]?.key ?? '')
  const [environmentId, setEnvironmentId] = useState(defaultEnvironment ?? environments[0]?.id ?? '')
  // A thrown kill switch, per item and environment, with the share to restore.
  const [stopped, setStopped] = useState<Record<string, number>>({})

  const environment = environments.find((e) => e.id === environmentId) ?? environments[0]
  const envId = environment?.id ?? ''
  const item = items.find((f) => f.key === selected) ?? items[0]
  const kept = saved.find((f) => f.key === item?.key)
  const stopKey = `${item?.key}:${envId}`
  const dead = stopKey in stopped
  const share = item?.rollout[envId] ?? 0
  const savedShare = kept?.rollout[envId] ?? 0
  const dirty = share !== savedShare

  const number = numberFormat(copy.locale)
  const compact = numberFormat(copy.locale, { notation: 'compact', maximumFractionDigits: 1 })
  const percentFormat = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 })
  const percent = (value: number) => percentFormat.format(value / 100)
  const rateFormat = numberFormat(copy.locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const rate = format?.rate ?? rateFormat.format
  const audience = environment?.audience ?? 0

  const setShare = (key: string, env: string, next: number, alsoSave = false) => {
    const update = (list: StagedRolloutItem[]) => list.map((f) => (f.key === key ? { ...f, rollout: { ...f.rollout, [env]: next } } : f))
    setItems(update)
    if (alsoSave) setSaved(update)
  }

  const kill = () => {
    if (!item) return
    if (dead) {
      const back = stopped[stopKey] ?? 0
      setShare(item.key, envId, back, true)
      setStopped((all) => without(all, stopKey))
      onStop?.({ ...item, rollout: { ...item.rollout, [envId]: back } }, false)
      return
    }
    setStopped((k) => ({ ...k, [stopKey]: savedShare || share }))
    setShare(item.key, envId, 0, true)
    announce(copy.stopped(item.key))
    onStop?.({ ...item, rollout: { ...item.rollout, [envId]: 0 } }, true)
  }

  const status = dead ? 'stopped' : share <= 0 ? 'off' : share >= 100 ? 'live' : 'rolling'
  const statusVariant = { stopped: 'danger', off: 'secondary', live: 'success', rolling: 'default' } as const
  const failing = (item?.rate ?? 0) > guardrail
  const [from, to = ''] = copy.unsaved.split('{from}')
  const [middle, end = ''] = to.split('{to}')

  const stats = [
    { label: copy.exposed, value: (format?.audience ?? number.format)(Math.round((audience * share) / 100)), note: `/ ${(format?.audience ?? compact.format)(audience)}`, tone: '' },
    { label: copy.rate, value: rate(item?.rate ?? 0), note: copy.guardrail(rate(guardrail)), tone: failing ? 'text-warning-text' : '' },
  ]

  const card = (
    <Card className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-184')}>
      <CardHeader className="border-b border-line py-[calc(var(--card-spacing)-var(--spacing))]">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{item?.key}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => item && navigator.clipboard?.writeText(item.key)}>{copy.copyKey}</DropdownMenuItem>
              <DropdownMenuItem>{copy.auditLog}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 py-(--card-spacing)">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="truncate text-ui-lg font-medium">{item?.name}</span>
            <Badge variant={statusVariant[status]}>
              <BadgeDot />
              {copy.status[status]}
            </Badge>
          </div>
          <SegmentedControl aria-label={copy.environment} size="sm" value={envId} onValueChange={(next) => next && setEnvironmentId(next)}>
            {environments.map((env) => (
              <SegmentedControlItem key={env.id} value={env.id} className="px-2.5">
                {env.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
        {item && (
          <RolloutRuler
            key={item.key}
            label={copy.ruler}
            className={SOFT_RULER}
            stages={stages}
            value={share}
            tone={dead ? 'danger' : 'accent'}
            locale={copy.locale}
            onValueChange={(next) => {
              setShare(item.key, envId, next)
              if (dead && next > 0) setStopped((all) => without(all, stopKey))
            }}
          />
        )}
        <dl className="grid grid-cols-2 gap-x-8 border-t border-line-subtle pt-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col gap-1">
              <dt className="truncate text-ui-sm text-fg-muted">{stat.label}</dt>
              <dd className="flex min-w-0 items-baseline gap-2 tabular-nums">
                <span className={cn('text-ui-lg font-medium', stat.tone || 'text-fg')}>{stat.value}</span>
                <span className="truncate text-ui-sm text-fg-muted">{stat.note}</span>
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>

      <CardContent className="border-t border-line px-0 py-0">
        <div className="flex items-baseline justify-between gap-4 px-(--ui--panel-x) pt-4 pb-2">
          <span className="text-ui-sm text-fg-muted">{copy.items}</span>
          <span className="text-ui-sm text-fg-muted tabular-nums">{copy.itemCount(items.length, items.filter((f) => (f.rollout[envId] ?? 0) > 0 && (f.rollout[envId] ?? 0) < 100).length)}</span>
        </div>
        {environment && (
          <ItemList
            items={items}
            selected={item?.key ?? ''}
            environments={environments}
            environment={environment}
            stopped={Object.keys(stopped)
              .filter((k) => k.endsWith(`:${envId}`))
              .map((k) => k.slice(0, -envId.length - 1))}
            stages={stages}
            copy={copy}
            percent={percent}
            onSelect={setSelected}
          />
        )}
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3 py-[calc(var(--card-spacing)-var(--spacing))]">
        <span className={cn('text-ui-sm tabular-nums', dirty ? 'text-accent-text' : 'text-fg-muted')}>
          {dirty ? (
            <>
              {from}
              {percent(savedShare)}
              {middle}
              {percent(share)}
              {end}
            </>
          ) : (
            `${copy.saved} · ${percent(share)}`
          )}
        </span>
        <div className="flex flex-1 justify-end gap-2">
          <Button variant={dead ? 'secondary' : 'outline'} className={cn(!dead && 'border-danger-line text-danger-text hover:text-danger-text')} onClick={kill} disabled={!dead && share <= 0 && savedShare <= 0}>
            {dead ? <RotateCcwIcon size={14} /> : <PowerIcon size={14} />}
            {dead ? copy.restore(percent(stopped[stopKey] ?? 0)) : copy.stop}
          </Button>
          <AsyncButton
            disabled={!dirty}
            pendingLabel={copy.applying}
            successLabel={copy.applied}
            onAction={async () => {
              if (!item) return
              await (onApply ? onApply(item) : demo('StagedRollout: onApply', 900))
              setSaved((list) => list.map((f) => (f.key === item.key ? item : f)))
            }}
          >
            {copy.apply}
          </AsyncButton>
        </div>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-184', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { StagedRollout, type StagedRolloutProps }
export type { StagedRolloutCopy, StagedRolloutEnvironment, StagedRolloutItem }
