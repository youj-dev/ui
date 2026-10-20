'use client'

import { useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { TextEffect } from '@youj/motion'
import { useLoop } from '@/components/landing/use-loop'

const WORDS = ['beautiful.', 'accessible.', 'alive.', 'yours.']

/** The title's last word, typed out and erased in turn while the hero is seen, each in a theme's color (styles/site.css
 * `.hero-word`). Screen readers hear the first only. */
export function HeroWord() {
  const k = useYouj()
  const root = useRef<HTMLSpanElement>(null)
  const [at, setAt] = useState(0)
  useLoop(root, k.ms('deliberate') * 5, () => setAt((i) => (i + 1) % WORDS.length))
  return (
    <span ref={root} data-word={at} className="hero-word">
      <span className="sr-only">{WORDS[0]}</span>
      <TextEffect aria-hidden effect="terminal" erase inView={false} text={WORDS[at]!} />
    </span>
  )
}
