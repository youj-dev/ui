'use client'

import { useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { PlayIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Stat, StatBars, StatGroup, StatMeter, StatNote, StatValue } from '../../components/ui/stat-card'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { FlowCanvas } from './queue-flow/canvas'
import {
  BEAT_SECONDS,
  DEFAULT_COPY,
  demo,
  LENSES,
  NODES,
  OVER_TARGET,
  ROUTES,
  TARGET_MINUTES,
  opening,
  routeKey,
  seeded,
  step,
  totals,
  type QueueFlowNode,
  type QueueFlowRoute,
  type QueueFlowDesk,
  type QueueFlowHealth,
  type QueueFlowLens,
  type QueueFlowLensId,
  type QueueFlowCopy,
} from './queue-flow/data'
import { Inspector } from './queue-flow/inspector'
import { dotsFor, type RouteTone } from './queue-flow/items'
import { useVisible } from '../../hooks/use-visible'

/* A support desk, live: channels on the left, triage in the middle, teams on
 * the right, with tickets riding the routes between them (as many as each
 * route's volume earns). Every two seconds a new reading lands: the figures
 * above roll to it, each step's own figure follows the lens you pick
 * (volume, reply time or spam), and a team's queue shows at its card's foot;
 * past its target it turns the route in amber and slows its tickets, and
 * past nine tenths triage holds back what it sends. What the assistant flags
 * takes the red route to the spam folder. Pick a step (click, or arrows along
 * the flow) to inspect it; add agents to a team over target, or empty the
 * spam. Pause holds the readings and the tickets; both also stop off screen
 * and in a hidden tab. Without `desk` the readings are a simulated demo,
 * under a "Demo data" badge; pass your help desk's figures as `desk`
 * (re-rendered as they change) and wire `onStaff` and `onPurge` to your API. Reduced
 * motion: the tickets stand still along their routes, figures change in
 * place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded, it keeps its natural width unless `fill`. */

interface QueueFlowProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1024px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<QueueFlowCopy>
  /** Formats numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What each step's figure can show, in the picker's order: the three readings (`volume`, `reply`, `rejected`) under your labels. Default: Volume, Reply time, Spam. */
  lenses?: QueueFlowLens[]
  /** The first reply the desk promises, p95, in minutes. Default 60. */
  target?: number
  /** Writes a duration in minutes and a count of items. Default: the locale's minutes and its compact number format. */
  format?: { time?: (minutes: number) => string; count?: (n: number) => string }
  /** The steps, each in a column (layer) and row (lane). Default: three channels, triage and an assistant, two teams and spam. */
  nodes?: QueueFlowNode[]
  routes?: QueueFlowRoute[]
  /** Your desk's figures now: each step's stats, tickets an hour per route (`from>to`), the spam folder and agents per team. Pass it, re-rendered as they change, to show your desk. Default: none (the demo simulates the tickets). */
  desk?: QueueFlowDesk
  /** Shows a dashed "Demo data" badge while the readings are simulated (no `desk` passed). Default true. */
  demoMarker?: boolean
  /** Staffs a team with this many agents; resolve when it's done. Default: a short demo wait. */
  onStaff?: (node: QueueFlowNode, agents: number) => Promise<unknown> | unknown
  /** Deletes the tickets held as spam; resolve when they're gone. Default: a short demo wait. */
  onPurge?: () => Promise<unknown> | unknown
}

