'use client'

import { useEffect, useRef } from 'react'
import { MiniatureTurntable, type MiniatureTurntableHandle } from '@youj/miniatures/turntable'
import { usePlaying } from '@/components/landing/use-loop'
import { Demo } from './demo'

/** The turntable, playing while it's seen: click or focus it and its keys work (Space starts and stops, C cues the arm). */
export default function MiniatureTile() {
  const root = useRef<HTMLDivElement>(null)
  const handle = useRef<MiniatureTurntableHandle>(null)
  const playing = usePlaying(root)
  useEffect(() => {
    if (playing) handle.current?.play()
    else handle.current?.pause()
  }, [playing])
  return (
    <Demo>
      <div ref={root} className="grid size-full place-items-center">
        <MiniatureTurntable ref={handle} size="min(100%, 11.5rem)" />
      </div>
    </Demo>
  )
}
