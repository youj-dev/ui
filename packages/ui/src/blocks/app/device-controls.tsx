'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedMeter } from '../../components/ui/segmented-meter'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import {
  DEFAULT_COPY,
  ENERGY,
  NOW_SLOT,
  RANGE,
  ROOMS,
  SCHEDULE,
  type DeviceControlsCopy,
  type DeviceControlsEnergy,
  type DeviceControlsMode,
  type DeviceControlsRange,
  type DeviceControlsRoom,
  type DeviceControlsSlot,
  type DeviceControlsUnit,
} from './device-controls/data'
import { RoomTile } from './device-controls/room-tile'
import { ThermostatCard } from './device-controls/thermostat-card'
import { cn, numberFormat } from '../../lib/utils'

/* A set of rooms at a glance (a home, an office floor, a greenhouse): every room as a tile with its temperature and
 * humidity in mono and a switch for its lights (a lit room glows warm), and
 * a thermostat for the room you pick, on a Dial: the ruled arc over the
 * `range`, in °C or °F, the room's temperature as a marker, the target as the knob, the
 * stretch between them lit orange while heating or blue while cooling, and
 * the day's schedule as rings on the ruler. Drag the knob or use the arrow
 * keys; Heat, Cool, Auto and Off retint it. Swap the demo state for your
 * devices through `onChange`. Loading, an error with Retry and no rooms take
 * the tiles' place at their size. Reduced motion: every change is drawn in place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

interface DeviceControlsProps extends Omit<ComponentProps<'section'>, 'children' | 'onChange'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the cards. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1088px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<DeviceControlsCopy>
  /** Default: four demo rooms. New data replaces what the card holds, edits included. */
  rooms?: DeviceControlsRoom[]
  /** The temperature unit of the readings, targets, range and schedule. Default `celsius`. */
  unit?: DeviceControlsUnit
  /** The dial's span and step, in the `unit`. Default: 12 to 28 by 0.5 (°C). */
  range?: DeviceControlsRange
  /** The day's setpoints, in time order; the last one is where Hold until runs to. Default: a home's four. */
  schedule?: DeviceControlsSlot[]
  /** The `id` of the schedule slot running now. Default: the demo's evening. */
  nowSlot?: string
  /** Energy used so far today against the day's budget, in kWh. Default: the demo's. */
  energy?: DeviceControlsEnergy
  /** Default `heat`. */
  defaultMode?: DeviceControlsMode
  /** Called with the rooms after every change: a target, or a room's lights. */
  onChange?: (rooms: DeviceControlsRoom[]) => void
  /** Skeletons in place of the rooms while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the rooms when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no rooms. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function DeviceControls({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  rooms: initial = ROOMS,
  unit = 'celsius',
  range = RANGE,
  schedule = SCHEDULE,
  nowSlot = NOW_SLOT,
  energy = ENERGY,
  defaultMode = 'heat',
  onChange,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: DeviceControlsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const Section = embedded ? 'h3' : 'h2'
  const [rooms, setRooms] = useState(initial)
  const [selected, setSelected] = useState(initial[0]?.id)
  // New data from the app replaces what the card holds (edits start over).
  const [given, setGiven] = useState(initial)
  if (given !== initial) {
    setGiven(initial)
    setRooms(initial)
    setSelected(initial[0]?.id)
  }
  const ready = !loading && !error && rooms.length > 0
  const [mode, setMode] = useState<DeviceControlsMode>(defaultMode)
  const [held, setHeld] = useState(false)
  const room = ready ? (rooms.find((r) => r.id === selected) ?? rooms[0]) : undefined
  const lit = rooms.filter((r) => r.lights).length
  const kwh = numberFormat(copy.locale, { maximumFractionDigits: 1 })

  const update = (id: string, patch: Partial<DeviceControlsRoom>) =>
    setRooms((list) => {
      const next = list.map((r) => (r.id === id ? { ...r, ...patch } : r))
      onChange?.(next)
      return next
    })

  // The tiles' room: two rows of tiles, so the card keeps its size.
  const room2x2 = 'h-80.5'
  const tiles = loading ? (
    <div className="grid gap-3 sm:grid-cols-2">
      <span className="sr-only">{copy.loadingLabel}</span>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-38.75 rounded-xl" />
      ))}
    </div>
  ) : error ? (
    <div className={cn(room2x2, 'grid place-items-center')}>
      <Alert variant="danger">
        <AlertDescription>{error}</AlertDescription>
        {onRetry && (
          <AlertAction>
            <Button size="sm" variant="outline" onClick={onRetry}>
              {copy.retry}
            </Button>
          </AlertAction>
        )}
      </Alert>
    </div>
  ) : !room ? (
    <div className={cn(room2x2, 'grid')}>
      {empty ?? (
        <Empty className="rounded-lg border border-dashed border-line">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  ) : (
    <ul className="grid gap-3 sm:grid-cols-2">
      {rooms.map((r) => (
        <RoomTile
          key={r.id}
          room={r}
          selected={r.id === room.id}
          onSelect={() => setSelected(r.id)}
          onLights={(on) => update(r.id, { lights: on })}
          copy={copy}
        />
      ))}
    </ul>
  )

  const roomsCard = (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>
          {ready ? (
            copy.subtitle(rooms.length, lit)
          ) : loading ? (
            <Skeleton className="inline-block h-3.5 w-32 align-middle" />
          ) : (
            <span className="text-fg-subtle">—</span>
          )}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Section className="sr-only">{copy.rooms}</Section>
        {tiles}
      </CardContent>
      <CardContent className="flex flex-col gap-2.5">
        <div className={cn('flex justify-between gap-3', ready ? 'items-baseline' : 'items-center')}>
          <Eyebrow>{copy.energy}</Eyebrow>
          <span className="font-mono text-ui text-fg tabular-nums">
            {ready ? copy.energyValue(kwh.format(energy.used), kwh.format(energy.budget)) : loading ? <Skeleton className="h-[1lh] w-24" /> : '—'}
          </span>
        </div>
        <SegmentedMeter
          aria-label={copy.energy}
          value={energy.used}
          max={energy.budget}
          segments={48}
          showValue={false}
          locale={copy.locale}
          thresholds={[{ value: energy.budget * 0.8, tone: 'warning' }]}
        />
      </CardContent>
      <CardFooter>
        <span className="me-auto tabular-nums">{ready ? copy.litCount(lit) : loading ? <Skeleton className="h-[1lh] w-20" /> : null}</span>
        <Button variant="secondary" disabled={!ready || lit === 0} onClick={() => rooms.forEach((r) => r.lights && update(r.id, { lights: false }))}>
          {copy.allOff}
        </Button>
      </CardFooter>
    </Card>
  )

  // Its natural width: on the layout on its own page, on the section embedded (where a className can change it).
  const cap = !fill && 'max-w-272'
  const layout = (
    <div className={cn('grid w-full items-start gap-5 lg:grid-cols-[minmax(0,1fr)_--spacing(92)]', !embedded && cap)}>
      {roomsCard}
      <ThermostatCard
        room={room}
        state={ready ? 'ready' : loading ? 'loading' : 'blank'}
        unit={unit}
        range={range}
        schedule={schedule}
        nowSlot={nowSlot}
        mode={mode}
        onMode={setMode}
        onTarget={(target) => room && update(room.id, { target })}
        held={held}
        onHold={() => setHeld((h) => !h)}
        copy={copy}
        heading={embedded ? 'h3' : 'h2'}
      />
    </div>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', cap, className)}>
      {layout}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {layout}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { DeviceControls, type DeviceControlsProps }
