'use client'

import { useState } from 'react'
import { Badge, SortableList, SortableListHandle, SortableListItem } from '@youj/react'

const PRIORITIES = [
  { id: 'auth', title: 'Passkey sign-in', team: 'Identity' },
  { id: 'billing', title: 'Usage-based billing', team: 'Growth' },
  { id: 'audit', title: 'Audit log export', team: 'Platform' },
  { id: 'search', title: 'Search across workspaces', team: 'Core' },
  { id: 'mobile', title: 'Offline mode on mobile', team: 'Mobile' },
]
const byId = new Map(PRIORITIES.map((p) => [p.id, p]))

export default function SortableListDemo() {
  const [order, setOrder] = useState(PRIORITIES.map((p) => p.id))
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <h2 id="priorities" className="px-1 text-ui-lg font-semibold text-fg">
        Q4 priorities
      </h2>
      <SortableList aria-labelledby="priorities" value={order} onValueChange={setOrder} className="[counter-reset:rank]">
        {order.map((id) => {
          const item = byId.get(id)!
          return (
            <SortableListItem key={id} value={id} textValue={item.title} className="[counter-increment:rank]">
              <SortableListHandle />
              {/* A CSS counter, so the rank follows the row while it's lifted. */}
              <span aria-hidden className="w-4 text-end text-ui-sm text-fg-muted tabular-nums before:content-[counter(rank)]" />
              <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
              <Badge variant="secondary">{item.team}</Badge>
            </SortableListItem>
          )
        })}
      </SortableList>
    </div>
  )
}
