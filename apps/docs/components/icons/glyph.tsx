'use client'

import { createElement, memo, useEffect, useState, type ReactNode } from 'react'
import { IconSwap, type IconSwapTransition } from '@youj/icons'
import type { Entry, IconEntry } from './catalog'
import { reactProps, type IconNode } from './static-svg'

/* How an entry draws. At rest a Youj icon is its build-time snapshot as
 * plain SVG elements, so a grid
 * of hundreds costs no motion at all. The live component (choreography,
 * YoujIcon, IconSwap) mounts only when a tile is asked to move: hovered,
 * focused, looping, or in the morph wave. */

function renderNodes(nodes: IconNode[]): ReactNode[] {
  return nodes.map(([tag, attrs, children], i) => createElement(tag, { key: i, ...reactProps(attrs) }, children.length ? renderNodes(children) : undefined))
}

interface Size {
  size: number
  strokeWidth: number
}

/** A Youj icon at rest, as plain SVG. */
export const StaticGlyph = memo(function StaticGlyph({ nodes, size, strokeWidth }: Size & { nodes: IconNode[] }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden
      className="shrink-0"
    >
      {renderNodes(nodes)}
    </svg>
  )
})

/** An icon entry at rest. */
export function RestGlyph({ entry, size, strokeWidth }: Size & { entry: IconEntry }) {
  return <StaticGlyph nodes={entry.nodes} size={size} strokeWidth={strokeWidth} />
}

/**
 * True a frame after mount. A controlled icon that mounts already active
 * jumps to its pose; mounting at rest and then turning on plays it.
 */
function useArmed() {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return armed
}

export interface LiveProps extends Size {
  entry: Entry
  /** Held on (hovered, focused, waved); ignored while looping. */
  active: boolean
  loop: boolean
  transition: IconSwapTransition
}

/** An entry that moves: its own choreography or an IconSwap between a pair. */
export function LiveGlyph({ entry, size, strokeWidth, active, loop, transition }: LiveProps) {
  const armed = useArmed()
  const on = armed && active
  const play = loop ? ({ trigger: 'loop' } as const) : ({ active: on } as const)
  if (entry.kind === 'youj') {
    const { Icon } = entry
    return <Icon size={size} strokeWidth={strokeWidth} {...play} />
  }
  return <IconSwap from={entry.from.Icon} to={entry.to.Icon} transition={transition} size={size} strokeWidth={strokeWidth} {...play} />
}

export interface GlyphProps extends LiveProps {
  live: boolean
}

/** Rest or live, whichever the tile needs right now. */
export function Glyph({ live, ...props }: GlyphProps) {
  if (live) return <LiveGlyph {...props} />
  const { entry, size, strokeWidth } = props
  return <RestGlyph entry={entry.kind === 'pair' ? entry.from : entry} size={size} strokeWidth={strokeWidth} />
}
