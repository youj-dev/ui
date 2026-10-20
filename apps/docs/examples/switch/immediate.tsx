'use client'

import { useState } from 'react'
import { Badge, Field, FieldContent, FieldDescription, FieldLabel, Switch } from '@youj/react'

export default function SwitchImmediate() {
  const [maintenance, setMaintenance] = useState(false)

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-ui font-medium text-fg">youj.io</p>
          <p className="text-ui-sm text-fg-muted">Production · 4f2a91c</p>
        </div>
        {/* The switch applies on its own, so the page reflects it at once: no Save button. */}
        <Badge variant={maintenance ? 'warning' : 'success'}>{maintenance ? 'Maintenance' : 'Live'}</Badge>
      </div>
      <Field orientation="horizontal" className="px-4 py-3.5">
        <FieldContent>
          <FieldLabel>Maintenance mode</FieldLabel>
          <FieldDescription>Serve a holding page to every visitor until you switch it off.</FieldDescription>
        </FieldContent>
        <Switch checked={maintenance} onCheckedChange={setMaintenance} />
      </Field>
    </div>
  )
}
