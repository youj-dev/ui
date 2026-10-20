'use client'

import { Counter } from '@youj/motion'
import { SegmentedMeter } from '../../../components/ui/segmented-meter'
import { Eyebrow } from '../../../components/ui/typography'
import type { TeamMembersCopy } from './data'

/** Seats: members and pending invites both hold one. */
export function Seats({ members, invites, seats, copy }: { members: number; invites: number; seats: number; copy: TeamMembersCopy }) {
  const used = members + invites
  const free = Math.max(0, seats - used)
  return (
    <section aria-label={copy.seatsLabel} className="flex flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex shrink-0 items-baseline gap-1.5">
        <span className="text-2xl font-semibold tracking-tight text-fg tabular-nums">
          <Counter value={used} duration="base" />
        </span>
        <Eyebrow className="text-ui text-fg-muted">{copy.ofSeats(seats)}</Eyebrow>
      </div>
      {/* One cell per seat; the last lights in warning once every seat is taken. */}
      <SegmentedMeter
        value={used}
        max={seats}
        segments={seats}
        showValue={false}
        thresholds={[{ value: seats, tone: 'warning', label: copy.allSeatsTaken }]}
        aria-label={copy.seatsMeter}
        getAriaValueText={() => copy.seatsUsed(used, seats)}
        className="min-w-0 flex-1"
      />
      <dl className="flex shrink-0 gap-4 text-ui-sm text-fg-muted">
        {(
          [
            ['members', copy.membersStat, members],
            ['invited', copy.invitedStat, invites],
            ['free', copy.freeStat, free],
          ] as const
        ).map(([key, label, n]) => (
          <div key={key} className="flex items-baseline gap-1.5">
            <Eyebrow render={<dt />} className="text-ui-sm text-fg-muted">
              {label}
            </Eyebrow>
            <dd className={free === 0 && key === 'free' ? 'font-medium text-warning-text tabular-nums' : 'font-medium text-fg tabular-nums'}>{n}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
