import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* The line runs behind both nodes, masked by discs that travel with them, so
 * it never shows through a node in motion. The discs stop at the node's
 * centerline, so the cut hides under the stroke at any stroke width. */

/**
 * History advances: the line scrolls one commit to the left, the current node
 * sliding off and fading as the next arrives from the right and lands in its
 * place.
 */
export const GitCommitIcon = createIcon({
  name: 'git-commit',
  category: 'development',
  keywords: ['commit', 'version control', 'history', 'git', 'revision', 'node'],
  variants: (k) => {
    /* Both nodes ride the same spring, so they stay a fixed 9 apart and never overlap. */
    const node = (restX: number, activeX: number, visibleAt: 'rest' | 'active') => ({
      rest: { x: restX, opacity: visibleAt === 'rest' ? 1 : 0, transition: { x: k.spring('smooth'), opacity: k.tween('base') } },
      active: { x: activeX, opacity: visibleAt === 'active' ? 1 : 0, transition: { x: k.spring('settle'), opacity: k.tween('base') } },
    })
    return { prev: node(0, -9, 'rest'), next: node(9, 0, 'active') }
  },
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.circle cx="12" cy="12" r="3" fill="black" stroke="none" variants={v.prev} />
        <m.circle cx="12" cy="12" r="3" fill="black" stroke="none" variants={v.next} />
      </mask>
      <path d="M3 12 H21" mask={`url(#${id}-m)`} />
      <m.circle cx="12" cy="12" r="3" variants={v.prev} />
      <m.circle cx="12" cy="12" r="3" variants={v.next} />
    </>
  ),
})
