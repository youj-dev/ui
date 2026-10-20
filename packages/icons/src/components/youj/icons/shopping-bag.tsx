import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const HANDLE = 'M9 10 V7 A3 3 0 0 1 15 7 V10'
const TAUT = 'M9 10 V5.75 A3 3 0 0 1 15 5.75 V10'

/** Picked up: the handle draws taut first, the bag follows it up a beat later with its weight, then sets back down. */
export const ShoppingBagIcon = createIcon({
  name: 'shopping-bag',
  category: 'commerce',
  keywords: ['bag', 'shop', 'store', 'purchase', 'buy', 'tote', 'order'],
  variants: (k) => {
    const t = [0, 0.3, 0.55, 1]
    return {
      handle: {
        rest: { d: HANDLE, transition: k.tween('fast') },
        active: { d: [HANDLE, TAUT, HANDLE, HANDLE], transition: seq(k, 'deliberate', t, ['exit', 'standard', 'linear']) },
      },
      bag: {
        rest: { y: 0, transition: k.tween('fast') },
        active: { y: [0, 0, -1.25, 0], transition: seq(k, 'deliberate', t, ['linear', 'standard', 'emphasized']) },
      },
    }
  },
  render: (v) => (
    <m.g variants={v.bag}>
      <path d="M5 7.5 H19 L19.83 18.35 A2 2 0 0 1 17.84 20.5 H6.16 A2 2 0 0 1 4.17 18.35 Z" />
      <m.path d={HANDLE} variants={v.handle} />
    </m.g>
  ),
})
