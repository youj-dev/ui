'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { useInView } from 'motion/react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import {
  BACKUP,
  CHECKS,
  DEFAULT_COPY,
  fill,
  PRIMARY,
  INTERVAL,
  LOAD,
  RECOVERED,
  RESTORED,
  SCRIPT,
  START,
  SIGNAL_MIN,
  type SwitchoverCopy,
  type SwitchoverSource,
} from './switchover/data'
import { Rig } from './switchover/rig'
import { SourceColumn } from './switchover/sources'
import { Timeline, type SwitchoverEvent } from './switchover/timeline'

/* A switchover from a primary source to its backup, told live (a home riding
 * through a power cut, a database failing over, an uplink falling back to
 * mobile). The default rig shows the home's
 * panel with the grid on one side and the battery and solar on the other,
 * every line cut into eight strands that light with the share of the load
 * they carry. Simulate outage runs it a grid check per beat: the voltage
 * sags, the grid fails three checks in a row and is marked out, then the
 * load moves a quarter at a time onto the backup (strands go dark on one
 * line and light on the other, the transformers and battery packs follow)
 * while the battery's reserve ticks down; later the grid holds steady again
 * and Switch back walks the load home. Under the rig each source's
 * kilowatts roll and its checks run as cells; beside it the timeline logs
 * every step with its time, under a rail of the four stages, and each step
 * is announced. It holds while it's off screen or the tab is hidden. Swap
 * the demo for your inverter's API with `onSimulate` and `onSwitchBack`.
 * Reduced motion: no pulses or pings, everything else changes in place.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface SwitchoverProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1024px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<SwitchoverCopy>
  /** The source carrying the home first. Default: the grid. */
  primary?: SwitchoverSource
  /** The standby. Default: the battery with rooftop solar. */
  backup?: SwitchoverSource
  /** Open part-way through, at this step of the script (0 steady, 4 grid out, 6 load split evenly, 10 grid back). Default 0. */
  start?: number
  /** Run the outage on its own once the card is on screen. Default false. */
  autoPlay?: boolean
  /** Called when Simulate outage is pressed, before the outage runs. */
  onSimulate?: () => void
  /** Starts the switch back; resolve when your inverter accepts it. Default: at once. */
  onSwitchBack?: () => Promise<unknown> | unknown
  /** Formats shares and loads. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What the site draws, in the unit of `copy.unit`; the two sources split it. Default 4.8. */
  load?: number
  /** How the loads are written: Intl.NumberFormat options for `power`. Default: one decimal. */
  format?: { power?: Intl.NumberFormatOptions }
  /** Replaces the drawing of the home's panel above the sources (a diagram of your own, or `null` for none). Default: the panel with the grid, battery and solar. */
  illustration?: ReactNode
}

type Mode = 'idle' | 'outage' | 'return'

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

/* The block's few rules utilities can't express. Every duration is a token
 * (Speed reaches it) and `--yj-motion` zeroes the one-shot entrances under
 * reduced motion; the ping loops stop on [data-paused] and reduced motion. */
const CSS = `
.ke-lit { transition: opacity calc(var(--yj-duration-slow) * var(--yj-motion, 1)) var(--ease-standard); transition-delay: calc(var(--ke-rank) * var(--yj-duration-instant) * 0.5 * var(--yj-motion, 1)); }
.ke-ping { transform-box: fill-box; transform-origin: center; animation: ke-ping calc(var(--yj-duration-deliberate) * 2.6) var(--ease-exit) infinite; }
.ke-rig[data-paused] .ke-ping { animation-play-state: paused; }
[data-reduced-motion] .ke-ping { animation: none; opacity: 0.5; transform: scale(1.6); }
.ke-check:last-child { transform-origin: bottom; animation: ke-pop calc(var(--yj-duration-base) * var(--yj-motion, 1)) var(--ease-enter) backwards; }
.ke-event { animation: ke-rise calc(var(--yj-duration-slow) * var(--yj-motion, 1)) var(--ease-enter) backwards; }
@keyframes ke-ping { from { transform: scale(1); opacity: 0.7; } to { transform: scale(2.6); opacity: 0; } }
@keyframes ke-pop { from { opacity: 0; transform: scaleY(0.2); } }
@keyframes ke-rise { from { opacity: 0; transform: translateY(6px); } }
`

/** The page is showing: the outage holds in a hidden tab. */
function usePageVisible() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return visible
}

