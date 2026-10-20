'use client'

import type { ReactNode } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'
import {
  BoldIcon,
  ItalicIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '@youj/icons'

export default function ToggleGroupLooks() {
  return (
    <div className="@container w-full max-w-xl">
      <div className="grid gap-7 @lg:grid-cols-[repeat(3,auto)] @lg:justify-between">
        <Look label="default · single">
          <ToggleGroup aria-label="List style" defaultValue={['bulleted']}>
            <ToggleGroupItem value="bulleted" aria-label="Bulleted list">
              <ListIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="numbered" aria-label="Numbered list">
              <ListOrderedIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="checklist" aria-label="Checklist">
              <ListChecksIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </Look>
        <Look label="outline · joined · multiple">
          <ToggleGroup variant="outline" spacing={0} multiple aria-label="Text style" defaultValue={['bold', 'italic']}>
            <ToggleGroupItem value="bold" aria-label="Bold">
              <BoldIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <ItalicIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <UnderlineIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="strikethrough" aria-label="Strikethrough">
              <StrikethroughIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </Look>
        <Look label="segmented · sm">
          <ToggleGroup variant="segmented" size="sm" aria-label="Range" defaultValue={['7d']}>
            {['24h', '7d', '30d', '90d'].map((range) => (
              <ToggleGroupItem key={range} value={range} className="px-2.5 tabular-nums">
                {range}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Look>
      </div>
    </div>
  )
}

function Look({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2.5">
      {children}
      <p className="font-mono text-ui-xs text-fg-muted">{label}</p>
    </div>
  )
}
