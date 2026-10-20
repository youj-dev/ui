import { m } from 'motion/react'
import { createIcon, origin, seq, type IconVariants } from './icon-base'

const KEYS = [
  [6, 9],
  [10, 9],
  [14, 9],
  [18, 9],
  [8, 12],
  [12, 12],
  [16, 12],
] as const
/* A word's worth of keystrokes: which key, and when (in stagger steps). The
 * uneven gaps are what make it read as typing rather than a wave. */
const STROKES: Record<number, number> = { 1: 0, 4: 1, 2: 2.2, 6: 3, 0: 4.3 }

/** Typing: keys dip in a quick, uneven rhythm like a word being typed, then the space bar lands. */
export const KeyboardIcon = createIcon({
  name: 'keyboard',
  category: 'devices',
  keywords: ['type', 'keys', 'input', 'shortcut', 'hotkey', 'device'],
  variants: (k): IconVariants => {
    const s = k.stagger('loose')
    const press = (delay: number) => ({
      rest: { scale: 1, opacity: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.3, 1], opacity: [null, 0.35, 1], transition: seq(k, 'base', [0, 0.3, 1], ['exit', 'enter'], delay) },
    })
    const keys: IconVariants = Object.fromEntries(Object.entries(STROKES).map(([i, step]) => [`k${i}`, press(step * s)]))
    return {
      ...keys,
      space: {
        rest: { scaleX: 1, y: 0, transition: k.tween('fast') },
        active: { scaleX: [null, 0.75, 1], y: [null, 0.75, 0], transition: seq(k, 'base', [0, 0.3, 1], ['exit', 'enter'], 5.4 * s) },
      },
    }
  },
  render: (v) => (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      {KEYS.map(([x, y], i) => (
        <m.path key={i} d={`M${x} ${y} h.01`} strokeWidth={2} variants={v[`k${i}`]} style={origin(x, y)} />
      ))}
      <m.path d="M8 15 H16" variants={v.space} style={origin(12, 15)} />
    </>
  ),
})
