import { m } from 'motion/react'
import { createIcon, after } from './icon-base'

/** Paying from the wallet: the clasp tab slips open and a card slides up out of the top at a tilt, held while hovered. */
export const WalletIcon = createIcon({
  name: 'wallet',
  category: 'commerce',
  keywords: ['payment', 'money', 'balance', 'billing', 'purse', 'funds', 'crypto'],
  variants: (k) => ({
    tab: {
      rest: { x: 0, transition: after(k, k.duration('fast'), 'base') },
      active: { x: 0.5, transition: k.tween('fast', 'exit') },
    },
    card: {
      rest: { y: 5.5, transition: k.tween('base', 'exit') },
      active: { y: 0, transition: after(k, k.duration('instant'), 'slow', 'enter') },
    },
  }),
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-c`}>
        <rect width="24" height="6" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        <g transform="rotate(-10 10.5 6)">
          <m.path d="M5.5 6.5 V4 A2 2 0 0 1 7.5 2 H13.5 A2 2 0 0 1 15.5 4 V6.5" variants={v.card} />
        </g>
      </g>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <m.g variants={v.tab}>
        <path d="M21 10 H17 A2 2 0 0 0 17 14 H21" />
        <path d="M17 12 h.01" />
      </m.g>
    </>
  ),
})
