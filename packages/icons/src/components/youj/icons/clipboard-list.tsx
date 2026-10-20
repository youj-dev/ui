import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Ticking through the list: each bullet pops in turn, top to bottom, and the clip snaps down. */
export const ClipboardListIcon = createIcon({
  name: 'clipboard-list',
  category: 'files',
  keywords: ['checklist', 'tasks', 'todo', 'inventory', 'list', 'agenda'],
  variants: (k) => {
    const pop = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0, 1.4, 1], transition: seq(k, 'slow', [0, 0.25, 0.65, 1], ['exit', 'enter', 'standard'], i * k.stagger('loose') * 1.5) },
    })
    return {
      clip: {
        rest: { y: 0, transition: k.tween('fast') },
        active: { y: [0, 1, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
      },
      b0: pop(0),
      b1: pop(1),
      b2: pop(2),
    }
  },
  render: (v) => (
    <>
      <path d="M15.5 4.5 H17 A2 2 0 0 1 19 6.5 V19 A2 2 0 0 1 17 21 H7 A2 2 0 0 1 5 19 V6.5 A2 2 0 0 1 7 4.5 H8.5" />
      <m.g variants={v.clip}>
        <rect x="8.5" y="2.75" width="7" height="3.5" rx="1" />
      </m.g>
      {[10.5, 14, 17.5].map((y, i) => (
        <g key={y}>
          <m.path d={`M8.75 ${y} h.01`} strokeWidth={2} variants={v[`b${i}` as 'b0']} style={origin(8.75, y)} />
          <path d={`M11.5 ${y} H15.5`} />
        </g>
      ))}
    </>
  ),
})
