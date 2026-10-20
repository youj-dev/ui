'use client'

import { useState } from 'react'
import { Button, Treemap, type TreemapItem } from '@youj/react'

/** A web app's JavaScript, gzipped, by package. */
const BUNDLE: TreemapItem[] = [
  { id: 'app', name: 'app code', value: 164 },
  { id: 'react-dom', name: 'react-dom', value: 131 },
  { id: 'recharts', name: 'recharts', value: 96 },
  { id: 'prosemirror', name: 'prosemirror', value: 74 },
  { id: 'motion', name: 'motion', value: 52 },
  { id: 'date-fns', name: 'date-fns', value: 31 },
  { id: 'zod', name: 'zod', value: 18 },
  { id: 'rest', name: 'the rest', value: 12 },
]
const kb = new Intl.NumberFormat('en-US', { style: 'unit', unit: 'kilobyte' }).format

export default function TreemapDemo() {
  const [items, setItems] = useState(BUNDLE)
  // Loading the charts on demand moves 88 kB out of the first load: the map re-lays itself around the change.
  const split = items.find((item) => item.id === 'recharts')!.value < 96
  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <Treemap items={items} highlight="recharts" formatValue={kb} label="Bundle by package" />
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setItems(split ? BUNDLE : items.map((item) => (item.id === 'recharts' ? { ...item, value: item.value - 88 } : item)))}
      >
        {split ? 'Bundle the charts again' : 'Load the charts on demand'}
      </Button>
    </div>
  )
}
