import { m } from 'motion/react'
import { createIcon, after, seq } from './icon-base'

/**
 * Empty ↔ item added. A parcel drops in through the open top and lands with a
 * settle while the basket dips on its wheels to take the weight. Removing it
 * lifts it back out. `active` = item in the cart.
 */
export const ShoppingCartIcon = createIcon({
  name: 'shopping-cart',
  category: 'commerce',
  keywords: ['cart', 'basket', 'add to cart', 'checkout', 'shop', 'buy', 'trolley'],
  states: ['empty', 'added'],
  variants: (k) => ({
    item: {
      rest: { y: -7, opacity: 0, transition: { y: k.tween('base', 'exit'), opacity: after(k, k.duration('fast'), 'fast') } },
      active: { y: 0, opacity: 1, transition: { y: k.spring('settle'), opacity: k.tween('fast') } },
    },
    basket: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 1, 0], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized'], k.duration('fast')) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.basket}>
        <path d="M2.5 3.5 H3.68 A1 1 0 0 1 4.66 4.31 L6.51 13.79 A1.5 1.5 0 0 0 7.99 15 H17.33 A1.5 1.5 0 0 0 18.78 13.87 L20.5 7 H5.19" />
        <m.rect x="9.5" y="9" width="6" height="4" rx="1" variants={v.item} />
      </m.g>
      <circle cx="8.5" cy="19.5" r="1" />
      <circle cx="17.5" cy="19.5" r="1" />
    </>
  ),
})
