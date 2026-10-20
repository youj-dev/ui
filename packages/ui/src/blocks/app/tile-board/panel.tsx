'use client'

import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { cn, initials } from '../../../lib/utils'
import { clockText, ESCALATION_WINDOW, secondsBetween, type TileBoardCopy, type TileBoardReason, type TileBoardStatus, type TileBoardTile, type TileBoardTone } from './data'

/* What a tile is doing, and for one in the alert status what is being done
 * about it: how long it has been so, the reason as one choice, who is coming
 * and when they arrive, and a ring counting down to the escalation. Every
 * other status takes the same room with one line, so selecting a tile never
 * resizes the card. */

interface PanelProps {
  tile: TileBoardTile
  status: TileBoardStatus
  reasons: TileBoardReason[]
  reason: string
  escalated: boolean
  now: number
  copy: TileBoardCopy
  eta: (minutes: number) => string
  headingLevel: 'h3' | 'h2'
  onReasonChange: (id: string) => void
}

const TIMER_INK: Record<TileBoardTone, string> = {
  success: 'text-success-text',
  neutral: 'text-fg-muted',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
}

export function Panel({ tile, status, reasons, reason, escalated, now, copy, eta, headingLevel: Heading, onReasonChange }: PanelProps) {
  const alert = !!status.alert
  const elapsed = tile.since ? secondsBetween(tile.since, now) : 0
  const remaining = tile.escalateAt ? Math.max(0, Math.ceil((Date.parse(tile.escalateAt) - now) / 1000)) : 0
  const paged = escalated || remaining === 0
  const { responder } = tile

  return (
    <div className="flex min-h-42 flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Heading className="text-ui-lg font-medium">{alert ? copy.alertTitle(tile.name, status.label) : copy.statusTitle(tile.name, status.label)}</Heading>
        {alert && (
          <span role="timer" aria-label={copy.timerLabel} className={cn('text-ui-lg font-medium tabular-nums', TIMER_INK[status.tone])}>
            {clockText(elapsed)}
          </span>
        )}
      </div>

      {alert ? (
        <>
          <SegmentedControl variant="pill" size="sm" aria-label={copy.reasonLabel} value={reason} onValueChange={onReasonChange}>
            {reasons.map((r) => (
              <SegmentedControlItem key={r.id} value={r.id}>
                {r.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>

          {responder && (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{initials(responder.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-ui font-medium">{responder.name}</span>
                <span className="truncate text-ui-sm text-fg-muted">{responder.detail}</span>
              </div>
              <span className="text-ui font-medium text-success-text tabular-nums">
                <span className="sr-only">{copy.etaLabel} </span>
                {eta(responder.etaMinutes)}
              </span>
            </div>
          )}

          {tile.escalateAt && (
            <p className="flex items-center gap-2 text-ui text-fg-muted">
              <svg aria-hidden width={20} height={20} viewBox="0 0 20 20" className="shrink-0 -rotate-90">
                <circle cx={10} cy={10} r={8} fill="none" stroke="var(--color-line)" strokeWidth={2.5} />
                <circle
                  cx={10}
                  cy={10}
                  r={8}
                  fill="none"
                  stroke={paged ? 'var(--color-danger)' : 'var(--color-warning)'}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={paged ? 0 : 1 - Math.min(1, remaining / ESCALATION_WINDOW)}
                />
              </svg>
              {paged ? (
                <span className="text-danger-text">{copy.paged}</span>
              ) : (
                <span className="tabular-nums text-warning-text">{copy.escalatesIn(clockText(remaining))}</span>
              )}
            </p>
          )}
        </>
      ) : (
        <p className="text-ui text-fg-muted">{copy.nothing}</p>
      )}
    </div>
  )
}
