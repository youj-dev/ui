import { m } from 'motion/react'
import { createIcon, origin, type IconVariants } from './icon-base'

/* message's bubble. The first line of text is two halves that meet in the
 * middle; typing, each half shrinks into an outer dot and the short second
 * line into the middle one, all three landing on the bubble's center line.
 * Each dot also scales up by a third round its own center, which takes its
 * stroke from the text's 1.5 to the 2 that message's dots use. */
const PARTS = [
  { text: 'M8 9 L12 9', dot: 'M8 10.5 L8.01 10.5', x: 8 },
  { text: 'M12 9 L16 9', dot: 'M16 10.5 L16.01 10.5', x: 16 },
  { text: 'M8 12.5 L13 12.5', dot: 'M12 10.5 L12.01 10.5', x: 12 },
]

/**
 * Message ↔ typing. The lines of text draw together into the three dots of
 * a typing indicator; when the reply lands they spread back out into text.
 * `active` = typing.
 */
export const MessageDotsIcon = createIcon({
  name: 'message-dots',
  category: 'communication',
  keywords: ['typing', 'typing indicator', 'chat', 'message', 'reply', 'composing', 'thinking'],
  states: ['message', 'typing'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      PARTS.map(({ text, dot }, i) => [
        `p${i}`,
        {
          rest: { d: text, scale: 1, transition: k.spring('snappy') },
          active: { d: dot, scale: 4 / 3, transition: { ...k.spring('snappy'), delay: i * k.stagger('tight') } },
        },
      ]),
    ),
  render: (v) => (
    <>
      <path d="M4 6 A2 2 0 0 1 6 4 H18 A2 2 0 0 1 20 6 V15 A2 2 0 0 1 18 17 H11 L7 20.5 V17 H6 A2 2 0 0 1 4 15 Z" />
      {PARTS.map(({ text, x }, i) => (
        <m.path key={text} d={text} variants={v[`p${i}`]} style={origin(x, 10.5)} />
      ))}
    </>
  ),
})
