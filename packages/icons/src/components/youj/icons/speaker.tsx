import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Playing: the woofer thumps twice and the tweeter flickers with it. */
export const SpeakerIcon = createIcon({
  name: 'speaker',
  category: 'devices',
  keywords: ['speaker', 'audio', 'sound', 'loudspeaker', 'music', 'hi-fi'],
  variants: (k) => ({
    woofer: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 1.18, 0.96, 1.12, 1], transition: seq(k, 'deliberate', [0, 0.18, 0.36, 0.54, 1], ['enter', 'standard', 'enter', 'emphasized']) },
    },
    tweeter: {
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0.3, 1, 0.3, 1], transition: seq(k, 'deliberate', [0, 0.18, 0.36, 0.54, 1]) },
    },
  }),
  render: (v) => (
    <>
      <rect x="5" y="2.5" width="14" height="19" rx="2" />
      <m.path d="M12 7 h.01" strokeWidth={2} variants={v.tweeter} />
      <m.circle cx="12" cy="14.5" r="3.5" variants={v.woofer} style={origin(12, 14.5)} />
    </>
  ),
})
