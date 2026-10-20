'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import { YoujWordmark } from '@youj/core/docs/brand/youj-logo'

/**
 * The wordmark at page scale. The first time it comes into view, its letters
 * rise into place one by one and its particle lands last. The server
 * renders it assembled; once the page is live and it's still below the fold,
 * it waits hidden. Reduced motion keeps it assembled and still.
 */
export function FooterWordmark() {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.5 })
  const [armed, setArmed] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  useEffect(() => {
    if (!k.reduced && !seen) setArmed(true)
    // Armed once, on mount: later changes only decide whether it plays.
  }, [])

  const play = armed && seen && !k.reduced
  return (
    <div ref={ref} aria-hidden className="text-line-strong" style={{ opacity: armed && !seen && !k.reduced ? 0 : 1 }}>
      <YoujWordmark key={play ? 'drawing' : 'still'} animated={play} className="block h-auto w-full [&_.fill-fg]:fill-current" />
    </div>
  )
}
