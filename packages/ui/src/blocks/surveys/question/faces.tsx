'use client'

import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { cn } from '../../../lib/utils'
import { faceLabels, type SurveyAnswer } from './data'
import { pickedByPointer, stretchedRadio, type AnswerProps } from './shared'

/* The emoji scale: three or five faces drawn in the kit's own stroke, so they
 * wear the theme instead of a platform's emoji. A face is a head, two eyes
 * and a mouth whose single curve is its mood, from a frown to a smile. The
 * chosen face lifts and takes the accent while the others step back; a digit
 * key picks a face. Reduced motion: nothing scales. */

const MOODS = { 3: [-1, 0, 1], 5: [-1, -0.5, 0, 0.5, 1] }

/** The mouth for a mood from -1 (a frown) to 1 (a smile): one quadratic curve whose corners lift as it smiles. */
const mouth = (mood: number) => {
  const corner = 15.25 - mood * 0.75
  return `M8.25 ${corner} Q12 ${corner + mood * 4.5} 15.75 ${corner}`
}

export function Face({ mood, className }: { mood: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden className={className}>
      <circle cx={12} cy={12} r={9.25} />
      <circle cx={9} cy={10} r={1.1} fill="currentColor" stroke="none" />
      <circle cx={15} cy={10} r={1.1} fill="currentColor" stroke="none" />
      <path d={mouth(mood)} />
    </svg>
  )
}

export function EmojiAnswer({ question, answer, onAnswer, onPicked, labelledBy, describedBy, copy, size }: AnswerProps<'emoji'>) {
  const k = useYouj()
  const points = question.points ?? 5
  const labels = faceLabels(points, copy)
  const chosen = typeof answer === 'number' ? answer : null

  return (
    <MotionFeatures>
      <RadioGroup
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        value={chosen === null ? null : String(chosen)}
        onValueChange={(value) => onAnswer(Number(value) as SurveyAnswer)}
        onClick={pickedByPointer(onPicked)}
        onKeyDown={(event) => {
          if (event.metaKey || event.ctrlKey || event.altKey || !/^[1-9]$/.test(event.key)) return
          const value = Number(event.key)
          if (value > points) return
          event.preventDefault()
          onAnswer(value)
          onPicked()
        }}
        className={cn('grid gap-1', points === 3 ? 'grid-cols-3 @md:mx-auto @md:w-full @md:max-w-sm' : 'grid-cols-5 @lg:mx-auto @lg:w-full @lg:max-w-lg')}
      >
        {labels.map((label, index) => {
          const value = index + 1
          const on = chosen === value
          return (
            <label
              key={label}
              className={cn(
                'group/face relative flex cursor-pointer flex-col items-center gap-1.5 rounded-lg px-1 pt-2.5 pb-2 select-none',
                'text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg',
                on && 'text-accent-text hover:bg-transparent hover:text-accent-text',
                chosen !== null && !on && 'text-fg-subtle',
              )}
            >
              <RadioGroupItem value={String(value)} aria-label={label} className={stretchedRadio} />
              <m.span
                aria-hidden
                className={cn(
                  'pointer-events-none grid place-items-center rounded-full transition-[translate] yj-duration-fast ease-standard',
                  size === 'lg' ? 'size-12 @md:size-14' : 'size-11',
                  on ? 'bg-accent-subtle' : !k.reduced && 'group-hover/face:-translate-y-0.5',
                )}
                animate={{ scale: k.reduced ? 1 : on ? 1.12 : chosen !== null ? 0.94 : 1 }}
                transition={on ? k.spring('settle') : k.spring('snappy')}
              >
                <Face mood={MOODS[points][index]!} className={size === 'lg' ? 'size-10 @md:size-12' : 'size-9'} />
              </m.span>
              <span aria-hidden className={cn('pointer-events-none text-center text-ui-sm leading-tight', on ? 'font-medium' : '')}>
                {label}
              </span>
            </label>
          )
        })}
      </RadioGroup>
    </MotionFeatures>
  )
}
