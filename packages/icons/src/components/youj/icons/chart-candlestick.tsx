import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The market moves: each candle rises or falls a little, out of step with its neighbours. */
export const ChartCandlestickIcon = createIcon({
  name: 'chart-candlestick',
  category: 'data',
  keywords: ['candlestick', 'stocks', 'trading', 'market', 'finance', 'ohlc'],
  variants: (k) => {
    const bob = (i: number) => ({
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, i % 2 ? 1.25 : -1.25, 0], transition: seq(k, 'deliberate', [0, 0.45, 1], ['standard', 'emphasized'], i * k.stagger('loose')) },
    })
    return { c0: bob(0), c1: bob(1), c2: bob(2) }
  },
  render: (v) => (
    <>
      <m.g variants={v.c0}>
        <path d="M7 5.5 V8" />
        <path d="M7 14 V16.5" />
        <rect x="5.5" y="8" width="3" height="6" rx="0.75" />
      </m.g>
      <m.g variants={v.c1}>
        <path d="M12 8.5 V11" />
        <path d="M12 17 V19.5" />
        <rect x="10.5" y="11" width="3" height="6" rx="0.75" />
      </m.g>
      <m.g variants={v.c2}>
        <path d="M17 4 V6" />
        <path d="M17 11 V14" />
        <rect x="15.5" y="6" width="3" height="5" rx="0.75" />
      </m.g>
    </>
  ),
})
