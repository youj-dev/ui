'use client'

import { memo, type CSSProperties } from 'react'
import { ArrowRightIcon, PhoneCallIcon, RepeatIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { ShareBar } from '../../../components/ui/share-bar'
import { Eyebrow } from '../../../components/ui/typography'
import { useClockNow } from './clock'
import type { ShiftRotaCopy, ShiftRotaPerson, ShiftRotaShift } from './data'
import { dateTimeFormat, numberFormat } from '../../../lib/utils'

interface CurrentCardProps {
  lane: ShiftRotaPerson
  shift: ShiftRotaShift
  /** The lane's color, as a CSS value. */
  tone: string
  next?: { lane: ShiftRotaPerson; shift: ShiftRotaShift }
  people: ShiftRotaPerson[]
  copy: ShiftRotaCopy
  onSwap: (lane: string) => void
  onContact: () => unknown
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

/** The time left in mono and how far through the shift they are: the only parts that read the clock. */
function TimeLeft({ shift, copy }: { shift: ShiftRotaShift; copy: ShiftRotaCopy }) {
  const now = useClockNow()
  const left = Math.max(0, +shift.end - now)
  const parts = (unit: 'hour' | 'minute' | 'second', n: number) =>
    numberFormat(copy.locale, { style: 'unit', unit, unitDisplay: 'narrow', minimumIntegerDigits: unit === 'hour' ? 1 : 2 }).formatToParts(n)
  const clock = [parts('hour', Math.floor(left / 3_600_000)), parts('minute', Math.floor(left / 60_000) % 60), parts('second', Math.floor(left / 1000) % 60)]
  const hours = (+shift.end - +shift.start) / 3_600_000
  return (
    <>
      <p role="timer" className="font-mono text-4xl leading-none font-medium tracking-tight text-fg tabular-nums">
        {clock.map((p, i) => (
          <span key={i} className={i ? 'ms-3' : undefined}>
            {p.map((part, j) =>
              part.type === 'unit' ? (
                <span key={j} className="ms-0.5 text-[0.55em] text-fg-muted">
                  {part.value}
                </span>
              ) : (
                part.value
              ),
            )}
          </span>
        ))}
      </p>
      {/* One cell an hour; the lit ones have passed. Decorative: the time left says it. */}
      <ShareBar value={+shift.end - +shift.start - left} max={+shift.end - +shift.start} segments={Math.max(1, Math.round(hours))} tone="accent" />
    </>
  )
}

/** Who holds the pager now: their disc, the time left in mono, how far through the shift they are, who's next, and Swap and Page. Memoised: only TimeLeft follows the clock. */
const CurrentCard = memo(function CurrentCard({ lane, shift, tone, next, people, copy, onSwap, onContact }: CurrentCardProps) {
  const hm = dateTimeFormat(copy.locale, { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

  return (
    <div
      data-slot="shift-rota-current"
      className="flex flex-col gap-5 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))] p-4 sm:p-5"
      style={{ '--lane-tone': tone } as CSSProperties}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="relative grid size-10 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--lane-tone)_24%,transparent)] font-mono text-ui font-medium">
          {initials(lane.name)}
          <span className="absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 border-surface bg-success" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-ui-lg font-medium text-fg">{lane.name}</span>
          <span className="truncate text-ui-sm text-fg-muted">{shift.note ?? lane.detail}</span>
        </div>
        <Badge variant={shift.override ? 'warning' : 'success'} className="shrink-0">
          <BadgeDot />
          {shift.override ? copy.override : copy.onDuty}
        </Badge>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow>{copy.timeLeft}</Eyebrow>
          <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{copy.ends(hm.format(shift.end))}</span>
        </div>
        <TimeLeft shift={shift} copy={copy} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {next ? (
          <p className="flex min-w-0 items-center gap-2 text-ui-sm text-fg-muted">
            <Eyebrow>{copy.next}</Eyebrow>
            <ArrowRightIcon size={12} className="shrink-0 rtl:-scale-x-100" />
            <span className="truncate text-fg">{next.lane.name}</span>
            <span className="font-mono tabular-nums">{hm.format(next.shift.start)}</span>
          </p>
        ) : (
          <span />
        )}
        <div className="ms-auto flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="secondary" />}>
              <RepeatIcon size={14} />
              {copy.swap}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{copy.swapWith}</DropdownMenuLabel>
                {people
                  .filter((p) => p.id !== lane.id)
                  .map((p) => (
                    <DropdownMenuItem key={p.id} onClick={() => onSwap(p.id)}>
                      {p.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <AsyncButton onAction={onContact} pendingLabel={copy.contacting} successLabel={copy.contacted}>
            <PhoneCallIcon size={14} />
            {copy.contact}
          </AsyncButton>
        </div>
      </div>
    </div>
  )
})

export { CurrentCard }
