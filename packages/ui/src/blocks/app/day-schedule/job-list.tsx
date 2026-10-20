'use client'

import type { CSSProperties } from 'react'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Switch } from '../../../components/ui/switch'
import { cn } from '../../../lib/utils'
import type { DayScheduleJob, DayScheduleCopy } from './data'

export interface DayScheduleRow {
  job: DayScheduleJob
  /** The schedule in words. */
  human: string
  /** Its next start today or tomorrow, formatted; undefined when paused or it never runs. */
  next?: string
  /** "Overlaps reindex-search at 02:30" when it collides, with the time on its own so a narrow row cuts the names, not the time. */
  overlap?: { text: string; time: string }
}

interface JobListProps {
  rows: DayScheduleRow[]
  copy: DayScheduleCopy
  highlight?: string
  onHighlight: (id: string | undefined) => void
  onPausedChange: (id: string, paused: boolean) => void
}

const swatch = (tone: DayScheduleJob['tone']) => (tone.startsWith('chart') ? `var(--color-${tone})` : tone === 'neutral' ? 'var(--color-fg-subtle)' : 'var(--color-accent)')

/** One row per job, in the ring's track order (outermost first). Pointing at a row or focusing its switch lights that job on the ring. */
function JobList({ rows, copy, highlight, onHighlight, onPausedChange }: JobListProps) {
  return (
    <ul className="yj-scrollbar -my-1 flex max-h-72 flex-col overflow-y-auto" onPointerLeave={() => onHighlight(undefined)}>
      {rows.map(({ job, human, next, overlap }) => (
        <li
          key={job.id}
          data-job={job.id}
          data-highlighted={highlight === job.id || undefined}
          onPointerEnter={() => onHighlight(job.id)}
          onFocus={() => onHighlight(job.id)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onHighlight(undefined)
          }}
          className={cn(
            'grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-x-3 border-b border-line py-3 last:border-b-0 sm:gap-x-4',
            'transition-opacity yj-duration-fast ease-standard',
            highlight && highlight !== job.id && 'opacity-55',
          )}
        >
          <span aria-hidden className="mt-2 size-2.5 rounded-[3px]" style={{ background: swatch(job.tone), opacity: job.paused ? 0.45 : 1 } as CSSProperties} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn('truncate font-mono text-ui-lg leading-6.5', job.paused ? 'text-fg-muted' : 'text-fg')}>{job.name}</span>
              {job.paused && (
                <Badge variant="secondary" className="shrink-0">
                  {copy.paused}
                </Badge>
              )}
            </div>
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-ui text-fg-muted">
              {/* Code reads left to right in every script. */}
              <code dir="ltr" translate="no" className="font-mono text-ui-sm whitespace-nowrap text-fg-muted">
                {job.cron}
              </code>
              <span aria-hidden className="text-fg-subtle">
                ·
              </span>
              <span className="min-w-0">{human}</span>
            </p>
            {overlap && (
              // A sentence, so it keeps its case in a theme that sets badges in capitals.
              <Badge variant="warning" className="mt-1 max-w-full font-sans tracking-normal normal-case">
                <BadgeDot />
                {/* The space stays in the text, so it's read as words; the badge's gap draws it. */}
                <span className="min-w-0 truncate">{overlap.text.split(overlap.time)[0]}</span>
                <span className="shrink-0 tabular-nums">
                  {overlap.time}
                  {overlap.text.split(overlap.time)[1]}
                </span>
              </Badge>
            )}
          </div>
          <span className={cn('font-mono text-ui-lg leading-6.5 tabular-nums', next ? 'text-fg' : 'text-fg-muted')}>{next ?? '—'}</span>
          <Switch className="mt-0.5" checked={!job.paused} onCheckedChange={(on) => onPausedChange(job.id, !on)} aria-label={copy.enabled(job.name)} />
        </li>
      ))}
    </ul>
  )
}

export { JobList }
