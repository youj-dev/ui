'use client'

import { useState } from 'react'
import { LottiePlayer } from '@youj/motion/players'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'

// The check's color lives in a slot named `success`. Bind it to another token and it recolors in place.
const TOKENS = ['success', 'accent', 'warning', 'danger']

export default function LottiePlayerSlots() {
  const [token, setToken] = useState('success')

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="grid size-36 place-items-center rounded-2xl border border-line bg-surface">
        <LottiePlayer src="/samples/success-check.json" autoplay slots={{ success: token }} className="size-24" />
      </div>
      <ToggleGroup variant="segmented" size="sm" aria-label="Slot color" value={[token]} onValueChange={(next) => next[0] && setToken(next[0])}>
        {TOKENS.map((option) => (
          <ToggleGroupItem key={option} value={option} className="px-2.5 font-mono text-xs">
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
