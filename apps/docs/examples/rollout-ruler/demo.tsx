'use client'

import { useState } from 'react'
import { Button, RolloutRuler } from '@youj/react'

export default function RolloutRulerDemo() {
  const [value, setValue] = useState(10)
  // What the kill switch rolled back from, so Restore can put it back.
  const [killed, setKilled] = useState<number | null>(null)
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <RolloutRuler
        label="Rolled out to"
        value={value}
        tone={killed !== null ? 'danger' : 'accent'}
        onValueChange={(next) => {
          setValue(next)
          setKilled(null)
        }}
      />
      <Button
        variant={killed !== null ? 'secondary' : 'danger'}
        className="self-start"
        disabled={killed === null && value === 0}
        onClick={() => {
          if (killed !== null) {
            setValue(killed)
            setKilled(null)
          } else {
            setKilled(value)
            setValue(0)
          }
        }}
      >
        {killed !== null ? `Restore ${killed}%` : 'Kill switch'}
      </Button>
    </div>
  )
}
