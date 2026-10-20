'use client'

import { FlameIcon, MoreHorizontalIcon, SnowflakeIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dial, type DialTone } from '../../../components/ui/dial'
import { Skeleton } from '../../../components/ui/skeleton'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import {
  MODES,
  type DeviceControlsCopy,
  type DeviceControlsMode,
  type DeviceControlsRange,
  type DeviceControlsRoom,
  type DeviceControlsSlot,
  type DeviceControlsUnit,
} from './data'

interface ThermostatCardProps {
  /** The room shown. None while the rooms load or when there are none. */
  room?: DeviceControlsRoom
  /** `loading` draws the dial as a Skeleton; `blank` leaves a dash in its place. */
  state?: 'ready' | 'loading' | 'blank'
  unit: DeviceControlsUnit
  range: DeviceControlsRange
  schedule: DeviceControlsSlot[]
  /** The `id` of the slot running now. */
  nowSlot?: string
  mode: DeviceControlsMode
  onMode: (mode: DeviceControlsMode) => void
  onTarget: (target: number) => void
  held: boolean
  onHold: () => void
  copy: DeviceControlsCopy
  heading: 'h2' | 'h3'
}

const TONE: Record<DeviceControlsMode, DialTone> = { heat: 'warm', cool: 'cool', auto: 'accent', off: 'neutral' }
/** Degrees Celsius a room moves in a minute, for the estimate. */
const RATE = 0.1

/** The thermostat for one room: its mode, the Dial with the room's temperature against its target, and the day's schedule. */
function ThermostatCard({
  room,
  state = 'ready',
  unit,
  range,
  schedule,
  nowSlot,
  mode,
  onMode,
  onTarget,
  held,
  onHold,
  copy,
  heading: Heading,
}: ThermostatCardProps) {
  const scale = unit === 'fahrenheit' ? 1.8 : 1
  const gap = room ? room.target - room.temperature : 0
  const heating = (mode === 'heat' || mode === 'auto') && gap > 0.2 * scale
  const cooling = (mode === 'cool' || mode === 'auto') && gap < -0.2 * scale
  const minutes = Math.max(1, Math.round(Math.abs(gap) / (RATE * scale)))
  const status = mode === 'off' ? copy.idle : heating ? copy.heating(minutes) : cooling ? copy.cooling(minutes) : copy.holding
  const deg = numberFormat(copy.locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 })
  const last = schedule.at(-1)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <Heading>{copy.thermostat}</Heading>
        </CardTitle>
        <CardDescription>
          {room ? (
            room.name
          ) : state === 'loading' ? (
            <Skeleton className="inline-block h-3.5 w-24 align-middle" />
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

      <CardContent className="flex flex-col items-center gap-5">
        <SegmentedControl
          aria-label={copy.mode}
          value={mode}
          onValueChange={(v) => onMode(v as DeviceControlsMode)}
          className="w-full"
          disabled={state !== 'ready'}
        >
          {MODES.map((m) => (
            <SegmentedControlItem key={m} value={m} className="flex-1">
              {copy.modes[m]}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        {room ? (
          <Dial
            value={room.target}
            onValueChange={onTarget}
            min={range.min}
            max={range.max}
            step={range.step}
            current={room.temperature}
            marks={schedule.map((s) => ({ value: s.target, label: s.name }))}
            tone={TONE[mode]}
            disabled={mode === 'off'}
            format={{ style: 'unit', unit, maximumFractionDigits: 1, minimumFractionDigits: 1 }}
            locale={copy.locale}
            label={copy.target(room.name)}
            caption={copy.captions[mode]}
            className="max-w-68"
          />
        ) : (
          // The dial's own room (a square at its width), so the card keeps its size.
          <div className="grid aspect-square w-full max-w-68 place-items-center">
            {state === 'loading' ? <Skeleton className="size-full rounded-full" /> : <span className="text-ui-lg text-fg-subtle">—</span>}
          </div>
        )}
        <p className={cn('flex h-[1lh] items-center gap-2 text-ui text-fg-muted', heating && 'text-fg', cooling && 'text-fg')}>
          {heating && <FlameIcon size={14} aria-hidden className="text-warning" />}
          {cooling && <SnowflakeIcon size={14} aria-hidden className="text-chart-5" />}
          {room && status}
        </p>
      </CardContent>

      <CardContent className="flex flex-col gap-3">
        <Eyebrow>{copy.schedule}</Eyebrow>
        <ol className="flex flex-col">
          {schedule.map((slot) => {
            const now = slot.id === nowSlot
            return (
              <li
                key={slot.id}
                aria-current={now ? 'time' : undefined}
                className="flex items-center gap-3 border-t border-line py-2 first:border-t-0"
              >
                <span className="w-12 font-mono text-ui-sm text-fg-muted tabular-nums">{slot.at}</span>
                <span className={cn('min-w-0 flex-1 truncate text-ui', now ? 'text-fg' : 'text-fg-muted')}>{slot.name}</span>
                {now && (
                  <Badge variant="success">
                    <BadgeDot />
                    {copy.now}
                  </Badge>
                )}
                <span className="font-mono text-ui text-fg tabular-nums">
                  {deg.format(slot.target)}
                  <span className="text-fg-muted">°</span>
                </span>
              </li>
            )
          })}
        </ol>
      </CardContent>

      <CardFooter className="flex-wrap justify-end">
        {held && (
          <Badge variant="warning" className="me-auto">
            <BadgeDot />
            {copy.held}
          </Badge>
        )}
        <Button variant="secondary" onClick={onHold} disabled={mode === 'off' || !room || !last}>
          {held ? copy.resume : copy.hold(last?.at ?? '')}
        </Button>
      </CardFooter>
    </Card>
  )
}

export { ThermostatCard }
