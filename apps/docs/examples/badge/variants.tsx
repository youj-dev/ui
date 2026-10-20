'use client'

import { Badge } from '@youj/react'

export default function BadgeVariants() {
  return (
    <div className="flex max-w-lg flex-wrap items-center justify-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="solid">Solid</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Destructive</Badge>
    </div>
  )
}
