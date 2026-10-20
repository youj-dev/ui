import { m } from 'motion/react'
import { createIcon, drawn, seqFor, type IconVariants } from './icon-base'

const LINES = ['M8.5 9.5 H10.5', 'M8.5 13 H15.5', 'M8.5 16.5 H15.5']

/** The text is cleared and retyped line by line, heading first. */
export const FileTextIcon = createIcon({
  name: 'file-text',
  category: 'files',
  keywords: ['document', 'text', 'article', 'notes', 'doc', 'page', 'content'],
  variants: (k): IconVariants => {
    const length = k.duration('deliberate') * 1.25
    return Object.fromEntries(
      LINES.map((_, i) => {
        const start = 0.06 + i * 0.26
        const end = start + 0.4
        return [
          `l${i}`,
          {
            rest: drawn(k),
            active: {
              pathLength: [0, 0, 1, 1],
              opacity: [0, 0, 1, 1],
              transition: {
                pathLength: seqFor(k, length, [0, start, end, 1], ['linear', 'standard', 'linear']),
                opacity: seqFor(k, length, [0, start, start + 0.01, 1], ['linear', 'linear', 'linear']),
              },
            },
          },
        ]
      }),
    )
  },
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      {LINES.map((d, i) => (
        <m.path key={d} d={d} variants={v[`l${i}`]} />
      ))}
    </>
  ),
})
