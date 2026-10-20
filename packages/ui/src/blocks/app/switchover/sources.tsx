'use client'

import { Counter } from '@youj/motion'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { ShareBar } from '../../../components/ui/share-bar'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import type { SwitchoverCopy, SwitchoverSource, SwitchoverHealth } from './data'

/* The two sources under the rig, each on the side its pad stands: its name,
 * role and what it is, its health, the load it carries (rolling kilowatts
 * over eight cells, an eighth of the home each, like the line's strands) and
 * its last checks as a run of cells, the newest at the end, with how many of
 * the last three failed. */

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'
const BADGE: Record<SwitchoverHealth, 'success' | 'warning' | 'danger'> = { healthy: 'success', degraded: 'warning', down: 'danger' }

interface SourceColumnProps {
  source: SwitchoverSource
  role: 'primary' | 'backup'
  health: SwitchoverHealth
  /** Its share of the load, 0–1, and the whole load, kW. */
  share: number
  load: number
  /** Recent checks, oldest first; each true when it passed. */
  checks: readonly { id: number; ok: boolean }[]
  failed: number
  copy: SwitchoverCopy
  kw: (n: number) => string
  /** The Intl options the big figure rolls in. */
  powerFormat: Intl.NumberFormatOptions
}

export function SourceColumn({ source, role, health, share, load, checks, failed, copy, kw, powerFormat }: SourceColumnProps) {
  const troubled = health !== 'healthy'
  const carried = Math.round(share * load * 10) / 10
  return (
    <div data-slot="switchover-source" data-role={role} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="flex min-w-0 items-baseline gap-2">
            <span className="truncate text-ui-lg font-medium text-fg">{source.id}</span>
            <span className={cn('text-ui-sm text-fg-muted', VOICE)}>{role === 'primary' ? copy.primary : copy.backup}</span>
          </p>
          <p className="truncate text-ui-sm text-fg-muted">{source.detail}</p>
        </div>
        <Badge variant={BADGE[health]} className="shrink-0">
          <BadgeDot />
          {copy.health[health]}
        </Badge>
      </div>
      <div className="flex items-baseline gap-1.5 font-mono leading-none" aria-label={copy.carries(source.id, kw(carried))} role="group">
        <Counter
          aria-hidden
          value={carried}
          from={carried}
          locale={copy.locale}
          format={powerFormat}
          duration="slow"
          className={cn('text-3xl font-medium tracking-tight', share === 0 && 'text-fg-muted')}
        />
        <span aria-hidden className="text-ui text-fg-muted">
          {copy.unit} {copy.ofLoad}
        </span>
      </div>
      {/* The figure says the value, so the cells are decorative. */}
      <ShareBar
        value={share}
        segments={8}
        tone={share === 0 ? 'neutral' : role === 'primary' && troubled ? (health === 'down' ? 'danger' : 'warning') : 'accent'}
      />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow className={VOICE}>{copy.checks}</Eyebrow>
          <span className={cn('font-mono text-ui-sm tabular-nums', failed ? 'text-danger-text' : 'text-fg-muted')}>
            {failed ? copy.failedOf(failed) : copy.passing}
          </span>
        </div>
        <div role="img" aria-label={copy.checksLabel(source.id, failed)} className="grid grid-cols-12 gap-0.5">
          {checks.map((check) => (
            <span key={check.id} className={cn('ke-check h-3 rounded-[min(var(--radius-sm),2px)]', check.ok ? 'bg-success' : 'bg-danger')} />
          ))}
        </div>
      </div>
    </div>
  )
}
