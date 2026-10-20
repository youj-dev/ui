'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSound } from '@youj/core'
import { justTurnedOn } from '@/lib/site-sound'

/* Loaded only once the visitor turns sound on (app/providers.tsx): this
 * module is the one that brings @youj/sound, its player and the Beacon pack
 * into the page. The root provider plays the pack at its normalised level,
 * and the visitor asked for sound with the toggle, so it plays under reduced
 * motion too: reduced motion isn't a request for silence. */

export { beacon } from '@youj/sound'

/** Answers the press that turned sound on, once the pack can play. */
export function SoundAnswer() {
  const sound = useSound()
  const latest = useRef(sound)
  useLayoutEffect(() => {
    latest.current = sound
  })
  const ready = sound.enabled && !sound.muted

  useEffect(() => {
    if (!ready || !justTurnedOn()) return
    // The pack is still on its way: try each frame until it plays, or give up while it would still belong to the press.
    let frame = requestAnimationFrame(function attempt() {
      if (!latest.current.play('toggleOn') && justTurnedOn(700)) frame = requestAnimationFrame(attempt)
    })
    return () => cancelAnimationFrame(frame)
  }, [ready])

  return null
}
