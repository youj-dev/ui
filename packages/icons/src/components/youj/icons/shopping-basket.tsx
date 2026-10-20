import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Added to the basket: it dips under the weight and the handles swing back. */
export const ShoppingBasketIcon = createIcon({
  name: 'shopping-basket',
  category: 'commerce',
  keywords: ['basket', 'groceries', 'shop', 'add to basket', 'cart', 'checkout'],
  variants: (k) => ({
    basket: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.25, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.basket}>
      <path d="M3.5 10.5 H20.5 L18.75 19 A2 2 0 0 1 16.8 20.5 H7.2 A2 2 0 0 1 5.25 19 Z" />
      <path d="M7.5 10.5 L10.5 4.5" />
      <path d="M16.5 10.5 L13.5 4.5" />
      <path d="M9.5 13.5 V17.5" />
      <path d="M14.5 13.5 V17.5" />
    </m.g>
  ),
})
