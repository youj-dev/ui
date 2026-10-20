'use client'

import { Badge, BadgeDot } from '../../../components/ui/badge'
import { RolloutRuler } from '../../../components/ui/rollout-ruler'
import { cn } from '../../../lib/utils'
import type { StagedRolloutCopy, StagedRolloutEnvironment, StagedRolloutItem } from './data'
import type { RolloutStage } from '../../../components/ui/rollout-ruler'

interface ItemListProps {
  items: StagedRolloutItem[]
  selected: string
  environments: StagedRolloutEnvironment[]
  /** The environment the rulers read. */
  environment: StagedRolloutEnvironment
  /** Items whose kill switch is thrown. */
  stopped: string[]
  stages?: readonly RolloutStage[]
  copy: StagedRolloutCopy
  percent: (share: number) => string
  onSelect: (key: string) => void
}

// The chip stays a quiet outline; only its dot takes the state.
const chipDot = (share: number) => (share >= 100 ? 'success' : share > 0 ? 'accent' : undefined)

/* Every item as a row: its key and name, a quiet chip per environment (its dot in
 * the accent while it's rolling out, success at 100%, gray when off), and its
 * rollout in the chosen environment as a bare ruler with the share in mono.
 * The name is the row's button, stretched over it, so the chips and the
 * ruler stay readable to assistive tech. The selected row is lit. */
function ItemList({ items, selected, environments, environment, stopped, stages, copy, percent, onSelect }: ItemListProps) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const on = item.key === selected
        const share = item.rollout[environment.id] ?? 0
        const dead = stopped.includes(item.key)
        return (
          <li
            key={item.key}
            data-selected={on || undefined}
            className={cn(
              'relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 border-t border-line-subtle px-(--ui--panel-x) py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto_minmax(--spacing(28),--spacing(36))_--spacing(12)]',
              'transition-[background-color] yj-duration-fast ease-standard hover:bg-hover data-selected:bg-selected',
            )}
          >
            {/* The selected row's edge, in the accent. */}
            <span
              aria-hidden
              className={cn(
                'absolute inset-y-2 start-0 w-0.5 rounded-full bg-accent transition-opacity yj-duration-fast ease-standard',
                on ? 'opacity-100' : 'opacity-0',
              )}
            />
            <button
              type="button"
              aria-pressed={on}
              aria-label={copy.select(item.name)}
              onClick={() => onSelect(item.key)}
              className="flex min-w-0 flex-col items-start gap-0.5 text-start outline-none after:absolute after:inset-0 after:rounded-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-focus"
            >
              <span className={cn('max-w-full truncate text-ui font-medium', dead ? 'text-danger-text' : 'text-fg')}>{item.name}</span>
              <span className="max-w-full truncate font-mono text-ui-xs text-fg-muted">{item.key}</span>
            </button>
            <span className="col-start-2 row-start-1 text-ui text-fg tabular-nums sm:col-start-4 sm:text-end">{percent(share)}</span>
            <span className="col-span-2 flex gap-1.5 sm:col-span-1 sm:col-start-2 sm:row-start-1">
              {environments.map((env) => (
                <Badge key={env.id} variant="outline">
                  <BadgeDot color={chipDot(item.rollout[env.id] ?? 0)} />
                  {env.short ?? env.label}
                  <span className="sr-only">{`: ${percent(item.rollout[env.id] ?? 0)}`}</span>
                </Badge>
              ))}
            </span>
            <RolloutRuler
              readOnly
              size="sm"
              value={share}
              tone={dead ? 'danger' : 'accent'}
              stages={stages}
              label={copy.chipState(item.key, environment.label)}
              className="col-span-2 sm:col-span-1 sm:col-start-3 sm:row-start-1"
            />
          </li>
        )
      })}
    </ul>
  )
}

export { ItemList }
