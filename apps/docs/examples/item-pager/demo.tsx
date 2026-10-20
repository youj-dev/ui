'use client'

import { useState } from 'react'
import { Button, ItemPager } from '@youj/react'

const tickets = [
  { id: 'SUP-2041', title: 'Exports time out above 50k rows', requester: 'Lumen Freight' },
  { id: 'SUP-2042', title: 'SSO login loops on Safari', requester: 'Fernhill Bank' },
  { id: 'SUP-2043', title: 'Invoice PDF shows the wrong VAT number', requester: 'Quayside Foods' },
  { id: 'SUP-2044', title: 'Webhook retries arrive out of order', requester: 'Orrery Labs' },
]

export default function ItemPagerDemo() {
  const [index, setIndex] = useState(1)
  const ticket = tickets[index]!
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-overlay shadow-sm">
      <div className="flex h-12 items-center gap-2 border-b border-line px-3">
        <ItemPager index={index} total={tickets.length} onIndexChange={setIndex} />
        <Button variant="outline" size="xs" className="ms-auto">
          Assign
        </Button>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <span className="font-mono text-ui-sm text-fg-muted">{ticket.id}</span>
        <span className="text-ui font-medium">{ticket.title}</span>
        <span className="text-ui-sm text-fg-muted">{ticket.requester}</span>
      </div>
    </div>
  )
}
