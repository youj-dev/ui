import { m } from 'motion/react'
import { createIcon, origin, seqFor } from './icon-base'

/** The message plays: the two reels draw in on the tape and let it out again. */
export const VoicemailIcon = createIcon({
  name: 'voicemail',
  category: 'communication',
  keywords: ['voicemail', 'message', 'recording', 'tape', 'answering machine', 'voice note'],
  variants: (k) => ({
    left: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, 0.75, 0], transition: seqFor(k, k.duration('deliberate') * 1.5, [0, 0.5, 1]) },
    },
    right: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, -0.75, 0], transition: seqFor(k, k.duration('deliberate') * 1.5, [0, 0.5, 1]) },
    },
    tape: {
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [1, 0.86, 1], transition: seqFor(k, k.duration('deliberate') * 1.5, [0, 0.5, 1]) },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="6.5" cy="12" r="3.75" variants={v.left} />
      <m.circle cx="17.5" cy="12" r="3.75" variants={v.right} />
      <m.path d="M6.5 15.75 H17.5" variants={v.tape} style={origin(12, 15.75)} />
    </>
  ),
})
