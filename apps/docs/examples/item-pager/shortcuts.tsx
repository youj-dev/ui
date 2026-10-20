'use client'

import { useState } from 'react'
import { Input, Kbd, ItemPager } from '@youj/react'

const names = ['Lumen Freight', 'Orrery Labs', 'Fernhill Bank', 'Quayside Foods', 'Brightwater Health']

export default function ItemPagerShortcuts() {
  const [index, setIndex] = useState(0)
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <ItemPager index={index} total={names.length} onIndexChange={setIndex} shortcuts="global" />
        <span className="truncate text-ui font-medium">{names[index]}</span>
      </div>
      <p className="text-ui-sm text-fg-muted">
        Press <Kbd>J</Kbd> or <Kbd>K</Kbd> anywhere on the page. In the field below they type instead.
      </p>
      <Input aria-label="Note" placeholder="Type a note…" />
    </div>
  )
}
