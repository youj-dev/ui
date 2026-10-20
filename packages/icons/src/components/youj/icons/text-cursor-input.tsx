import { m } from 'motion/react'
import { createIcon, seqFor } from './icon-base'

/* A text field holding a short word and the caret after it. Typing, the
 * caret keeps its gap to the end of the text, so it moves by the text's
 * length at each keystroke. */
const TEXT = 'M6.5 12 H11.5'
const WORD = 5
const TIMES = [0, 0.08, 0.2, 0.23, 0.33, 0.36, 0.46, 0.49, 1]
const TYPED = [null, 0, 0, 1 / 3, 1 / 3, 2 / 3, 2 / 3, 1, 1]

/**
 * The word is deleted back to the caret, typed again in three keystrokes
 * with the caret stepping along behind it, and the caret blinks twice.
 */
export const TextCursorInputIcon = createIcon({
  name: 'text-cursor-input',
  category: 'editor',
  keywords: ['input', 'text field', 'textbox', 'form', 'caret', 'cursor', 'type', 'field', 'text-cursor-input'],
  variants: (k) => {
    const length = k.duration('deliberate') * 2
    const steps = seqFor(k, length, TIMES, ['exit', 'linear', 'standard', 'linear', 'standard', 'linear', 'standard', 'linear'])
    return {
      text: {
        rest: { pathLength: 1, opacity: 1, transition: k.tween('fast') },
        active: {
          pathLength: TYPED,
          opacity: [null, 1, 0, 0, 1, 1],
          transition: { pathLength: steps, opacity: seqFor(k, length, [0, 0.07, 0.08, 0.2, 0.21, 1], ['linear', 'linear', 'linear', 'linear', 'linear']) },
        },
      },
      caret: {
        rest: { x: 0, opacity: 1, transition: k.tween('fast') },
        active: {
          x: TYPED.map((t) => (t === null ? null : (t - 1) * WORD)),
          opacity: [null, 1, 0, 0, 1, 1, 0, 0, 1, 1],
          transition: {
            x: steps,
            opacity: seqFor(k, length, [0, 0.56, 0.57, 0.66, 0.67, 0.76, 0.77, 0.86, 0.87, 1], Array(9).fill('linear')),
          },
        },
      },
    }
  },
  render: (v) => (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="2" />
      <m.path d={TEXT} variants={v.text} />
      <m.path d="M14 9.5 V14.5" variants={v.caret} />
    </>
  ),
})
