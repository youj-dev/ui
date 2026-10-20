import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Comparing: each arrow pushes toward the other branch and draws back, crossing the same beat, while both heads nod in. */
export const GitCompareIcon = createIcon({
  name: 'git-compare',
  category: 'development',
  keywords: ['diff', 'compare', 'git', 'changes', 'review', 'code diff', 'merge'],
  variants: (k) => {
    const t = seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'])
    const push = (dx: number, dy: number) => ({ rest: { x: 0, y: 0, transition: k.tween('fast') }, active: { x: [null, dx, 0], y: [null, dy, 0], transition: t } })
    const node = { rest: { scale: 1, transition: k.tween('fast') }, active: { scale: [null, 0.75, 1], transition: seq(k, 'base', [0, 0.4, 1], ['exit', 'emphasized'], k.duration('fast')) } }
    return { top: push(-1, 0), bottom: push(1, 0), nodeA: node, nodeB: node }
  },
  render: (v) => (
    <>
      <m.circle cx="6" cy="6" r="2.5" variants={v.nodeA} style={origin(6, 6)} />
      <m.circle cx="18" cy="18" r="2.5" variants={v.nodeB} style={origin(18, 18)} />
      <path d="M12 6 H16 A2 2 0 0 1 18 8 V15.5" />
      <path d="M12 18 H8 A2 2 0 0 1 6 16 V8.5" />
      <m.path d="M14.5 3.5 L12 6 L14.5 8.5" variants={v.top} />
      <m.path d="M9.5 15.5 L12 18 L9.5 20.5" variants={v.bottom} />
    </>
  ),
})
