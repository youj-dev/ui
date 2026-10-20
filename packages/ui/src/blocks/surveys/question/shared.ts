import type { KeyboardEvent, MouseEvent } from 'react'
import type { QuestionCopy, SurveyAnswer, SurveyQuestionOf, SurveyQuestionType } from './data'

/** What every answer control takes: its question, the answer, and how it reports a change or a deliberate pick. */
export interface AnswerProps<T extends SurveyQuestionType> {
  question: SurveyQuestionOf<T>
  answer: SurveyAnswer | undefined
  onAnswer: (answer: SurveyAnswer | undefined) => void
  /** A deliberate pick (a click, a letter or a digit) on a question that takes one answer: the survey may go on after a beat. */
  onPicked: () => void
  /** The question's title, which names the control. */
  labelledBy: string
  /** Its description and error. */
  describedBy?: string
  invalid: boolean
  copy: QuestionCopy
  /** `lg` for a question on a screen of its own (larger keys and faces). */
  size: 'default' | 'lg'
}

/** A click picks and carries the survey on; a key press inside (Space, arrows) only picks. */
export const pickedByPointer = (onPicked: () => void) => (event: MouseEvent) => {
  if (event.detail > 0 && !(event.target as HTMLElement).closest('[data-yj-other]')) onPicked()
}

/** Typing in a field, or a key with a modifier: never a shortcut. */
export const notAShortcut = (event: KeyboardEvent) =>
  event.defaultPrevented ||
  event.metaKey ||
  event.ctrlKey ||
  event.altKey ||
  (event.target as HTMLElement).matches('input:not([type=radio]):not([type=checkbox]), textarea, [contenteditable]')

/** A radio stretched over its whole key or face: the key is the target, the radio's own focus ring outlines it, and its dot is hidden. */
export const stretchedRadio = [
  'absolute inset-0 size-full rounded-[inherit] border-0 bg-transparent',
  'data-checked:bg-transparent data-checked:hover:bg-transparent active:scale-100',
  'after:inset-0 touch:after:inset-0 *:data-[slot=radio-group-indicator]:hidden',
].join(' ')

/** A choice card's padding: roomier on a question of its own. */
export const cardPadding = (size: 'default' | 'lg') =>
  size === 'lg' ? '*:data-[slot=field]:px-3.5 *:data-[slot=field]:py-3' : '*:data-[slot=field]:px-3 *:data-[slot=field]:py-2.5'
