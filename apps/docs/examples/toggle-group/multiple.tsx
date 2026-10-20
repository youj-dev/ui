'use client'

import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'

const ENVIRONMENTS = [
  { value: 'production', label: 'Production', count: 4 },
  { value: 'preview', label: 'Preview', count: 31 },
  { value: 'development', label: 'Development', count: 9 },
]

export default function ToggleGroupMultiple() {
  const [shown, setShown] = useState(['production', 'preview'])
  const total = ENVIRONMENTS.filter((env) => shown.includes(env.value)).reduce((sum, env) => sum + env.count, 0)

  return (
    <div className="flex flex-col items-center gap-3">
      {/* With `multiple`, each pressed key raises itself instead of one indicator gliding. */}
      <ToggleGroup variant="segmented" multiple aria-label="Environments" value={shown} onValueChange={setShown}>
        {ENVIRONMENTS.map((env) => (
          <ToggleGroupItem key={env.value} value={env.value} className="px-3">
            {env.label}
            <span className="font-mono text-ui-xs text-fg-muted tabular-nums">{env.count}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p role="status" className="text-ui-sm text-fg-muted">
        {shown.length === 0 ? 'Pick an environment to see its deployments.' : `Showing ${total} deployments.`}
      </p>
    </div>
  )
}
