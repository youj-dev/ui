'use client'

import { useMemo } from 'react'
import { AudioRecorder } from '@youj/react'
import { simulatedMicrophone } from './simulated-microphone'

/** Stands in for an upload: in an app, send the Blob to your server here. */
const upload = (_blob: Blob) => new Promise((done) => setTimeout(done, 900))

export default function AudioRecorderDemo() {
  const mic = useMemo(() => simulatedMicrophone(), [])
  return (
    <div className="w-full max-w-md">
      <AudioRecorder label="Voice note" getStream={mic} onRecordingComplete={upload} />
    </div>
  )
}
