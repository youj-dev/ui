import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/** Any character, any number of times: the star turns a sixth and lands on itself while the dot holds still. Rest is 60° so leaving mid-turn completes forwards. */
export const RegexIcon = createIcon({
  name: 'regex',
  category: 'development',
  keywords: ['regular expression', 'pattern', 'match', 'wildcard', 'search pattern', 'grep'],
  variants: (k) => ({
    star: {
      rest: { rotate: 60, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 60], transition: k.tween('deliberate', 'emphasized') },
    },
  }),
  render: (v) => (
    <>
      <rect x="4" y="15" width="5" height="5" rx="1.5" />
      <m.g variants={v.star} style={origin(15.5, 8.5)}>
        <path d="M15.5 4.5 V12.5" />
        <path d="M12.04 6.5 L18.96 10.5" />
        <path d="M18.96 6.5 L12.04 10.5" />
      </m.g>
    </>
  ),
})
