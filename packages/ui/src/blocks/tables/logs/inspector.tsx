'use client'

import { useId, useMemo } from 'react'
import { BracesIcon, XIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { CodeBlock } from '../../../components/ui/code-block'
import { cn, dateTimeFormat, numberFormat } from '../../../lib/utils'
import { LevelMark } from './columns'
import type { LogsTableCopy, LogsTableEvent } from './data'

/**
 * The event the keyboard is on, in full: its level, service and moment, the
 * message unclipped, its request and duration, and everything it carried as
 * JSON to read or copy. It follows the arrows through the stream at once,
 * without animating, since it changes as fast as you move.
 */
export function Inspector({
  event,
  copy,
  locale,
  headingLevel,
  onClose,
  className,
}: {
  event: LogsTableEvent | null
  copy: LogsTableCopy
  locale: string
  headingLevel: 2 | 3 | 4 | 5
  onClose: () => void
  className?: string
}) {
  const titleId = useId()
  const Heading = `h${headingLevel}` as const
  const when = useMemo(
    () => dateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, hourCycle: 'h23' }),
    [locale],
  )
  const count = useMemo(() => numberFormat(locale), [locale])
  const json = useMemo(() => (event ? JSON.stringify({ id: event.id, time: event.time, level: event.level, ...event.payload }, null, 2) : ''), [event])

  return (
    <aside aria-labelledby={titleId} data-slot="logs-inspector" className={cn('flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xs', className)}>
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-line ps-3 pe-1.5">
        <Heading id={titleId} className="text-ui-sm font-medium text-fg">
          {copy.inspector}
        </Heading>
        {event && <LevelMark level={event.level} label={copy.levels[event.level]} />}
        {event && (
          <Button variant="ghost" size="icon-xs" aria-label={copy.closeInspector} onClick={onClose} className="ms-auto">
            <XIcon />
          </Button>
        )}
      </header>
      {event ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3 yj-scrollbar">
          <p className="font-mono text-ui-sm break-words text-fg">{event.message}</p>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-ui-sm">
            <dt className="text-fg-muted">{copy.columns.time}</dt>
            <dd className="font-mono tabular-nums">
              <time dateTime={event.time}>{when.format(new Date(event.time))}</time>
            </dd>
            <dt className="text-fg-muted">{copy.columns.service}</dt>
            <dd className="font-mono">{event.service}</dd>
            {event.requestId && (
              <>
                <dt className="text-fg-muted">{copy.request}</dt>
                <dd className="truncate font-mono">{event.requestId}</dd>
              </>
            )}
            {event.duration !== undefined && (
              <>
                <dt className="text-fg-muted">{copy.duration}</dt>
                <dd className={cn('font-mono tabular-nums', event.duration >= 1000 && 'text-warning-text')}>{copy.ms(count.format(event.duration))}</dd>
              </>
            )}
          </dl>
          <CodeBlock code={json} language="json" filename={copy.payload} copyLabel={copy.copyJson} className="shrink-0" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <BracesIcon aria-hidden className="size-5 text-fg-subtle" />
          <p className="max-w-52 text-ui-sm text-pretty text-fg-muted">{copy.inspectHint}</p>
        </div>
      )}
    </aside>
  )
}
