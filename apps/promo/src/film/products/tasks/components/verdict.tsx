'use client'

import { motion } from 'motion/react'
import { MorphLabel, useMorphRoot } from '@youj/motion'
import { AlertTriangleIcon, CheckCircleIcon, CircleDashedIcon } from '@youj/icons'
import { cn } from '@youj/react/lib/utils'
import { daysWord } from '../days'
import type { Verdict as VerdictState } from '../schedule'

/**
 * How the launch stands, in one line: on time (and by how much), late (and
 * what's late), ready, or nothing planned. The chip morphs between states as
 * the plan changes, even mid-drag, and is announced when it does.
 */
export function Verdict({ verdict }: { verdict: VerdictState }) {
  const morph = useMorphRoot(999)
  const text =
    verdict.kind === 'ready'
      ? 'Ready for launch'
      : verdict.kind === 'empty'
        ? 'Nothing planned yet'
        : verdict.kind === 'late'
          ? verdict.tasks.length === 1
            ? `${verdict.tasks[0]!.task.title} lands after launch`
            : `${verdict.tasks.length} tasks land after launch`
          : verdict.spare === 0
            ? 'Lands on the day'
            : `Lands with ${daysWord(verdict.spare)} to spare`
  const icon =
    verdict.kind === 'ready' ? (
      <CheckCircleIcon size={14} strokeWidth={2.25} trigger="mount" />
    ) : verdict.kind === 'late' ? (
      <AlertTriangleIcon size={14} strokeWidth={2.25} trigger="mount" />
    ) : verdict.kind === 'empty' ? (
      <CircleDashedIcon size={14} strokeWidth={2.25} />
    ) : (
      <span className="grid size-3.5 place-items-center">
        <span className="size-2 rounded-full bg-current" />
      </span>
    )
  return (
    <motion.span
      {...morph}
      role="status"
      className={cn(
        'relative inline-flex h-control-sm items-center overflow-hidden rounded-full px-3 text-ui font-medium transition-colors yj-duration-base ease-standard',
        verdict.kind === 'late' ? 'bg-warning-subtle text-warning-text' : verdict.kind === 'empty' ? 'bg-band text-fg-muted' : 'bg-success-subtle text-success-text',
      )}
    >
      <MorphLabel value={text} contentClassName="gap-1.5">
        {icon}
        {text}
      </MorphLabel>
    </motion.span>
  )
}
