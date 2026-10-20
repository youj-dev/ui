'use client'

import { useId, useRef, type KeyboardEvent } from 'react'
import { ThumbsDownIcon, ThumbsUpIcon } from '@youj/icons'
import { Field, FieldLabel, FieldTitle } from '../../../components/ui/field'
import { Kbd } from '../../../components/ui/kbd'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { Rating } from '../../../components/ui/rating'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Slider } from '../../../components/ui/slider'
import { cn } from '../../../lib/utils'
import { cardPadding, notAShortcut, pickedByPointer, type AnswerProps } from './shared'

/* The numeric answers. A scale (NPS's 0–10, or 1–5, 1–7…) is the kit's
 * segmented control: every point on one line, its raised key gliding to the
 * point picked. Where the line can't give each point a fingertip's width (a
 * container under 18rem) the scale is the kit's Slider instead, its value
 * shown large above it. Either way a digit picks a point (1 then 0 is ten)
 * and arrows move it without going on. A rating is the kit's Rating; yes or
 * no is two cards with Y and N. */

export function ScaleAnswer({ question, answer, onAnswer, onPicked, labelledBy, describedBy, copy, size }: AnswerProps<'nps' | 'scale'>) {
  const endsId = useId()
  const lastDigit = useRef<{ digit: number; at: number } | null>(null)
  const nps = question.type === 'nps'
  const min = nps ? 0 : (question.min ?? 1)
  const max = nps ? 10 : Math.min(question.max ?? 5, min + 10)
  const labels = question.labels ?? (nps ? copy.npsLabels : undefined)
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const value = typeof answer === 'number' ? answer : undefined
  const describe = [describedBy, labels && endsId].filter(Boolean).join(' ') || undefined

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (notAShortcut(event) || !/^\d$/.test(event.key)) return
    event.preventDefault()
    let digit = Number(event.key)
    const last = lastDigit.current
    // "1" then "0" quickly is ten.
    if (last?.digit === 1 && digit === 0 && max >= 10 && event.timeStamp - last.at < 700) digit = 10
    lastDigit.current = { digit, at: event.timeStamp }
    if (digit < min || digit > max) return
    onAnswer(digit)
    onPicked()
  }

  return (
    <div className="flex flex-col gap-2" onKeyDown={onKeyDown}>
      {/* One line of keys wherever each can be a fingertip wide. */}
      <div className="hidden @2xs:block" onClick={pickedByPointer(onPicked)}>
        <SegmentedControl
          variant="pill"
          size={size === 'lg' ? 'lg' : 'default'}
          aria-labelledby={labelledBy}
          aria-describedby={describe}
          value={value === undefined ? '' : String(value)}
          onValueChange={(next) => onAnswer(Number(next))}
          // A white track with a hairline, like the answer cards around it, rather than the recessed well.
          className="w-full bg-surface ring-1 ring-line ring-inset *:flex-1"
        >
          {points.map((point) => (
            <SegmentedControlItem key={point} value={String(point)} className="min-w-0 px-0 font-mono tabular-nums">
              {point}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
      {/* Too narrow for that: a slider, its value large above the track. */}
      <div className="flex flex-col gap-2 @2xs:hidden">
        <div aria-hidden className="flex items-baseline justify-center gap-2">
          <span
            className={cn(
              'font-semibold tracking-tight tabular-nums',
              size === 'lg' ? 'text-3xl' : 'text-2xl',
              value === undefined && 'text-fg-subtle',
            )}
          >
            {value ?? '–'}
          </span>
          {value === undefined && <span className="text-ui text-fg-muted">{copy.sliderHint}</span>}
        </div>
        <Slider
          min={min}
          max={max}
          step={1}
          value={value ?? Math.round((min + max) / 2)}
          aria-label={question.title}
          getAriaValueText={(_, thumb) => (value === undefined ? copy.sliderHint : String(thumb))}
          onValueChange={(next) => onAnswer(Array.isArray(next) ? next[0] : (next as number))}
          className={cn(value === undefined && '[&_[data-slot=slider-range]]:opacity-0')}
        />
      </div>
      {labels && (
        <>
          <div aria-hidden className="flex justify-between gap-4 px-0.5 text-ui-sm text-fg-muted">
            <span>{labels[0]}</span>
            <span className="text-end">{labels[1]}</span>
          </div>
          <span id={endsId} className="sr-only">
            {copy.scaleEnds(min, labels[0], max, labels[1])}
          </span>
        </>
      )}
    </div>
  )
}

export function RatingAnswer({ question, answer, onAnswer, onPicked, labelledBy, describedBy, copy, size }: AnswerProps<'rating'>) {
  // A click or a digit is a pick that may go on; arrows only move the stars.
  const deliberate = useRef(false)
  return (
    <div
      className="flex justify-center"
      onPointerDownCapture={() => {
        deliberate.current = true
      }}
      onKeyDownCapture={(event) => {
        deliberate.current = /^\d$/.test(event.key) && !notAShortcut(event)
      }}
    >
      <Rating
        value={typeof answer === 'number' ? answer : 0}
        max={question.max ?? 5}
        size={size === 'lg' ? 'lg' : 'default'}
        unit={copy.ratingUnit}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onValueChange={(value) => {
          onAnswer(value || undefined)
          if (deliberate.current && value) onPicked()
          deliberate.current = false
        }}
      />
    </div>
  )
}

export function YesNoAnswer({ question, answer, onAnswer, onPicked, labelledBy, describedBy, copy, size }: AnswerProps<'yesno'>) {
  const labels = question.labels ?? [copy.yes, copy.no]
  // Each side's key is its label's first letter (Y and N), or A and B when they share one.
  const firsts = labels.map((label) => label.trim().charAt(0).toUpperCase())
  const keys = firsts[0] && firsts[1] && firsts[0] !== firsts[1] ? firsts : ['A', 'B']
  const sides = [
    { value: 'yes', label: labels[0], key: keys[0]!, Icon: ThumbsUpIcon },
    { value: 'no', label: labels[1], key: keys[1]!, Icon: ThumbsDownIcon },
  ]
  const chosen = answer === true ? 'yes' : answer === false ? 'no' : null

  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      value={chosen}
      onValueChange={(value) => onAnswer(value === 'yes')}
      onClick={pickedByPointer(onPicked)}
      onKeyDown={(event) => {
        if (notAShortcut(event)) return
        const side = sides.find((s) => s.key.toLowerCase() === event.key.toLowerCase())
        if (!side) return
        event.preventDefault()
        onAnswer(side.value === 'yes')
        onPicked()
      }}
      className="grid grid-cols-2 gap-2 @md:mx-auto @md:w-full @md:max-w-md"
    >
      {sides.map(({ value, label, key, Icon }) => (
        <FieldLabel key={value} className={cn('w-full', cardPadding(size))}>
          <Field orientation="horizontal">
            <RadioGroupItem value={value} />
            <Icon size={16} aria-hidden className={cn('shrink-0', chosen === value ? 'text-accent-text' : 'text-fg-muted')} />
            <FieldTitle className={cn('font-normal', size === 'lg' && 'text-ui-lg')}>{label}</FieldTitle>
            <Kbd aria-hidden className={cn('ms-auto shrink-0 touch:hidden', chosen === value && 'bg-accent text-on-accent')}>
              {key}
            </Kbd>
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
}
