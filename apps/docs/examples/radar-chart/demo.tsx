'use client'

import { RadarChart } from '@youj/react'

const AXES = [
  { id: 'reasoning', label: 'Reasoning', description: 'How well it works through problems that take several steps.' },
  { id: 'code', label: 'Code', description: 'Writing, explaining and fixing programs.' },
  { id: 'speed', label: 'Speed', description: 'How quickly the first words arrive and how fast the rest follow.' },
  { id: 'value', label: 'Value', description: 'What you get for each dollar spent.' },
  { id: 'memory', label: 'Memory', description: 'How much of a long conversation or document it keeps in view.' },
  { id: 'vision', label: 'Vision', description: 'Reading images, charts and screenshots.' },
  { id: 'tools', label: 'Tools', description: 'Calling other programs and using what comes back.' },
  { id: 'safety', label: 'Safety', description: 'Staying within its limits when pushed.' },
]

/** Three made-up assistants scored out of 100. */
const SERIES = [
  { id: 'atlas', name: 'Atlas 2', values: [88, 82, 56, 48, 90, 76, 84, 80] },
  { id: 'quill', name: 'Quill S', values: [64, 70, 92, 90, 52, 58, 66, 72] },
  { id: 'meridian', name: 'Meridian', values: [76, 58, 70, 66, 70, 88, 52, 90] },
]

export default function RadarChartDemo() {
  return (
    <div className="w-full max-w-xl">
      <RadarChart axes={AXES} series={SERIES} label="Assistants compared" />
    </div>
  )
}
