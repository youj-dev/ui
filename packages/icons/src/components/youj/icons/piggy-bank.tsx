import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Saving: a coin drops through the slot and the next one appears above it. */
export const PiggyBankIcon = createIcon({
  name: 'piggy-bank',
  category: 'commerce',
  keywords: ['savings', 'save money', 'budget', 'deposit', 'piggy bank', 'finance'],
  variants: (k) => ({
    coin: {
      rest: { y: 0, opacity: 1, transition: k.tween('fast') },
      active: { y: [0, 4.5, 4.5, -1, 0], opacity: [1, 0, 0, 0, 1], transition: seq(k, 'deliberate', [0, 0.35, 0.36, 0.6, 1], ['exit', 'linear', 'linear', 'enter']) },
    },
    body: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 0, 0.5, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.45, 1]) },
    },
  }),
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-c`}>
        <rect width="24" height="8.5" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        <m.circle cx="13" cy="3.25" r="1.75" variants={v.coin} />
      </g>
      <m.g variants={v.body}>
        <path d="M5.5 10 C6.5 7.6 9.2 6 12.5 6 C16.6 6 20 8.6 20 12 C20 14 18.8 15.7 17 16.6 V19 H14.5 V17.4 C13.9 17.5 13.2 17.5 12.5 17.5 C11.8 17.5 11.1 17.5 10.5 17.4 V19 H8 V16.6 C7 16 6.1 15.2 5.5 14.25 H3.5 V10 Z" />
        <path d="M11.5 8.5 H14.5" />
        <path d="M16.75 10.75 h.01" strokeWidth={2} />
      </m.g>
    </>
  ),
})
