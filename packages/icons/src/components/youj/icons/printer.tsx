import { m } from 'motion/react'
import { createIcon, seqFor } from './icon-base'

/** The sheet is drawn back in and fed out again, printed line first, while the status light blinks. */
export const PrinterIcon = createIcon({
  name: 'printer',
  category: 'files',
  keywords: ['print', 'paper', 'output', 'document', 'hard copy'],
  variants: (k) => {
    const length = k.duration('deliberate') * 1.3
    return {
      paper: {
        rest: { y: 0, transition: k.tween('fast') },
        active: { y: [0, -5.5, 0], transition: seqFor(k, length, [0, 0.2, 1], ['exit', 'standard']) },
      },
      light: {
        rest: { opacity: 1, transition: k.tween('fast') },
        active: {
          opacity: [1, 0.2, 1, 0.2, 1],
          transition: seqFor(k, length, [0, 0.3, 0.5, 0.7, 0.9], ['linear', 'linear', 'linear', 'linear']),
        },
      },
    }
  },
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-slot`}>
        <rect x="0" y="16.5" width="24" height="7.5" />
      </clipPath>
      <path d="M7 8 V4 A1 1 0 0 1 8 3 H16 A1 1 0 0 1 17 4 V8" />
      <path d="M7 16.5 H5 A2 2 0 0 1 3 14.5 V10 A2 2 0 0 1 5 8 H19 A2 2 0 0 1 21 10 V14.5 A2 2 0 0 1 19 16.5 H17" />
      <m.path d="M17.5 11.5 h.01" strokeWidth={2} variants={v.light} />
      <g clipPath={`url(#${id}-slot)`}>
        <m.g variants={v.paper}>
          <path d="M7 12 V20 A1 1 0 0 0 8 21 H16 A1 1 0 0 0 17 20 V12" />
          <path d="M9.5 18.5 H14.5" />
        </m.g>
      </g>
    </>
  ),
})
