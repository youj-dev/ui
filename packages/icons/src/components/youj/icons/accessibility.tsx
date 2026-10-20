import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Universal access: the figure raises both arms in a small cheer and lowers them again. */
export const AccessibilityIcon = createIcon({
  name: 'accessibility',
  category: 'people',
  keywords: ['a11y', 'universal access', 'inclusive', 'disability', 'assistive', 'person'],
  variants: (k) => ({
    arms: {
      rest: { d: 'M7.5 10 L12 11 L16.5 10', transition: k.tween('fast') },
      active: {
        d: ['M7.5 10 L12 11 L16.5 10', 'M7.75 7.75 L12 11 L16.25 7.75', 'M7.5 10 L12 11 L16.5 10'],
        transition: seq(k, 'deliberate', [0, 0.4, 1], ['emphasized', 'emphasized']),
      },
    },
    head: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -0.5, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['emphasized', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.circle cx="12" cy="7.25" r="1.25" variants={v.head} />
      <m.path d="M7.5 10 L12 11 L16.5 10" variants={v.arms} />
      <path d="M12 11 V14" />
      <path d="M9.5 18 L12 14 L14.5 18" />
    </>
  ),
})
