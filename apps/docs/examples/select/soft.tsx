'use client'

import { Card, CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@youj/react'

const MODELS = [
  { value: 'sonnet', label: 'Sonnet' },
  { value: 'opus', label: 'Opus' },
  { value: 'haiku', label: 'Haiku' },
]

export default function SelectSoft() {
  return (
    <Card className="w-full max-w-xs">
      <CardContent>
        <Select items={MODELS} defaultValue="sonnet">
          <SelectTrigger variant="soft" aria-label="Model" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
