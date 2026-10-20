'use client'

import { RolloutRuler } from '@youj/react'

const FLAGS = [
  { key: 'checkout-v2', share: 10 },
  { key: 'semantic-search', share: 50 },
  { key: 'inbox-summaries', share: 5 },
  { key: 'edge-cache', share: 100 },
]

export default function RolloutRulerMeters() {
  return (
    <ul className="flex w-full max-w-lg flex-col gap-3">
      {FLAGS.map((flag) => (
        <li key={flag.key} className="grid grid-cols-[9rem_minmax(0,1fr)_3rem] items-center gap-4 font-mono text-ui">
          <span className="truncate">{flag.key}</span>
          <RolloutRuler readOnly size="sm" value={flag.share} label={flag.key} />
          <span className="text-end tabular-nums">{flag.share}%</span>
        </li>
      ))}
    </ul>
  )
}
