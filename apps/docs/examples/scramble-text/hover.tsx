'use client'

import { useState } from 'react'
import { ScrambleText } from '@youj/motion'

const SYMBOLS = '!<>-_\\/[]{}=+*^?#%&'
const ACTIONS = [
  { label: 'Redeploy', result: 'Redeploy of 4f2a91c queued' },
  { label: 'Roll back', result: 'Rolled back to b81e07d' },
  { label: 'Stream logs', result: 'Streaming logs from iad1' },
]

export default function ScrambleTextHover() {
  const [result, setResult] = useState('Hover or tab through the actions.')

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <div className="flex flex-wrap justify-center gap-2">
        {ACTIONS.map(({ label, result }) => (
          // The scramble is the button itself, so keyboard focus plays it as well as the pointer.
          <ScrambleText
            key={label}
            as="button"
            trigger="hover"
            glyphs={SYMBOLS}
            duration="slow"
            onClick={() => setResult(result)}
            className="rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs tracking-[0.12em] text-fg uppercase transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {label}
          </ScrambleText>
        ))}
      </div>
      <p role="status" className="text-sm text-fg-muted">
        {result}
      </p>
    </div>
  )
}
