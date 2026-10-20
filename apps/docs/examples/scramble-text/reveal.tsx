'use client'

import { useState } from 'react'
import { ScrambleText } from '@youj/motion'
import { EyeIcon } from '@youj/icons'

const VARIABLES = [
  { name: 'DATABASE_URL', value: 'postgres://app@db.youj.io/main' },
  { name: 'EDGE_CONFIG_ID', value: 'ecfg_7h1c4a9x2b8k' },
  { name: 'WEBHOOK_SECRET', value: 'kn_whsig_3d0q8Lm2Zr5t' },
]
const MASK = '•'.repeat(16)

function Variable({ name, value }: { name: string; value: string }) {
  const [shown, setShown] = useState(false)
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs text-fg-muted">{name}</p>
        <p className="mt-1 truncate font-mono text-sm text-fg">
          {/* Only `change`: nothing plays on mount, and each toggle decodes one way or the other. */}
          <ScrambleText trigger="change" aria-hidden={!shown || undefined}>
            {shown ? value : MASK}
          </ScrambleText>
          {!shown && <span className="sr-only">Hidden</span>}
        </p>
      </div>
      <button
        type="button"
        aria-pressed={shown}
        aria-label={`Show ${name}`}
        onClick={() => setShown((s) => !s)}
        className="grid size-8 shrink-0 place-items-center rounded-md text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-pressed:text-accent"
      >
        <EyeIcon size={16} active={shown} />
      </button>
    </li>
  )
}

export default function ScrambleTextReveal() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
      <p className="border-b border-line px-4 py-2.5 text-xs font-medium text-fg-muted">Environment variables · Production</p>
      <ul className="divide-y divide-line">
        {VARIABLES.map((v) => (
          <Variable key={v.name} {...v} />
        ))}
      </ul>
    </div>
  )
}
