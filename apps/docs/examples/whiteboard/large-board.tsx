'use client'

import { Whiteboard, type WhiteboardColor, type WhiteboardScene } from '@youj/react'

const COLORS: WhiteboardColor[] = ['amber', 'blue', 'green', 'accent', 'red']
const TOPICS = ['Onboarding', 'Billing', 'Search', 'Mobile', 'Reports', 'Teams', 'Exports', 'Alerts']

/** A retro wall: 8 columns of 20 notes, a header box over each and connectors between the headers, 200 shapes in all. */
function wall(): WhiteboardScene {
  const shapes: WhiteboardScene['shapes'] = []
  TOPICS.forEach((topic, col) => {
    const x = col * 240
    shapes.push({ id: `h${col}`, type: 'rectangle', color: 'ink', width: 'medium', x, y: 0, w: 200, h: 56 })
    shapes.push({ id: `t${col}`, type: 'text', color: 'ink', width: 'medium', x: x + 20, y: 14, text: topic })
    for (let row = 0; row < 22; row++) {
      shapes.push({
        id: `n${col}-${row}`,
        type: 'sticky',
        color: COLORS[(col + row) % COLORS.length]!,
        width: 'medium',
        x,
        y: 96 + row * 104,
        w: 200,
        h: 88,
        text: `${topic} idea ${row + 1}`,
      })
    }
    if (col) shapes.push({ id: `k${col}`, type: 'connector', color: 'ink', width: 'thin', from: { shape: `h${col - 1}` }, to: { shape: `h${col}` } })
  })
  return { shapes: shapes.slice(0, 200) }
}

const WALL = wall()

export default function WhiteboardLargeBoard() {
  return <Whiteboard defaultValue={WALL} defaultMinimap height={440} className="max-w-3xl" />
}
