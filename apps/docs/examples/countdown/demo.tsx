'use client'

import { useState } from 'react'
import { Countdown } from '@youj/react'

export default function CountdownDemo() {
  // A fixed moment in a real app, e.g. '2026-10-07T16:00:00Z'. Here: six days out from the first render.
  const [launch] = useState(() => Date.now() + (6 * 24 + 4) * 3_600_000 + 12 * 60_000 + 45_000)
  return <Countdown to={launch} />
}
