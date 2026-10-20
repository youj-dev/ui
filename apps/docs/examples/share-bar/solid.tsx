'use client'

import { useState } from 'react'
import { Button, ShareBar } from '@youj/react'

export default function ShareBarSolid() {
  const [value, setValue] = useState(0.62)
  return (
    <div className="flex w-72 flex-col gap-3">
      {/* Named, so it's a meter: nothing beside it says the value. */}
      <ShareBar value={value} tone="success" label="Pass rate" />
      <ShareBar value={value} segments={24} tone="success" label="Pass rate, in cells" />
      <Button variant="outline" size="sm" className="self-start" onClick={() => setValue(Math.round(Math.random() * 100) / 100)}>
        New value
      </Button>
    </div>
  )
}
