'use client'

import { useState } from 'react'
import { Button, ProgressPath, type ProgressPathSection } from '@youj/react'

const SECTIONS: ProgressPathSection[] = [
  {
    id: 'basics',
    eyebrow: 'Section 1',
    title: 'Basics',
    lessons: [
      { id: 'greetings', title: 'Greetings', detail: '6 min', mastery: 4 },
      { id: 'numbers', title: 'Numbers', detail: '7 min', mastery: 3 },
      { id: 'family', title: 'Family', detail: '9 min', mastery: 1 },
      { id: 'basics-check', title: 'Basics checkpoint', detail: '+50 XP', milestone: true },
    ],
  },
  {
    id: 'cafe',
    eyebrow: 'Section 2',
    title: 'Café & food',
    lessons: [
      { id: 'coffee', title: 'Ordering coffee', detail: '8 min' },
      { id: 'market', title: 'At the market', detail: '10 min' },
      { id: 'cafe-check', title: 'Café checkpoint', detail: '+50 XP', milestone: true },
    ],
  },
]

const ORDER = SECTIONS.flatMap((s) => s.lessons.map((l) => l.id))

export default function ProgressPathDemo() {
  // Finish lesson moves `current` on: the next segment draws and the Start callout glides after it.
  const [at, setAt] = useState(2)
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="rounded-2xl border border-line bg-surface px-6 py-2">
        <ProgressPath sections={SECTIONS} current={ORDER[at] ?? null} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setAt(2)}>
          Reset
        </Button>
        <Button onClick={() => setAt((i) => Math.min(ORDER.length, i + 1))}>Finish lesson</Button>
      </div>
    </div>
  )
}
