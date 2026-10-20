'use client'

import { useState } from 'react'
import { AlertTriangleIcon, BanIcon, CheckCircleIcon, ClockIcon, LoaderDotsIcon, PlusIcon } from '@youj/icons'
import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from '@youj/react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@youj/react/command'

const STATUSES = [
  { value: 'ready', label: 'Ready', Icon: CheckCircleIcon, count: 64 },
  { value: 'building', label: 'Building', Icon: LoaderDotsIcon, count: 2 },
  { value: 'queued', label: 'Queued', Icon: ClockIcon, count: 5 },
  { value: 'error', label: 'Error', Icon: AlertTriangleIcon, count: 3 },
  { value: 'canceled', label: 'Canceled', Icon: BanIcon, count: 1 },
]

export default function CommandFilter() {
  const [selected, setSelected] = useState(new Set(['building', 'error']))
  const toggle = (value: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })

  return (
    <div className="flex h-80 w-full max-w-md items-start">
      <Popover>
        {/* shape: dashed, an add slot (as the data table's filter buttons) */}
        <PopoverTrigger render={<Button variant="outline" size="sm" className="border-dashed" />}>
          <PlusIcon />
          Status
          {selected.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4 self-center" />
              <Badge variant="secondary">{selected.size} selected</Badge>
            </>
          )}
        </PopoverTrigger>
        {/* A faceted filter: the shape a data table toolbar uses. */}
        <PopoverContent align="start" aria-label="Filter by status" className="w-56 gap-0 p-0">
          <Command label="Filter by status">
            <CommandInput placeholder="Status" />
            <CommandList>
              <CommandEmpty>No status found.</CommandEmpty>
              <CommandGroup>
                {STATUSES.map(({ value, label, Icon, count }) => (
                  <CommandItem key={value} value={label} checked={selected.has(value)} onSelect={() => toggle(value)}>
                    {/* Loader icons loop by default. In a list, they play on hover like the rest. */}
                    <Icon trigger="hover" />
                    {label}
                    <span className="ms-auto font-mono text-ui-xs text-fg-muted tabular-nums">{count}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {selected.size > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem onSelect={() => setSelected(new Set())} className="justify-center">
                      Clear filters
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
