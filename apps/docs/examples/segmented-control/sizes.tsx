'use client'

import { LayoutGridIcon, LayoutListIcon, KanbanIcon } from '@youj/icons'
import { Button, Input, SegmentedControl, SegmentedControlItem } from '@youj/react'

export default function SegmentedControlSizes() {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-5">
      <span className="font-mono text-ui-xs text-fg-muted">sm</span>
      {/* Each size is the height of the matching control, so a row lines up (wrapping on a phone). */}
      <div className="flex flex-wrap items-center gap-2">
        <Input aria-label="Search" placeholder="Search…" className="h-control-sm w-36" />
        <SegmentedControl aria-label="Billing, small" size="sm" defaultValue="monthly">
          <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
          <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
        </SegmentedControl>
        <Button size="sm">Apply</Button>
      </div>
      <span className="font-mono text-ui-xs text-fg-muted">default</span>
      <SegmentedControl aria-label="Billing" defaultValue="yearly" className="justify-self-start">
        <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
        <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
      </SegmentedControl>
      <span className="font-mono text-ui-xs text-fg-muted">lg</span>
      <SegmentedControl aria-label="Layout" size="lg" defaultValue="grid" className="justify-self-start">
        <SegmentedControlItem value="grid" aria-label="Grid">
          <LayoutGridIcon />
        </SegmentedControlItem>
        <SegmentedControlItem value="list" aria-label="List">
          <LayoutListIcon />
        </SegmentedControlItem>
        <SegmentedControlItem value="board" aria-label="Board">
          <KanbanIcon />
        </SegmentedControlItem>
      </SegmentedControl>
    </div>
  )
}
