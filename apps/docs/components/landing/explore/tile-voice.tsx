'use client'

import { useRef } from 'react'
import { VoiceCall } from '@youj/react/blocks/app/voice-call'
import { Demo, useQuietRegions } from './demo'

/** VoiceOrb in the voice-call card: the block's own simulated support call, with mute, volume and End call working. Its captions loop, so their live region is quiet. */
export default function VoiceTile() {
  const root = useRef<HTMLDivElement>(null)
  useQuietRegions(root, '[data-slot="voice-call-caption"]')
  return (
    <Demo>
      <div ref={root} className="w-full max-w-sm">
        <VoiceCall demoMarker={false} fill />
      </div>
    </Demo>
  )
}
