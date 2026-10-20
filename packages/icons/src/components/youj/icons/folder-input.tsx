import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* folder's closed shape, drawn from x 7 so the arrow has room to come in from
 * outside. The left wall opens where the arrow passes through it. */
const BODY = 'M7 15.5 V17.5 A2 2 0 0 0 9 19.5 H19 A2 2 0 0 0 21 17.5 V8.5 A2 2 0 0 0 19 6.5 H7 V10.5'
const TAB = 'M7 6.5 A2 2 0 0 1 9 4.5 H12.5 L14.5 6.5'

/** Move to folder. The arrow slides on into the folder and fades, and a fresh one comes in through the opening. */
export const FolderInputIcon = createIcon({
  name: 'folder-input',
  category: 'files',
  keywords: ['move to folder', 'move', 'import', 'file into', 'organize', 'directory', 'folder-input', 'folder arrow'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [null, 4, -4.5, 0],
        opacity: [null, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <>
      <path d={BODY} />
      <path d={TAB} />
      <m.g variants={v.arrow}>
        <path d="M2.5 13 H12.5" />
        <path d="M9.5 10 L12.5 13 L9.5 16" />
      </m.g>
    </>
  ),
})
