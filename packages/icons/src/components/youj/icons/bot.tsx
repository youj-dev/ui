import { m } from 'motion/react'
import { after, createIcon, origin, seq } from './icon-base'

/* Each eye is one cubic in both states: a closed lid curving down, or an
 * open eye standing upright, so it opens by turning and straightening. */
const EYES = [
  ['M8.25 13.5 C8.75 14.25 10.25 14.25 10.75 13.5', 'M9.5 12.5 C9.5 13.17 9.5 13.83 9.5 14.5'],
  ['M13.25 13.5 C13.75 14.25 15.25 14.25 15.75 13.5', 'M14.5 12.5 C14.5 13.17 14.5 13.83 14.5 14.5'],
] as const

/**
 * Asleep ↔ awake, for an assistant or agent coming online. The eyes open by
 * straightening from closed lids, the head gives a small hop and the
 * antenna light comes on; putting it to sleep closes the eyes and the light
 * goes out. `active` = awake.
 */
export const BotIcon = createIcon({
  name: 'bot',
  category: 'ai',
  keywords: ['ai', 'assistant', 'agent', 'robot', 'chatbot', 'automation', 'copilot', 'model'],
  states: ['asleep', 'awake'],
  variants: (k) => {
    const eye = (closed: string, open: string, i: number) => ({
      rest: { d: closed, transition: k.tween('slow', 'emphasized') },
      active: { d: open, transition: { ...k.spring('snappy'), delay: k.duration('fast') + i * k.stagger('tight') } },
    })
    return {
      head: {
        rest: { y: 0, transition: k.tween('base') },
        active: { y: [null, -1, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized'], k.duration('fast')) },
      },
      e0: eye(EYES[0][0], EYES[0][1], 0),
      e1: eye(EYES[1][0], EYES[1][1], 1),
      light: {
        rest: { opacity: 0, scale: 1, transition: k.tween('fast', 'exit') },
        active: { opacity: 1, scale: [null, 1.6, 1], transition: { opacity: after(k, k.duration('base'), 'fast'), scale: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized'], k.duration('base')) } },
      },
    }
  },
  render: (v) => (
    <m.g variants={v.head}>
      <path d="M12 8 V5.5" />
      <circle cx="12" cy="4.5" r="1" />
      <m.circle cx="12" cy="4.5" r="1" fill="currentColor" variants={v.light} style={origin(12, 4.5)} />
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M2.5 13.5 H5 M19 13.5 H21.5" />
      <m.path d={EYES[0][0]} variants={v.e0} />
      <m.path d={EYES[1][0]} variants={v.e1} />
    </m.g>
  ),
})
