'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { ArrowDownIcon, PlayIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import type { StageStatus } from '../../../components/ui/stage-rail'
import { cn, numberFormat } from '../../../lib/utils'
import type { StagePipelineCopy, StagePipelineLevel, StagePipelineLog } from './data'

interface LogWellProps {
  id: string
  stage: string
  status: StageStatus
  lines: StagePipelineLog[]
  copy: StagePipelineCopy
  /** Writes a line's time in the stage, in ms. Default: minutes and seconds ('01:12'). */
  stamp?: (ms: number) => string
}

const LEVEL: Record<StagePipelineLevel, string> = {
  info: 'text-fg',
  ok: 'text-success-text',
  warn: 'text-warning-text',
  error: 'text-danger-text',
}
const WELL = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]'

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** The selected stage's output, tailing: it keeps the newest line in view until you scroll up or pause, then counts what arrives meanwhile. */
function LogWell({ id, stage, status, lines, copy, stamp = clock }: LogWellProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const lastTop = useRef(0)
  const [following, setFollowing] = useState(true)
  const [seen, setSeen] = useState(lines.length)
  // While following, everything counts as seen.
  if (following && seen !== lines.length) setSeen(lines.length)
  const unseen = following ? 0 : lines.length - seen
  const count = numberFormat(copy.locale).format(lines.length)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !following) return
    // A new line glides into view; a jump back to the tail (or reduced motion) lands at once.
    if (k.reduced || lines.length <= seen) el.scrollTop = el.scrollHeight
    else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [lines.length, following, k.reduced, seen])

  // Scrolling up is a pause; coming back to the end picks the tail up again.
  const onScroll = () => {
    const el = ref.current
    if (!el) return
    const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 12
    if (el.scrollTop < lastTop.current - 4 && !atEnd) setFollowing(false)
    else if (atEnd && !following) setFollowing(true)
    lastTop.current = el.scrollTop
  }

  const toggle = () => {
    if (following) setSeen(lines.length)
    setFollowing(!following)
  }

  return (
    <div data-slot="stage-log" className="flex flex-col gap-3">
      <div className="flex min-h-7 items-center gap-3">
        <h3 id={`${id}-title`} className="text-ui-sm font-normal text-fg-muted">
          {copy.log(stage)}
        </h3>
        <span className="ms-auto text-ui-sm text-fg-muted tabular-nums">{copy.lines(count, lines.length)}</span>
        <Button variant="secondary" size="xs" onClick={toggle} disabled={lines.length === 0} aria-controls={id}>
          <PlayIcon size={12} active={following} />
          {following ? copy.pause : copy.follow}
        </Button>
      </div>
      <div className="relative">
        <div
          ref={ref}
          id={id}
          role="log"
          aria-labelledby={`${id}-title`}
          aria-live={following ? 'polite' : 'off'}
          tabIndex={0}
          onScroll={onScroll}
          className={cn('yj-scrollbar h-60 overflow-y-auto rounded-xl px-3 py-2.5 font-mono text-ui-sm leading-6 focus-ring sm:px-4', WELL)}
        >
          {lines.length === 0 ? (
            <p className="grid h-full place-items-center font-sans text-ui text-fg-muted">{status === 'skipped' ? copy.skippedLog : copy.queuedLog}</p>
          ) : (
            <ol className="flex flex-col">
              {lines.map((line) => (
                <li
                  key={line.id}
                  data-level={line.level ?? 'info'}
                  className={cn(
                    'grid grid-cols-[--spacing(13)_minmax(0,1fr)] gap-2 rounded-md px-1.5 transition-[opacity,translate] yj-duration-base ease-enter starting:translate-y-1 starting:opacity-0',
                    line.level === 'error' && 'bg-danger-subtle',
                  )}
                >
                  <time className="text-fg-subtle tabular-nums select-none">{stamp(line.at)}</time>
                  <span className={cn('break-words whitespace-pre-wrap', LEVEL[line.level ?? 'info'])}>{line.text}</span>
                </li>
              ))}
              {status === 'running' && (
                <li aria-hidden className="grid grid-cols-[--spacing(13)_minmax(0,1fr)] gap-2 px-1.5">
                  <span />
                  <MotionFeatures>
                    <m.span
                      className="block h-4 w-2 translate-y-1 rounded-[1px] bg-accent"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: k.reduced ? 1 : 0.15 }}
                      transition={k.reduced ? { type: false } : { ...k.tween('slow', 'standard'), repeat: Infinity, repeatType: 'mirror' }}
                    />
                  </MotionFeatures>
                </li>
              )}
            </ol>
          )}
        </div>
        {unseen > 0 && (
          <Button
            variant="secondary"
            size="xs"
            className="absolute start-1/2 bottom-3 -translate-x-1/2 shadow-md rtl:translate-x-1/2"
            onClick={() => setFollowing(true)}
          >
            <ArrowDownIcon size={12} />
            {copy.newLines(unseen)}
          </Button>
        )}
      </div>
    </div>
  )
}

export { LogWell }
