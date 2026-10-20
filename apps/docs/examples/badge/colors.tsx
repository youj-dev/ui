'use client'

import { Badge, BadgeDot } from '@youj/react'

const LABELS = [
  { name: 'Frontend', color: 'chart-1' },
  { name: 'Backend', color: 'chart-2' },
  { name: 'Design', color: 'chart-3' },
  { name: 'Research', color: 'chart-4' },
]

export default function BadgeColors() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {LABELS.map((label) => (
          <Badge key={label.name} color={label.color}>
            {label.name}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {LABELS.map((label) => (
          <Badge key={label.name} variant="outline">
            <BadgeDot color={label.color} />
            {label.name}
          </Badge>
        ))}
      </div>
    </div>
  )
}