function QueueFlow({ theme, embedded = true, fill = false, copy: copyProp, locale, lenses = LENSES, target = TARGET_MINUTES, format: formatProp, nodes = NODES, routes = ROUTES, desk, onStaff, onPurge, demoMarker = true, className, ...rest }: QueueFlowProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const k = useYouj()
  const titleId = useId()
  const inspectorId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const [first] = useState(() => opening(nodes, routes))
  // Without your desk's figures the readings are simulated, and marked as such.
  const simulated = desk === undefined
  const [played, setState] = useState(first)
  const state = desk ?? played
  const [lens, setLens] = useState<QueueFlowLensId>(lenses[0]?.id ?? 'volume')
  const [paused, setPaused] = useState(false)
  const running = visible && !paused
  const random = useRef<() => number>(null)

  // The step in the most trouble is where the eye starts.
  const [selected, setSelected] = useState(() => [...nodes].sort((a, b) => fillOf(b, first) - fillOf(a, first))[0]?.id ?? '')
  const node = nodes.find((n) => n.id === selected) ?? nodes[0]

  useEffect(() => {
    if (!running || !simulated) return
    random.current ??= seeded(first.beat)
    const beat = setInterval(() => setState((s) => step(s, nodes, routes, random.current!)), BEAT_SECONDS * 1000 * k.timeScale)
    return () => clearInterval(beat)
  }, [running, simulated, nodes, routes, first.beat, k.timeScale])

  const format = useMemo(() => {
    const compact = numberFormat(copy.locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    })
    const whole = numberFormat(copy.locale, {
      maximumFractionDigits: 0,
    })
    const minutes = numberFormat(copy.locale, {
      style: 'unit',
      unit: 'minute',
      maximumFractionDigits: 0,
    })
    const percent = numberFormat(copy.locale, {
      style: 'percent',
      maximumFractionDigits: 0,
    })
    const count = formatProp?.count ?? ((n: number) => (n >= 10000 ? compact.format(n) : whole.format(n)))
    return {
      rate: (n: number) => `${formatProp?.count ? count(n) : (n >= 10000 ? compact : whole).format(n)}${copy.perHour}`,
      count,
      time: formatProp?.time ?? minutes.format,
      percent: percent.format,
    }
  }, [copy.locale, copy.perHour, formatProp?.count, formatProp?.time])
  const fine = useMemo(
    () =>
      numberFormat(copy.locale, {
        style: 'percent',
        maximumFractionDigits: 2,
      }),
    [copy.locale],
  )

  // Say when a team goes over target or gets back on it; nothing else about a reading is news.
  const health = useRef<Record<string, QueueFlowHealth>>({})
  useEffect(() => {
    for (const n of nodes) {
      const now = state.nodes[n.id]
      const was = health.current[n.id]
      if (!now || !n.limit) continue
      if (was && was !== 'over' && now.health === 'over') announce(copy.overTarget(n.label, format.percent(now.waiting / n.limit)))
      if (was === 'over' && now.health === 'ok') announce(copy.backOnTarget(n.label))
    }
    health.current = Object.fromEntries(nodes.map((n) => [n.id, state.nodes[n.id]?.health ?? 'ok']))
  // eslint-disable-next-line react-hooks/exhaustive-deps -- speaks when the simulation moves; the rest is read at that moment
  }, [state])

  // Dots per route come from the opening volumes, so the drawing holds still; the live volumes set their pace.
  const counts = useMemo(() => Object.fromEntries(routes.map((r) => [routeKey(r), dotsFor(first.routes[routeKey(r)] ?? 0)])), [routes, first])
  const tones: Record<string, RouteTone> = {}
  const paces: Record<string, number> = {}
  for (const r of routes) {
    const key = routeKey(r)
    const into = state.nodes[r.to]?.health
    const held = state.nodes[r.from]?.health === 'holding'
    tones[key] = r.reject ? 'sink' : into === 'over' ? 'slow' : 'flow'
    const base = first.routes[key] || 1
    const pace = Math.min(1.3, Math.max(0.75, (state.routes[key] ?? base) / base))
    paces[key] = Math.round(pace * (tones[key] === 'slow' ? 0.45 : held ? 0.6 : 1) * 100) / 100
  }

  const t = totals(state, nodes, routes)
  const worst = t.worst && t.worst.fill > 0.005 ? t.worst : null
  const figure = (n: QueueFlowNode) => {
    const s = state.nodes[n.id]
    if (!s) return '–'
    if (lens === 'reply') return format.time(s.reply)
    if (lens === 'rejected') return routes.some((r) => r.reject && r.to === n.id) ? format.count(state.held) : format.rate(s.rejected)
    return format.rate(n.layer === 2 ? s.in : s.out)
  }

  const staff = async (team: QueueFlowNode, people: number) => {
    await (onStaff ? onStaff(team, people) : demo('QueueFlow: onStaff', 900))
    setState((s) => ({
      ...s,
      staff: { ...s.staff, [team.id]: people },
    }))
    announce(copy.staffed(team.label, people))
  }
  const purge = async () => {
    const count = format.count(state.held)
    await (onPurge ? onPurge() : demo('QueueFlow: onPurge', 900))
    setState((s) => ({ ...s, held: 0 }))
    announce(copy.purged(count))
  }
  const togglePause = () => {
    setPaused((p) => !p)
    announce(paused ? copy.deskResumed : copy.deskPaused)
  }

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-5xl')}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{copy.title}</Title>
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction className="flex items-center gap-2">
          {/* shape: the live badge's text takes the success text colour; the control's own padding or case sits on a more specific selector than a className, so `!` wins; kept because moving it into the recipe layer must not change what shows */}
          <Badge variant={paused ? 'secondary' : 'success'} className={cn('gap-1.5', !paused && 'text-success-text!')}>
            <BadgeDot />
            {paused ? copy.paused : copy.live}
          </Badge>
          <Button variant="ghost" size="icon-sm" aria-label={paused ? copy.resume : copy.pause} onClick={togglePause}>
            <PlayIcon size={15} active={!paused} />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <StatGroup aria-label={copy.overview} className="grid-cols-2 lg:grid-cols-4">
          <Stat label={copy.volume}>
            <Figure value={Math.round(t.volume)} intl={{ notation: 'compact', maximumFractionDigits: 1 }} custom={formatProp?.count} unit={<bdi>{copy.perHour}</bdi>} locale={copy.locale} />
            <StatBars data={t.history} />
          </Stat>
          <Stat label={copy.reply}>
            <Figure
              value={Math.round(t.reply)}
              intl={{
                style: 'unit',
                unit: 'minute',
                maximumFractionDigits: 0,
              }}
              custom={formatProp?.time}
              locale={copy.locale}
            />
            <StatMeter
              value={t.reply}
              max={target}
              tone={t.reply > target ? 'danger' : t.reply > target * 0.8 ? 'warning' : 'accent'}
              locale={copy.locale}
            >
              {copy.ofTarget(format.time(target))}
            </StatMeter>
          </Stat>
          <Stat label={copy.waiting}>
            <Figure value={Math.round(t.waiting)} intl={{ notation: 'compact', maximumFractionDigits: 1 }} custom={formatProp?.count} locale={copy.locale} />
            {worst ? (
              <StatMeter value={worst.fill} max={1} tone={worst.fill >= OVER_TARGET ? 'warning' : 'neutral'} locale={copy.locale}>
                {copy.deepest(nodes.find((n) => n.id === worst.id)?.label ?? worst.id)}
              </StatMeter>
            ) : (
              <StatNote>{copy.noneWaiting}</StatNote>
            )}
          </Stat>
          <Stat label={copy.sink}>
            <Figure value={Math.round(state.held)} custom={formatProp?.count} locale={copy.locale} />
            <StatNote className={cn(state.held > 0 && 'text-danger-text')}>{copy.rejectedShare(fine.format(t.share))}</StatNote>
          </Stat>
        </StatGroup>
      </CardContent>

      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-sm text-fg-muted">
            {(['flowing', 'slowed', 'sink'] as const).map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <span aria-hidden className={cn('size-1.5 rounded-full', item === 'flowing' ? 'bg-fg' : item === 'slowed' ? 'bg-warning' : 'bg-danger')} />
                {copy.legend[item]}
              </li>
            ))}
          </ul>
          <SegmentedControl aria-label={copy.lens} value={lens} onValueChange={(v) => setLens(v as QueueFlowLensId)}>
            {lenses.map((l) => (
              <SegmentedControlItem key={l.id} value={l.id} className="px-3">
                {l.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
        <FlowCanvas
          nodes={nodes}
          routes={routes}
          state={state}
          selected={node?.id ?? ''}
          onSelect={setSelected}
          figure={figure}
          copy={copy}
          controls={inspectorId}
          counts={counts}
          paces={paces}
          tones={tones}
          running={running && !k.reduced}
        />
        <table className="sr-only">
          <caption>{copy.table}</caption>
          <thead>
            <tr>
              <th scope="col">{copy.from}</th>
              <th scope="col">{copy.to}</th>
              <th scope="col">{copy.rate}</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={routeKey(r)}>
                <td>{nodes.find((n) => n.id === r.from)?.label}</td>
                <td>{nodes.find((n) => n.id === r.to)?.label}</td>
                <td>{format.rate(state.routes[routeKey(r)] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>

      <CardContent className="border-t border-line pt-(--card-spacing)">
        {node && <Inspector id={inspectorId} node={node} nodes={nodes} routes={routes} state={state} copy={copy} format={format} replyLabel={lenses.find((l) => l.id === 'reply')?.label ?? LENSES[1]!.label} onStaff={staff} onPurge={purge} embedded={embedded} />}
      </CardContent>

      <CardFooter className="justify-between">
        <span className="text-ui-sm text-fg-muted">{copy.updated}</span>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-5xl', className)}>
      {card}
    </section>
  ) : (
    <main
      ref={root}
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

/** A stat tile's figure: it rolls in the locale's format, or shows what your own formatter writes. */
function Figure({ value, intl, custom, unit, locale }: { value: number; intl?: Intl.NumberFormatOptions; custom?: (n: number) => string; unit?: ReactNode; locale: string }) {
  if (!custom) return <StatValue value={value} format={intl} unit={unit} locale={locale} />
  return (
    <span data-slot="stat-value" className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-2xl leading-[1.1] font-semibold tracking-tight text-fg tabular-nums">
      {custom(value)}
      {unit != null && <span className="text-[0.5em] font-normal tracking-normal text-fg-muted">{unit}</span>}
    </span>
  )
}

/** How full a step's queue is, 0–1. */
function fillOf(node: QueueFlowNode, state: ReturnType<typeof opening>) {
  return node.limit ? (state.nodes[node.id]?.waiting ?? 0) / node.limit : 0
}

export { QueueFlow, type QueueFlowProps }
export type { QueueFlowCopy, QueueFlowDesk, QueueFlowHealth, QueueFlowLens, QueueFlowLensId, QueueFlowNode, QueueFlowRoute }
