'use client'

import { useId, useRef, type KeyboardEvent } from 'react'
import { SlidingIndicator } from '@youj/motion'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { SCORES, type FeedbackCopy } from './data'

/* 0–10 as one radio group: a recessed track of eleven keys and a single raised
 * primary key that glides to the chosen score (SlidingIndicator; it jumps under
 * reduced motion). Arrow keys move the choice (Base UI's roving focus) and a
 * digit jumps straight to that score. Each key is a whole-key label around a
 * radio stretched over it, so the radio's own focus ring outlines the key. */

interface NpsScaleProps {
  value: number | null
  onValueChange: (score: number) => void
  /** The id of the question that names the group. */
  labelledBy: string
  copy: FeedbackCopy
}

function NpsScale({ value, onValueChange, labelledBy, copy }: NpsScaleProps) {
  const hintId = useId()
  const group = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: KeyboardEvent) => {
    if (!/^[0-9]$/.test(event.key) || event.metaKey || event.ctrlKey || event.altKey) return
    event.preventDefault()
    const score = Number(event.key)
    onValueChange(score)
    group.current?.querySelectorAll<HTMLElement>('[role=radio]')[score]?.focus()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <RadioGroup
        ref={group}
        value={value === null ? null : String(value)}
        onValueChange={(next) => onValueChange(Number(next))}
        aria-labelledby={labelledBy}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        className="relative isolate grid grid-cols-11 gap-0.5 rounded-lg bg-well p-0.5"
      >
        {SCORES.map((score) => (
          <label
            key={score}
            className={[
              'relative grid h-control cursor-pointer place-items-center rounded-md select-none',
              'text-ui font-medium tabular-nums text-fg-muted',
              'transition-colors yj-duration-fast ease-standard',
              'not-has-data-checked:hover:bg-hover hover:text-fg has-data-checked:text-on-accent',
            ].join(' ')}
          >
            <RadioGroupItem
              value={String(score)}
              aria-label={String(score)}
              className={[
                'absolute inset-0 size-full rounded-md border-0 bg-transparent',
                'data-checked:bg-transparent data-checked:hover:bg-transparent active:scale-100',
                'after:inset-0 pointer-coarse:after:inset-0 *:data-[slot=radio-group-indicator]:hidden',
              ].join(' ')}
            />
            <span aria-hidden className="pointer-events-none relative">
              {score}
            </span>
          </label>
        ))}
        <SlidingIndicator className="rounded-md bg-accent shadow-sm" />
      </RadioGroup>
      <p id={hintId} className="sr-only">
        {copy.scaleHint}
      </p>
      <div aria-hidden className="flex justify-between gap-4 px-0.5 text-ui-sm text-fg-muted">
        <span>{copy.scaleLow}</span>
        <span>{copy.scaleHigh}</span>
      </div>
    </div>
  )
}

export { NpsScale }
