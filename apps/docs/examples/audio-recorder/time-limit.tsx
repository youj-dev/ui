'use client'

import { useMemo } from 'react'
import { AudioRecorder } from '@youj/react'
import { simulatedMicrophone } from './simulated-microphone'

export default function AudioRecorderTimeLimit() {
  const mic = useMemo(() => simulatedMicrophone(), [])
  return (
    <div className="w-full max-w-md">
      <AudioRecorder label="Answer" maxDuration={15} getStream={mic} />
    </div>
  )
}
