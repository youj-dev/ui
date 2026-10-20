import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* The flap is one path whose apex travels straight through the fold line, from
 * pointing up (open) to lying over the pocket (sealed). The fold line itself is
 * only drawn where the flap has passed below it: it is clipped to the region
 * above the flap, and that clip morphs in lockstep with the flap. */
const flap = (apex: number) => `M3 9 L12 ${apex} L21 9`
const above = (apex: number) => `M0 0 H24 V9 H21 L12 ${apex} L3 9 H0 Z`
const OPEN = 3
const SEALED = 15

/** Read ↔ unread. The flap folds down over the letter and the envelope lifts as it seals. `active` = unread. */
export const MailOpenIcon = createIcon({
  name: 'mail-open',
  category: 'communication',
  keywords: ['read', 'unread', 'opened', 'envelope', 'email', 'mark as unread', 'inbox'],
  states: ['read', 'unread'],
  variants: (k) => {
    const fold = k.spring('smooth')
    return {
      flap: { rest: { d: flap(OPEN), transition: fold }, active: { d: flap(SEALED), transition: fold } },
      crease: { rest: { d: above(OPEN), transition: fold }, active: { d: above(SEALED), transition: fold } },
      lift: { rest: { y: 0, transition: fold }, active: { y: -3, transition: fold } },
    }
  },
  render: (v, { id }) => (
    <m.g variants={v.lift}>
      <clipPath id={`${id}-crease`}>
        <m.path d={above(OPEN)} variants={v.crease} />
      </clipPath>
      <path d="M3 9 V19 A2 2 0 0 0 5 21 H19 A2 2 0 0 0 21 19 V9" />
      <path d={flap(SEALED)} />
      <path d="M3 9 H21" clipPath={`url(#${id}-crease)`} />
      <m.path d={flap(OPEN)} variants={v.flap} />
    </m.g>
  ),
})
