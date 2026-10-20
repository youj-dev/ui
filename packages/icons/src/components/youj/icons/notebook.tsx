import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The cover lifts on its rings and falls shut again, the rings giving a little as it does. */
export const NotebookIcon = createIcon({
  name: 'notebook',
  category: 'files',
  keywords: ['journal', 'notes', 'diary', 'notepad', 'log', 'jot'],
  variants: (k) => {
    const ring = (i: number) => ({
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, -0.75, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], i * k.stagger('base')) },
    })
    return {
      cover: {
        rest: { scaleX: 1, transition: k.tween('fast') },
        active: { scaleX: [1, 0.85, 1], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
      },
      r0: ring(0),
      r1: ring(1),
      r2: ring(2),
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.cover} style={origin(5.5, 12)}>
        <rect x="5.5" y="3" width="14" height="18" rx="2" />
        <path d="M9.5 3 V21" />
      </m.g>
      {[7, 12, 17].map((y, i) => (
        <m.path key={y} d={`M3.5 ${y} H7.5`} variants={v[`r${i}` as 'r0']} />
      ))}
    </>
  ),
})
