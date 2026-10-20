'use client'

import { useState } from 'react'
import { TextEffect, type TextEffectName } from '@youj/motion'

const EFFECTS: TextEffectName[] = ['blur-in', 'split-flap', 'terminal', 'decode', 'roll']
const LINES = ['Ship on Friday, calmly', 'Preview every change', 'Deploys that land']

export default function TextEffectDemo() {
  const [effect, setEffect] = useState<TextEffectName>('blur-in')
  const [line, setLine] = useState(0)

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-8">
      <div role="radiogroup" aria-label="Effect" className="flex flex-wrap justify-center gap-1 rounded-lg border border-line bg-surface p-1">
        {EFFECTS.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={effect === name}
            onClick={() => setEffect(name)}
            className="rounded-md px-2.5 py-1 font-mono text-xs text-fg-muted aria-checked:bg-selected aria-checked:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {name}
          </button>
        ))}
      </div>
      {/* A new effect remounts it, so it plays from the start; a new line plays from the old one. */}
      <TextEffect
        key={effect}
        effect={effect}
        text={LINES[line]!}
        inView={false}
        prompt={effect === 'terminal' ? '$ ' : undefined}
        erase
        as="p"
        className="text-center font-mono text-2xl font-semibold tracking-tight text-fg sm:text-3xl"
      />
      <button
        type="button"
        onClick={() => setLine((n) => (n + 1) % LINES.length)}
        className="rounded-md bg-fg px-3 py-1.5 text-xs font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
      >
        Next line
      </button>
    </div>
  )
}
