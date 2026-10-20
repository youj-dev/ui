'use client'

import { useState } from 'react'
import { SlidersIcon } from '@youj/icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@youj/react'

type Shown = { previews: boolean; branches: boolean; compact: boolean }

export default function DropdownMenuOptions() {
  const [sort, setSort] = useState('updated')
  const [shown, setShown] = useState<Shown>({ previews: true, branches: false, compact: false })
  const toggle = (key: keyof Shown) => (checked: boolean) => setShown((s) => ({ ...s, [key]: checked }))

  return (
    <div className="flex h-80 w-full max-w-sm flex-col items-start gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <SlidersIcon />
          Display
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52">
          {/* A label inside a radio group names the group for screen readers. */}
          <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="updated">Last deployed</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="created">Date created</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Show</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={shown.previews} onCheckedChange={toggle('previews')}>
              Preview deployments
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={shown.branches} onCheckedChange={toggle('branches')}>
              Branch names
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={shown.compact} onCheckedChange={toggle('compact')}>
              Compact rows
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="px-1 text-ui-sm text-fg-muted">
        Sorted by {sort === 'updated' ? 'last deployed' : sort === 'created' ? 'date created' : 'name'}
        {shown.previews ? ', with previews' : ''}
        {shown.branches ? ', with branches' : ''}
        {shown.compact ? ', compact' : ''}.
      </p>
    </div>
  )
}