function Switchover({
  theme,
  embedded = true,
  fill: fillWidth = false,
  copy: copyProp,
  primary = PRIMARY,
  backup = BACKUP,
  start = 0,
  autoPlay = false,
  onSimulate,
  onSwitchBack,
  locale,
  format,
  load = LOAD,
  illustration,
  className,
  ...rest
}: SwitchoverProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const k = useYouj()
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const rigRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rigRef, { amount: 0.2 })
  const visible = usePageVisible()
  const opening = Math.min(Math.max(0, Math.round(start)), RESTORED)

  // The log and the checks up to `opening`, as if the outage had run there.
  const [initial] = useState(() => {
    const events: SwitchoverEvent[] = []
    const checks = { primary: [] as { id: number; ok: boolean }[], backup: [] as { id: number; ok: boolean }[] }
    for (let i = 0; i < CHECKS; i++) {
      const ok = opening - (CHECKS - 1 - i) <= 0 ? true : SCRIPT[opening - (CHECKS - 1 - i)]!.check
      checks.primary.push({ id: i, ok })
      checks.backup.push({ id: i, ok: true })
    }
    for (let s = 1; s <= opening; s++) {
      const e = SCRIPT[s]!.event
      if (e) events.push({ id: s, time: START + s * INTERVAL, text: fill(copy.events[e.key], primary, backup), tone: e.tone })
    }
    return { events, checks }
  })
  const [at, setAt] = useState(opening)
  const [mode, setMode] = useState<Mode>(
    opening > 0 && opening < RECOVERED ? 'outage' : opening > RECOVERED && opening < RESTORED ? 'return' : 'idle',
  )
  const [events, setEvents] = useState(initial.events)
  const [checks, setChecks] = useState(initial.checks)
  const [now, setNow] = useState(START + opening * INTERVAL)
  const [began, setBegan] = useState<number | null>(opening > 0 ? START : null)
  const seq = useRef(1000)
  const settle = useRef<(() => void) | null>(null)
  const running = inView && visible

  // One step a beat while a run is under way and the card is showing.
  useEffect(() => {
    if (mode === 'idle' || !running) return
    const id = setTimeout(() => {
      const next = at + 1
      const step = SCRIPT[next]!
      const time = now + INTERVAL
      setAt(next)
      setNow(time)
      setChecks((c) => ({
        primary: [...c.primary, { id: seq.current++, ok: step.check }].slice(-CHECKS),
        backup: [...c.backup, { id: seq.current++, ok: true }].slice(-CHECKS),
      }))
      if (step.event) {
        const text = fill(copy.events[step.event.key], primary, backup)
        setEvents((list) => [...list, { id: seq.current++, time, text, tone: step.event!.tone }])
        announce(text)
      }
      if ((mode === 'outage' && next === RECOVERED) || (mode === 'return' && next === RESTORED)) {
        setMode('idle')
        settle.current?.()
        settle.current = null
      }
    }, k.ms('deliberate') * 2.2)
    return () => clearTimeout(id)
  }, [mode, running, at, now, k, copy.events, primary, backup, announce])

  const simulate = () => {
    onSimulate?.()
    const text = fill(copy.started, primary, backup)
    setEvents((list) => [...list, { id: seq.current++, time: now, text, tone: 'neutral' }])
    announce(text)
    setBegan(now)
    setAt(0)
    setMode('outage')
  }

  // Autoplay: the outage starts itself the first time the card is on screen, from steady.
  const played = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: plays once, when autoPlay and running first allow it (played guards a second start); simulate, at and mode are read at that moment
  useEffect(() => {
    if (!autoPlay || played.current || !running || at !== 0 || mode !== 'idle') return
    played.current = true
    const id = setTimeout(simulate, k.ms('deliberate') * 2)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- plays once, when autoPlay and running first allow it (played guards a second start); simulate, at and mode are read at that moment
  }, [autoPlay, running])

  const switchBack = async () => {
    await onSwitchBack?.()
    await new Promise<void>((resolve) => {
      settle.current = resolve
      setMode('return')
    })
  }

  const percent = useMemo(() => numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 0 }).format, [copy.locale])
  const powerFormat = useMemo(() => ({ minimumFractionDigits: 1, maximumFractionDigits: 1, ...format?.power }), [format?.power])
  const kw = useMemo(() => numberFormat(copy.locale, powerFormat).format, [copy.locale, powerFormat])
  const whole = useMemo(() => numberFormat(copy.locale, { maximumFractionDigits: 0 }).format, [copy.locale])

  const step = SCRIPT[at]!
  const idle = at === 0 || at === RESTORED
  const status = idle
    ? { text: copy.status.steady(primary.id), variant: 'success' as const }
    : at <= 3
      ? { text: copy.status.degraded(primary.id), variant: 'warning' as const }
      : at <= 7
        ? { text: copy.status.switching, variant: 'warning' as const }
        : at < RECOVERED
          ? { text: copy.status.backup(backup.id), variant: 'default' as const }
          : at === RECOVERED
            ? { text: copy.status.ready(primary.id), variant: 'default' as const }
            : { text: copy.status.switchingBack, variant: 'warning' as const }
  const onGrid = Math.round(step.weight * load * 10) / 10

  const card = (
    <Card className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fillWidth && 'max-w-256')}>
      <CardHeader className="border-b border-line py-4">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle(copy.site)}</CardDescription>
        <CardAction className="flex items-center gap-1.5">
          {/* A phrase, not a label: it keeps its case in a theme that sets badges in capitals. On a phone it moves into the rig's head, clear of the title. */}
          {/* shape: a status badge reads in sentence case, so `!` turns off the badge's uppercase and tracking */}
          <Badge variant={status.variant} className="tracking-normal! normal-case! max-sm:hidden">
            <BadgeDot />
            {status.text}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>{copy.openSettings}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="grid px-0 py-0 lg:grid-cols-[minmax(0,1fr)_--spacing(80)]">
        <div className="flex min-w-0 flex-col">
          <div
            ref={rigRef}
            className="m-3 flex min-w-0 flex-col gap-1 rounded-[calc(min(var(--radius-xl),var(--ui--panel-radius-max))-var(--spacing))] bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))] px-3 pt-2.5 pb-2 sm:m-4 sm:px-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              {/* shape: a status badge reads in sentence case, so `!` turns off the badge's uppercase and tracking */}
              <Badge variant={status.variant} className="tracking-normal! normal-case! sm:hidden">
                <BadgeDot />
                {status.text}
              </Badge>
              <p className="flex items-baseline gap-2">
                <Eyebrow className={VOICE}>{copy.split}</Eyebrow>
                <span className="font-mono text-ui-sm text-fg tabular-nums">
                  {copy.loadSplit(kw(onGrid), kw(Math.round((load - onGrid) * 10) / 10))}
                </span>
              </p>
              <dl className="flex items-baseline gap-4 font-mono text-ui-sm tabular-nums">
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-fg-muted">{copy.signal}</dt>
                  <dd className={cn(step.signal === 0 ? 'text-danger-text' : step.signal < SIGNAL_MIN ? 'text-warning-text' : 'text-fg')}>
                    {copy.signalValue(whole(step.signal))}
                  </dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-fg-muted">{copy.reserve}</dt>
                  <dd className="text-fg">{percent(step.reserve)}</dd>
                </div>
              </dl>
            </div>
            {illustration === undefined ? <Rig weight={step.weight} grid={step.health} running={running} title={copy.rig} /> : illustration}
          </div>
          <div className="grid gap-6 px-(--ui--panel-x) pt-1 pb-(--ui--panel-y) sm:grid-cols-2">
            <SourceColumn
              source={primary}
              role="primary"
              health={step.health}
              share={step.weight}
              load={load}
              checks={checks.primary}
              failed={Math.min(3, step.failed)}
              copy={copy}
              kw={kw}
              powerFormat={powerFormat}
            />
            <SourceColumn
              source={backup}
              role="backup"
              health="healthy"
              share={1 - step.weight}
              load={load}
              checks={checks.backup}
              failed={0}
              copy={copy}
              kw={kw}
              powerFormat={powerFormat}
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-col border-t border-line px-(--ui--panel-x) py-(--ui--panel-y) lg:border-s lg:border-t-0">
          <Timeline events={events} stage={step.stage} done={at === RESTORED} elapsed={began === null ? null : now - began} copy={copy} />
        </div>
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3 border-t border-line py-4">
        <span className={cn('text-ui-sm text-fg-muted', VOICE)}>{copy.rule}</span>
        <div className="flex flex-1 justify-end gap-2">
          <Button variant="secondary" disabled={!idle || mode !== 'idle'} onClick={simulate}>
            {copy.simulate}
          </Button>
          <AsyncButton
            disabled={at !== RECOVERED && mode !== 'return'}
            onAction={switchBack}
            pendingLabel={copy.switchingBack}
            successLabel={copy.switchedBack}
          >
            {copy.switchBack}
          </AsyncButton>
        </div>
      </CardFooter>
      {announcer}
      <style href="youj-energy-switchover" precedence="youj">
        {CSS}
      </style>
    </Card>
  )

  const page = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fillWidth && 'max-w-256', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { Switchover, type SwitchoverProps }
