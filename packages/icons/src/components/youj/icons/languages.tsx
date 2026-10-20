import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* A Latin A (top left, centered on 7 8) and 文, "writing" (bottom right,
 * centered on 17 16): mirror images of each other through the center, so half
 * a turn round (12, 12) lands each one on the other's place. */
const A = ['M3.5 12.5 L7 3.5 L10.5 12.5', 'M4.76 9.25 H9.24']
const WEN = [
  'M17 11.5 V12.75',
  'M13 14 H21',
  'M19.25 14.25 C18.4 17.1 16.2 19.4 13 20.5',
  'M14.75 14.25 C15.6 17.1 17.8 19.4 21 20.5',
]

/**
 * Translate. The two scripts trade places, circling each other clockwise and
 * staying upright as they go; they hold there while hovered and circle back
 * when released.
 */
export const LanguagesIcon = createIcon({
  name: 'languages',
  category: 'communication',
  keywords: ['translate', 'language', 'i18n', 'l10n', 'locale', 'localization', 'multilingual', 'languages'],
  variants: (k) => {
    // The pair turns half a revolution while each glyph turns back as much, on
    // the same spring, so the glyphs orbit without ever tilting.
    const turn = (deg: number) => ({ rest: { rotate: 0, transition: k.spring('smooth') }, active: { rotate: deg, transition: k.spring('smooth') } })
    return { pair: turn(180), upright: turn(-180) }
  },
  render: (v) => (
    <m.g variants={v.pair} style={origin(12, 12)}>
      <m.g variants={v.upright} style={origin(7, 8)}>
        {A.map((d) => (
          <path key={d} d={d} />
        ))}
      </m.g>
      <m.g variants={v.upright} style={origin(17, 16)}>
        {WEN.map((d) => (
          <path key={d} d={d} />
        ))}
      </m.g>
    </m.g>
  ),
})
