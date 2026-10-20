import { m } from 'motion/react'
import { createIcon, drawIn, drawOut } from './icon-base'

/** The brackets part and a slash is written between them, so < > becomes </> while hovered. */
export const CodeXmlIcon = createIcon({
  name: 'code-xml',
  category: 'editor',
  keywords: ['code', 'inline code', 'snippet', 'html', 'markup', 'developer', 'tag'],
  variants: (k) => ({
    left: {
      rest: { x: 0, transition: k.spring('snappy') },
      active: { x: -1.25, transition: k.spring('snappy') },
    },
    right: {
      rest: { x: 0, transition: k.spring('snappy') },
      active: { x: 1.25, transition: k.spring('snappy') },
    },
    slash: { rest: drawOut(k, 'fast'), active: drawIn(k, 'base', k.stagger('base'), 'standard') },
  }),
  render: (v) => (
    <>
      <m.path d="M9.5 6.5 L4 12 L9.5 17.5" variants={v.left} />
      <m.path d="M13.5 6 L10.5 18" variants={v.slash} />
      <m.path d="M14.5 6.5 L20 12 L14.5 17.5" variants={v.right} />
    </>
  ),
})
