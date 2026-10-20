'use client'

import { useRef, type KeyboardEvent } from 'react'
import { Collapse } from '@youj/motion'
import { Checkbox } from '../../../components/ui/checkbox'
import { Field, FieldLabel, FieldTitle } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Kbd } from '../../../components/ui/kbd'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { cn } from '../../../lib/utils'
import { letter, ordered, otherText } from './data'
import { cardPadding, notAShortcut, pickedByPointer, type AnswerProps } from './shared'

/* A choice: a list of cards, each with its letter. Pressing the letter picks
 * it (a single choice then goes on by itself after a beat, as does a click;
 * arrow keys only move the pick, so nobody is carried past a question while
 * looking). A multiple choice takes letters as toggles. "Other" is the next
 * letter and opens a field of its own, whose text is the answer. Options in
 * a randomized question take this respondent's order, and the letters follow
 * what's on screen. */

const OTHER = '\u0000other'

interface ChoiceAnswerProps extends Omit<AnswerProps<'choice'>, 'onAnswer'> {
  /** "Other" is chosen, even before anything is typed in it. */
  otherOpen: boolean
  onAnswer: (answer: string | string[] | undefined, otherOpen?: boolean) => void
  /** Shuffles a randomized question's options (a respondent's id). */
  seed: string
}

export function ChoiceAnswer({
  question,
  answer,
  otherOpen,
  onAnswer,
  onPicked,
  labelledBy,
  describedBy,
  invalid,
  copy,
  size,
  seed,
}: ChoiceAnswerProps) {
  const otherInput = useRef<HTMLInputElement>(null)
  const options = ordered(question.options, question.randomize, `${seed}:${question.id}`)
  const typed = otherText(question, answer)
  const values = Array.isArray(answer) ? answer : []
  const card = cn('w-full', cardPadding(size), size === 'lg' && '*:data-[slot=field]:gap-3')
  const title = cn('font-normal', size === 'lg' && 'text-ui-lg')

  const openOther = () => {
    // A multiple choice keeps what's ticked; a single choice's answer becomes what's typed there.
    onAnswer(question.multiple ? values : typed || undefined, true)
    requestAnimationFrame(() => otherInput.current?.focus())
  }

  const toggle = (value: string, on: boolean) =>
    onAnswer(on ? [...values.filter((v) => v !== value), value] : values.filter((v) => v !== value), otherOpen)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (notAShortcut(event) || !/^[a-z]$/i.test(event.key)) return
    const index = event.key.toUpperCase().charCodeAt(0) - 65
    if (index < options.length) {
      event.preventDefault()
      const value = options[index]!.value
      if (question.multiple) toggle(value, !values.includes(value))
      else {
        onAnswer(value, false)
        onPicked()
      }
    } else if (question.other && index === options.length) {
      event.preventDefault()
      openOther()
    }
  }

  const keyHint = (index: number, on: boolean) => (
    <Kbd aria-hidden className={cn('ms-auto shrink-0 touch:hidden', on && 'bg-accent text-on-accent')}>
      {letter(index)}
    </Kbd>
  )

  const other = question.other && (
    <Collapse open={otherOpen}>
      <div className="pt-2 ps-9">
        <Input
          ref={otherInput}
          data-yj-other=""
          value={typed}
          placeholder={copy.otherPlaceholder}
          aria-label={copy.other}
          aria-invalid={(invalid && otherOpen) || undefined}
          className={size === 'lg' ? 'h-control-lg text-ui-lg' : undefined}
          onChange={(event) => {
            const text = event.target.value
            onAnswer(question.multiple ? [...values.filter((v) => question.options.some((o) => o.value === v)), ...(text ? [text] : [])] : text, true)
          }}
        />
      </div>
    </Collapse>
  )

  if (question.multiple) {
    return (
      <div role="group" aria-labelledby={labelledBy} aria-describedby={describedBy} onKeyDown={onKeyDown} className="flex flex-col gap-2">
        {options.map((option, index) => (
          <FieldLabel key={option.value} className={card}>
            <Field orientation="horizontal">
              <Checkbox checked={values.includes(option.value)} onCheckedChange={(on) => toggle(option.value, on)} />
              <FieldTitle className={title}>{option.label}</FieldTitle>
              {keyHint(index, values.includes(option.value))}
            </Field>
          </FieldLabel>
        ))}
        {question.other && (
          <FieldLabel className={card}>
            <Field orientation="horizontal">
              <Checkbox
                checked={otherOpen}
                onCheckedChange={(on) => {
                  if (on) openOther()
                  else
                    onAnswer(
                      values.filter((v) => question.options.some((o) => o.value === v)),
                      false,
                    )
                }}
              />
              <FieldTitle className={title}>{copy.other}</FieldTitle>
              {keyHint(options.length, otherOpen)}
            </Field>
          </FieldLabel>
        )}
        {other}
      </div>
    )
  }

  return (
    <div className="flex flex-col" onKeyDown={onKeyDown}>
      <RadioGroup
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        value={otherOpen ? OTHER : typeof answer === 'string' ? answer : null}
        onValueChange={(value) => (value === OTHER ? openOther() : onAnswer(value as string, false))}
        onClick={pickedByPointer(onPicked)}
        className="gap-2"
      >
        {options.map((option, index) => (
          <FieldLabel key={option.value} className={card}>
            <Field orientation="horizontal">
              <RadioGroupItem value={option.value} />
              <FieldTitle className={title}>{option.label}</FieldTitle>
              {keyHint(index, !otherOpen && answer === option.value)}
            </Field>
          </FieldLabel>
        ))}
        {question.other && (
          <FieldLabel className={card} data-yj-other="">
            <Field orientation="horizontal">
              <RadioGroupItem value={OTHER} />
              <FieldTitle className={title}>{copy.other}</FieldTitle>
              {keyHint(options.length, otherOpen)}
            </Field>
          </FieldLabel>
        )}
      </RadioGroup>
      {other}
    </div>
  )
}
