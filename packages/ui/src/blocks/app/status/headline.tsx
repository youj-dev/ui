'use client'

import { Counter } from '@youj/motion'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { SegmentedMeter } from '../../../components/ui/segmented-meter'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import type { StatusCopy, StatusLevel } from './data'

/** The theme's label voice (mono capitals in Bezel); Bezel sets every Eyebrow in it anyway. */
const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'
/** The big figure. */
const FIGURE = 'font-mono text-[2.75rem] leading-none font-medium tracking-[-0.03em] text-fg'
const BADGE = { accent: 'default', info: 'default', success: 'success', warning: 'warning', danger: 'danger' } as const

interface HeadlineProps {
  copy: StatusCopy
  /** The window's average uptime, 0–1. */
  average: number
  target: number
  /** Minutes of downtime the target allows over the window, and how many are left. */
  budget: number
  left: number
  status: StatusLevel
  statusText: string
  percent: (share: number) => string
  /** Writes the figure yourself instead of rolling it. */
  uptime?: (share: number) => string
}

/** The SLA as a big mono figure (decimals and sign muted), its target, the status pill and the error budget left. */
function Headline({ copy, average, target, budget, left, status, statusText, percent, uptime }: HeadlineProps) {
  const missed = average < target
  const share = budget > 0 ? left / budget : 0
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <Eyebrow className={VOICE}>{copy.uptime}</Eyebrow>
          <span className="flex items-baseline gap-2">
            <Eyebrow className={VOICE}>{copy.target}</Eyebrow>
            <span className={cn('font-mono text-ui-sm tabular-nums', missed ? 'text-warning-text' : 'text-fg')}>{percent(target)}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          {uptime ? (
            <span className={FIGURE}>{uptime(Math.floor(average * 10000) / 10000)}</span>
          ) : (
            <Counter
              mode="roll"
              // Rounded down, so a window with any downtime never reads 100.00%.
              value={Math.floor(average * 10000) / 10000}
              format={{ style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              locale={copy.locale}
              className={cn(
                // The sign and decimals sit on the figure's foot, muted.
                FIGURE,
                '[&>[dir=ltr]]:items-end',
                '[&_[data-part=decimal]]:text-fg-muted [&_[data-part=fraction]]:text-fg-muted',
                '[&_[data-part=percentSign]]:ms-0.5 [&_[data-part=percentSign]]:text-[0.6em] [&_[data-part=percentSign]]:text-fg-muted',
              )}
            />
          )}
          {/* A sentence, not a label: it keeps its case in a theme that sets badges in capitals. */}
          <Badge variant={BADGE[status.tone]} size="lg" className="gap-1.5 font-sans text-ui tracking-normal normal-case">
            <BadgeDot />
            {statusText}
          </Badge>
        </div>
      </div>
      <SegmentedMeter
        label={copy.budget}
        value={Math.max(0, left)}
        max={budget}
        tone={share <= 0 ? 'danger' : share < 0.25 ? 'warning' : 'neutral'}
        format={{ style: 'unit', unit: 'minute', unitDisplay: 'short', maximumFractionDigits: 0 }}
        locale={copy.locale}
      />
    </div>
  )
}

export { Headline }
