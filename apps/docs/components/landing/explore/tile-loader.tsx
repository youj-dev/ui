'use client'

import { useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { LoaderDraft } from '@youj/loaders/draft'
import { ScrambleText } from '@youj/motion'
import { useLoop, usePlaying } from '@/components/landing/use-loop'
import { Demo } from './demo'

const STEPS = ['LOADING', 'SYNCING', 'ALMOST THERE']

/** Draft, the loaders' flagship, in a small card with a status line that scrambles from step to step while it's seen. */
export default function LoaderTile() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const playing = usePlaying(root)
  const [step, setStep] = useState(0)
  useLoop(root, k.ms('deliberate') * 4, () => setStep((n) => (n + 1) % STEPS.length))
  return (
    <Demo>
      <div ref={root} className="w-full max-w-52">
        <div className="explore-box flex flex-col items-center gap-3 text-fg">
          <LoaderDraft size={96} label={null} paused={!playing} fps={30} />
          <ScrambleText trigger="change" className="font-mono text-ui-xs tracking-[0.18em] text-fg-muted">
            {STEPS[step]!}
          </ScrambleText>
        </div>
      </div>
    </Demo>
  )
}
