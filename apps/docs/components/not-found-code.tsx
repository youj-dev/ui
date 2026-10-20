'use client'

import { ScrambleText } from '@youj/motion/components/youj/motion/scramble-text'

/** "404", decoded into place; shown directly under reduced motion. */
export function NotFoundCode() {
  return (
    <ScrambleText glyphs="0123456789" className="type-small font-medium text-accent">
      404
    </ScrambleText>
  )
}
