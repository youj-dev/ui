'use client'

import { DropletIcon, LightbulbIcon } from '@youj/icons'
import { Switch } from '../../../components/ui/switch'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { DeviceControlsCopy, DeviceControlsRoom } from './data'

interface RoomTileProps {
  room: DeviceControlsRoom
  /** The room the thermostat shows. */
  selected: boolean
  onSelect: () => void
  onLights: (on: boolean) => void
  copy: DeviceControlsCopy
}

/** A room at a glance: its temperature and humidity in mono, and its lights. Lit rooms glow warm from the top. */
function RoomTile({ room, selected, onSelect, onLights, copy }: RoomTileProps) {
  const one = numberFormat(copy.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const pct = numberFormat(copy.locale, { style: 'percent' })

  return (
    <li
      data-lit={room.lights || undefined}
      data-selected={selected || undefined}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl transition-[box-shadow,background-color] yj-duration-base ease-standard',
        'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]',
        selected && 'shadow-[inset_0_0_0_1.5px_var(--color-fg)]',
      )}
    >
      {/* The lamp's warmth: a soft wash from the top while the lights are on. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,color-mix(in_oklab,var(--color-warning)_calc(14%+6%*var(--yj-dark)),transparent),transparent_70%)] transition-opacity yj-duration-slow ease-standard',
          room.lights ? 'opacity-100' : 'opacity-0',
        )}
      />
      <button
        type="button"
        aria-pressed={selected}
        aria-label={copy.showRoom(room.name)}
        onClick={onSelect}
        className="focus-ring relative flex flex-col gap-4 rounded-xl p-4 text-start"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-ui-lg font-medium text-fg">{room.name}</span>
          <LightbulbIcon
            size={16}
            aria-hidden
            className={cn('shrink-0 transition-colors yj-duration-base ease-standard', room.lights ? 'text-warning' : 'text-fg-subtle')}
          />
        </span>
        <span className="grid grid-cols-2 gap-3">
          <span className="flex flex-col gap-1">
            <Eyebrow>{copy.temperature}</Eyebrow>
            <span className="font-mono text-2xl leading-none font-medium tracking-tight text-fg tabular-nums">
              {one.format(room.temperature)}
              <span className="text-fg-muted">°</span>
            </span>
          </span>
          <span className="flex flex-col gap-1">
            <Eyebrow>{copy.humidity}</Eyebrow>
            <span className="flex items-center gap-1.5 font-mono text-2xl leading-none font-medium tracking-tight text-fg tabular-nums">
              <DropletIcon size={12} aria-hidden className="text-chart-5" />
              <span>
                {pct.formatToParts(room.humidity / 100).map((p, i) => (
                  <span key={i} className={cn(p.type === 'percentSign' && 'text-[0.6em] text-fg-muted')}>
                    {p.value}
                  </span>
                ))}
              </span>
            </span>
          </span>
        </span>
      </button>
      <div className="relative flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
        <span aria-hidden className="flex items-baseline gap-2 text-ui text-fg-muted">
          {copy.lights}
          <span className="font-mono text-ui-sm tabular-nums">{copy.lamps(room.lights, room.lamps)}</span>
        </span>
        <Switch checked={room.lights} onCheckedChange={onLights} aria-label={copy.lightsIn(room.name)} />
      </div>
    </li>
  )
}

export { RoomTile }
