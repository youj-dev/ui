'use client'

import { useState } from 'react'
import { NotificationCenter, type NotificationItem } from '@youj/react'

export default function NotificationCenterEmpty() {
  const [items, setItems] = useState<NotificationItem[]>([])

  return (
    <div className="flex flex-col items-center gap-3 text-ui text-fg-muted">
      <span>Nothing new</span>
      <NotificationCenter
        notifications={items}
        onMarkRead={(id) => setItems((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)))}
        onMarkAllRead={() => setItems((list) => list.map((item) => ({ ...item, read: true })))}
      />
    </div>
  )
}
