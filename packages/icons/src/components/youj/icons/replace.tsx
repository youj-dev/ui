import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * The two arrows chase each other half a turn round the pair, which lands
 * them back on their own shapes, while each box dips as it is swapped. Rest
 * is 180° so leaving mid-turn completes forwards.
 */
export const ReplaceIcon = createIcon({
  name: 'replace',
  category: 'editor',
  keywords: ['find and replace', 'swap', 'exchange', 'substitute', 'switch', 'convert'],
  variants: (k) => {
    const dip = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.7, 1], transition: seq(k, 'slow', [0, 0.45, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      arrows: {
        rest: { rotate: 180, transition: k.tween('base', 'enter') },
        active: { rotate: [0, 180], transition: k.tween('deliberate', 'emphasized') },
      },
      a: dip(0),
      b: dip(1),
    }
  },
  render: (v) => (
    <>
      <m.rect x="3.5" y="3.5" width="6" height="6" rx="1.5" variants={v.a} style={origin(6.5, 6.5)} />
      <m.rect x="14.5" y="14.5" width="6" height="6" rx="1.5" variants={v.b} style={origin(17.5, 17.5)} />
      <m.g variants={v.arrows} style={origin(12, 12)}>
        <path d="M12.5 6.5 H15 A2.5 2.5 0 0 1 17.5 9 V11.5" />
        <path d="M15.5 9.5 L17.5 11.5 L19.5 9.5" />
        <path d="M11.5 17.5 H9 A2.5 2.5 0 0 1 6.5 15 V12.5" />
        <path d="M8.5 14.5 L6.5 12.5 L4.5 14.5" />
      </m.g>
    </>
  ),
})
