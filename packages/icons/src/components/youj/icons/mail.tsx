import { m } from 'motion/react'
import { createIcon, after } from './icon-base'

const CLOSED = 'M3.5 7 L12 13 L20.5 7'
const OPEN = 'M3.5 7 L12 7 L20.5 7'

/** The flap flattens open and a letter's lines rise out of the envelope. */
export const MailIcon = createIcon({
  name: 'mail',
  category: 'communication',
  keywords: ['email', 'envelope', 'message', 'inbox', 'letter'],
  variants: (k) => {
    const line = (delay: number) => ({
      rest: { y: 3, opacity: 0, transition: k.tween('fast', 'exit') },
      active: { y: 0, opacity: 1, transition: after(k, delay, 'slow', 'emphasized') },
    })
    return {
      flap: {
        rest: { d: CLOSED, transition: after(k, k.duration('instant'), 'base') },
        active: { d: OPEN, transition: k.tween('base', 'standard') },
      },
      l1: line(k.duration('fast')),
      l2: line(k.duration('fast') + k.stagger('base')),
    }
  },
  render: (v) => (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <m.path d={CLOSED} variants={v.flap} />
      <m.path d="M7.5 11 H16.5" variants={v.l1} />
      <m.path d="M7.5 14.5 H13" variants={v.l2} />
    </>
  ),
})
