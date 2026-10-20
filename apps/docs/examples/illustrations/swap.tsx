'use client'

import { useState } from 'react'
import { Illustration, type IllustrationId } from '@youj/illustrations'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, SegmentedControl, SegmentedControlItem } from '@youj/react'

/* One slot, four scenes. Every scene frames the same volume, so swapping one
 * for another never moves the layout: the new one assembles in place. */

const SCENES: { id: IllustrationId; label: string }[] = [
  { id: 'empty', label: 'Empty' },
  { id: 'search', label: 'Search' },
  { id: 'mail', label: 'Mail' },
  { id: 'not-found', label: 'Not found' },
]

export default function IllustrationsSwap() {
  const [scene, setScene] = useState<IllustrationId>('empty')
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 sm:p-6">
      <SegmentedControl aria-label="Scene" value={scene} onValueChange={(value) => setScene(value as IllustrationId)} className="w-full">
        {SCENES.map((s) => (
          <SegmentedControlItem key={s.id} value={s.id} className="flex-1">
            {s.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <Empty className="rounded-xl border border-line bg-surface py-8">
        <EmptyHeader>
          <EmptyMedia className="mb-1">
            {/* Keyed on the scene, so the new one assembles as it arrives. */}
            <Illustration key={scene} scene={scene} unit={16} />
          </EmptyMedia>
          <EmptyTitle>Nothing here yet</EmptyTitle>
          <EmptyDescription>The same empty state, with whichever scene fits the moment.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline">Get started</Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
