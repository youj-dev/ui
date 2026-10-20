import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Looking someone up: the person in the address book nods and the tabs give a little. */
export const ContactIcon = createIcon({
  name: 'contact',
  category: 'people',
  keywords: ['address book', 'contacts', 'directory', 'phonebook', 'profile', 'people'],
  variants: (k) => {
    const tab = (i: number) => ({
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, -0.75, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], i * k.stagger('base')) },
    })
    return {
      head: {
        rest: { y: 0, transition: k.tween('fast') },
        active: { y: [0, 1.25, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.duration('base')) },
      },
      t0: tab(0),
      t1: tab(1),
      t2: tab(2),
    }
  },
  render: (v) => (
    <>
      <rect x="5.5" y="3" width="14" height="18" rx="2" />
      {[7, 12, 17].map((y, i) => (
        <m.path key={y} d={`M3.5 ${y} H5.5`} variants={v[`t${i}` as 't0']} />
      ))}
      <m.circle cx="12.5" cy="10" r="2.5" variants={v.head} />
      <path d="M8.5 17 A4 4 0 0 1 16.5 17" />
    </>
  ),
})
