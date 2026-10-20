'use client'

import { useEffect, useId, useRef, useState, type ComponentType } from 'react'
import { useYouj, useSoundCue } from '@youj/core'
import { AudioLinesIcon, BellIcon, CheckCircleIcon, CircleAlertIcon, MousePointerIcon, ToggleIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Switch } from '../../../components/ui/switch'
import { cn } from '../../../lib/utils'
import { EVENTS, type EventInfo, type SoundEvent, type SoundSettingsCopy } from './data'

/* One row per moment: its glyph on a plate, what it is, a Play button and
 * the switch. Play is the only thing here that makes a sound: it emits the
 * event's cue on the cue bus (so the app's YoujProvider plays it in the
 * chosen pack, at the chosen volume) and its bars stand up for as long as a
 * cue rings. Pressing again restarts it. The switch and the button stay
 * silent themselves. A row that's off dims its words, and can still be
 * heard, so you can decide. */

const ICONS: Record<SoundEvent, ComponentType<{ size?: number }>> = {
  tap: MousePointerIcon,
  toggle: ToggleIcon,
  success: CheckCircleIcon,
  error: CircleAlertIcon,
  notify: BellIcon,
}

/** Which row's cue is ringing, held for the deliberate token so the bars read at every Speed. */
export function usePreview() {
  const cue = useSoundCue()
  const k = useYouj()
  const [playing, setPlaying] = useState<SoundEvent | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const play = (event: EventInfo) => {
    cue(event.preview)
    clearTimeout(timer.current)
    setPlaying(event.id)
    timer.current = setTimeout(() => setPlaying(null), k.ms('deliberate') * 2)
  }
  return { playing, play }
}

interface EventListProps {
  events: Record<SoundEvent, boolean>
  onToggle: (event: SoundEvent, on: boolean) => void
  /** Sounds are off: every row is inert. */
  disabled: boolean
  playing: SoundEvent | null
  onPlay: (event: EventInfo) => void
  copy: SoundSettingsCopy
}

export function EventList({ events, onToggle, disabled, playing, onPlay, copy }: EventListProps) {
  const id = useId()
  return (
    <ul className="flex flex-col">
      {EVENTS.map((event) => {
        const Icon = ICONS[event.id]
        const on = events[event.id]
        const nameId = `${id}-${event.id}`
        return (
          <li key={event.id} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0 sm:gap-4">
            <span
              aria-hidden
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-lg transition-colors yj-duration-fast ease-standard',
                on && !disabled ? 'bg-accent-subtle text-fg' : 'bg-band text-fg-muted',
              )}
            >
              <Icon size={16} />
            </span>
            <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5 transition-opacity yj-duration-fast ease-standard', (!on || disabled) && 'opacity-60')}>
              <span id={nameId} className="text-ui font-medium text-fg">
                {copy.events[event.id].name}
              </span>
              <span id={`${nameId}-detail`} className="text-ui-sm text-pretty text-fg-muted">
                {copy.events[event.id].detail}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              sound={false}
              disabled={disabled}
              aria-label={copy.playEvent(copy.events[event.id].name)}
              data-playing={playing === event.id || undefined}
              onClick={() => onPlay(event)}
              className="shrink-0 text-fg-muted data-playing:text-fg"
            >
              <AudioLinesIcon size={16} active={playing === event.id} />
              {copy.play}
            </Button>
            <Switch
              sound={false}
              disabled={disabled}
              checked={on}
              onCheckedChange={(next) => onToggle(event.id, next)}
              aria-labelledby={nameId}
              aria-describedby={`${nameId}-detail`}
            />
          </li>
        )
      })}
    </ul>
  )
}
