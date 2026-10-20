'use client'

import { useState } from 'react'
import { Badge, Button, Countdown } from '@youj/react'

export default function CountdownComplete() {
  const [to, setTo] = useState(() => Date.now() + 8_000)
  const [live, setLive] = useState(false)
  return (
    <div className="flex flex-col items-center gap-5">
      <Badge variant={live ? 'success' : 'outline'}>
        {live ? 'Doors are open' : 'Doors open soon'}
      </Badge>
      <Countdown to={to} onComplete={() => setLive(true)} className="text-3xl sm:text-4xl" />
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setLive(false)
          setTo(Date.now() + 8_000)
        }}
      >
        Restart
      </Button>
    </div>
  )
}
