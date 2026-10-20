'use client'

import { useState } from 'react'
import { Button, ScoreRing, type ScoreGrade } from '@youj/react'

/** Letter grades from F to A, each band in its tone. */
const GRADES: ScoreGrade[] = [
  { from: 0, label: 'F', tone: 'danger' },
  { from: 40, label: 'D', tone: 'warning' },
  { from: 60, label: 'C', tone: 'warning' },
  { from: 75, label: 'B', tone: 'success' },
  { from: 90, label: 'A', tone: 'success' },
]

export default function ScoreRingDemo() {
  const [score, setScore] = useState(77)
  return (
    <div className="flex flex-col items-center gap-5">
      <ScoreRing value={score} grades={GRADES} size="lg" label="Security score" />
      <div className="flex gap-2">
        {[34, 62, 77, 94].map((n) => (
          <Button key={n} size="sm" variant={n === score ? 'default' : 'outline'} onClick={() => setScore(n)} className="tabular-nums">
            {n}
          </Button>
        ))}
      </div>
    </div>
  )
}
