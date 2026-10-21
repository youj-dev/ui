'use client'

import { DatePicker } from '../../../components/ui/date-picker'
import { Input } from '../../../components/ui/input'
import { Slider } from '../../../components/ui/slider'
import { Textarea } from '../../../components/ui/textarea'
import { cn } from '../../../lib/utils'
import type { AnswerProps } from './shared'

/* The typed answers. Text is a line or a few (⌘↵ goes on from those), with a
 * counter when it has a limit; email asks the phone for its email keyboard; a
 * date is the kit's DatePicker (typed, or picked from its calendar).
 * A slider shows its value large above the track, and stays unanswered until
 * it's moved: the thumb waits in the middle and the value reads as a dash. */

export function TextAnswer({ question, answer, onAnswer, labelledBy, describedBy, invalid, copy, size }: AnswerProps<'text' | 'email'>) {
  const text = typeof answer === 'string' ? answer : ''
  const email = question.type === 'email'
  const max = question.type === 'text' ? question.maxLength : undefined
  const shared = {
    'data-yj-autofocus': '',
    value: text,
    'aria-label': question.title,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-invalid': invalid || undefined,
    placeholder: question.placeholder ?? (email ? copy.emailPlaceholder : copy.textPlaceholder),
  }
  return (
    <div className="flex flex-col gap-1.5">
      {question.type === 'text' && question.long ? (
        <Textarea {...shared} rows={4} className={cn('min-h-28', size === 'lg' && 'text-ui-lg')} onChange={(event) => onAnswer(event.target.value)} />
      ) : (
        <Input
          {...shared}
          type={email ? 'email' : 'text'}
          autoComplete={email ? 'email' : 'off'}
          inputMode={email ? 'email' : undefined}
          className={cn('h-control-lg', size === 'lg' && 'text-ui-lg')}
          onChange={(event) => onAnswer(event.target.value)}
        />
      )}
      {max && (
        <span aria-hidden className={cn('self-end font-mono text-ui-xs text-fg-subtle tabular-nums', text.length > max && 'text-danger-text')}>
          {text.length}/{max}
        </span>
      )}
    </div>
  )
}

export function DateAnswer({ question, answer, labelledBy, describedBy, onAnswer, size }: AnswerProps<'date'>) {
  return (
    <div role="group" aria-labelledby={labelledBy} aria-describedby={describedBy} className="w-full @md:mx-auto @md:w-56">
      <DatePicker
        // The stage moves focus to its field when the question appears.
        ref={(input) => input?.setAttribute('data-yj-autofocus', '')}
        value={typeof answer === 'string' ? fromIso(answer) : null}
        minDate={question.min ? fromIso(question.min) : undefined}
        maxDate={question.max ? fromIso(question.max) : undefined}
        onValueChange={(date) => onAnswer(date ? toIso(date) : undefined)}
        className={cn(size === 'lg' && 'text-ui-lg')}
      />
    </div>
  )
}

/** Answers keep the yyyy-MM-dd of a native date field; the picker speaks local Dates. */
const fromIso = (iso: string) => {
  const [y = 0, m = 1, d = 1] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function SliderAnswer({ question, answer, onAnswer, labelledBy, describedBy, copy, size }: AnswerProps<'slider'>) {
  const min = question.min ?? 0
  const max = question.max ?? 100
  const step = question.step ?? 1
  const value = typeof answer === 'number' ? answer : undefined
  const middle = min + Math.round((max - min) / 2 / step) * step
  return (
    <div role="group" aria-labelledby={labelledBy} aria-describedby={describedBy} className="flex flex-col gap-3 @md:mx-auto @md:w-full @md:max-w-lg">
      <div aria-hidden className="flex items-baseline justify-center gap-2">
        <span
          className={cn(
            'font-semibold tracking-tight tabular-nums',
            size === 'lg' ? 'text-3xl' : 'text-2xl',
            value === undefined && 'text-fg-subtle',
          )}
        >
          {value === undefined ? '–' : value}
        </span>
        <span className="text-ui text-fg-muted">{value === undefined ? copy.sliderHint : question.unit}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value ?? middle}
        aria-label={question.title}
        getAriaValueText={(_, thumbValue) => (value === undefined ? copy.sliderHint : copy.sliderValue(thumbValue, question.unit))}
        onValueChange={(next) => onAnswer(Array.isArray(next) ? next[0] : (next as number))}
        className={cn(value === undefined && '[&_[data-slot=slider-range]]:opacity-0')}
      />
      {question.labels && (
        <div aria-hidden className="flex justify-between gap-4 text-ui-sm text-fg-muted">
          <span>{question.labels[0]}</span>
          <span className="text-end">{question.labels[1]}</span>
        </div>
      )}
    </div>
  )
}
