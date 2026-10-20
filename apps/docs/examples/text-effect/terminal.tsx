'use client'

import { useState } from 'react'
import { TextEffect } from '@youj/motion'

const STAGES = ['deploy: queued', 'deploy: building', 'deploy: ready on www.youj.dev']

export default function TextEffectTerminal() {
  const [stage, setStage] = useState(0)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="rounded-xl border border-line bg-surface p-4 font-mono text-sm text-fg [&_[data-yj-prompt]]:text-accent">
        <TextEffect as="div" effect="terminal" prompt="$ " text="youj deploy --prod" inView={false} cursor={false} />
        {/* A live region, so a screen reader hears each settled status once. */}
        <div role="status" className="mt-2 text-fg-muted">
          <TextEffect effect="terminal" text={STAGES[stage]!} erase inView={false} />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setStage((s) => (s + 1) % STAGES.length)}
        className="self-start rounded-md bg-fg px-3 py-1.5 text-xs font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
      >
        Next status
      </button>
    </div>
  )
}
