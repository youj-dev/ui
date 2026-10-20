'use client'

import { CalendarPlusIcon, ClockIcon, GlobeIcon, VideoIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import type { BookingCopy, BookingHost, BookingMeeting, BookingZone, Step } from './data'

/** Up to two letters from a name, for the avatar. */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')

function MeetingPanel({
  host,
  meeting,
  durations,
  zones,
  copy,
  headingLevel,
  step,
  duration,
  onDurationChange,
  zone,
  onZoneChange,
  when,
  zoneLabel,
}: {
  host: BookingHost
  meeting: BookingMeeting
  durations: readonly number[]
  zones: readonly BookingZone[]
  copy: BookingCopy
  headingLevel: 1 | 2 | 3
  step: Step
  duration: number
  onDurationChange: (duration: number) => void
  zone: string
  onZoneChange: (zone: string) => void
  when: string
  zoneLabel?: string
}) {
  const Title = `h${headingLevel}` as const
  return (
    <aside aria-label={copy.meeting} className="flex flex-col gap-5 border-line px-(--ui--panel-x) py-(--ui--panel-y) max-md:border-b md:border-e">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{host.initials ?? initials(host.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="text-ui-sm text-fg-muted">{host.name}</span>
          {host.role && <span className="text-ui-xs text-fg-muted">{host.role}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Title className="text-xl font-semibold tracking-tight text-balance">{meeting.title}</Title>
        {meeting.description && <p className="text-ui-sm text-fg-muted">{meeting.description}</p>}
      </div>
      {step === 'pick' ? (
        <div className="flex flex-col gap-4">
          <ToggleGroup
            variant="segmented"
            value={[String(duration)]}
            onValueChange={(v) => {
              if (!v[0]) return
              onDurationChange(Number(v[0]))
            }}
            aria-label={copy.length}
            className="w-full"
          >
            {durations.map((d) => (
              <ToggleGroupItem key={d} value={String(d)} className="flex-1 tabular-nums">
                {copy.durationOption(d)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ul className="flex flex-col gap-2.5 text-ui-sm text-fg-muted">
            {meeting.location && (
              <li className="flex items-center gap-2">
                <VideoIcon size={16} className="shrink-0" /> {meeting.location}
              </li>
            )}
            <li className="flex items-center gap-2">
              <GlobeIcon size={16} className="shrink-0" />
              <Select
                items={zones}
                value={zone}
                onValueChange={(v) => onZoneChange(v as string)}
              >
                <SelectTrigger size="sm" aria-label={copy.timeZone} className="min-w-0 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.value} value={z.value}>
                      {z.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          </ul>
        </div>
      ) : (
        <dl className="flex flex-col gap-2.5 text-ui-sm">
          <div className="flex items-center gap-2">
            <dt className="sr-only">{copy.when}</dt>
            <CalendarPlusIcon size={16} className="shrink-0 text-accent" />
            <dd className="font-medium">{when}</dd>
          </div>
          <div className="flex items-center gap-2 text-fg-muted">
            <dt className="sr-only">{copy.length}</dt>
            <ClockIcon size={16} className="shrink-0" />
            <dd>{copy.durationValue(duration)}</dd>
          </div>
          <div className="flex items-center gap-2 text-fg-muted">
            <dt className="sr-only">{copy.timeZone}</dt>
            <GlobeIcon size={16} className="shrink-0" />
            <dd>{zoneLabel}</dd>
          </div>
        </dl>
      )}
    </aside>
  )
}

export { MeetingPanel }
