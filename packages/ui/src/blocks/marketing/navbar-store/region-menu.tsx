'use client'

import { ChevronDownIcon, GlobeIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { cn } from '../../../lib/utils'
import type { NavbarStoreCopy, NavbarStoreRegion } from './data'

/** Where to ship and what to pay in: a checked list of regions with their currencies. */
export function RegionMenu({
  regions,
  value,
  onValueChange,
  copy,
  className,
}: {
  regions: NavbarStoreRegion[]
  value: string
  onValueChange: (id: string) => void
  copy: NavbarStoreCopy
  className?: string
}) {
  const shown = regions.find((region) => region.id === value) ?? regions[0]
  if (!shown) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="xs" aria-label={copy.region(shown.label, shown.currency)} className={cn('gap-1.5 text-fg-muted', className)} />}
      >
        <GlobeIcon size={14} />
        {shown.label}{' '}
        <span className="text-fg-subtle tabular-nums">{shown.currency}</span>
        <ChevronDownIcon size={12} className="text-fg-subtle" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuRadioGroup value={shown.id} onValueChange={(id) => onValueChange(String(id))}>
          <DropdownMenuLabel>{copy.regionTitle}</DropdownMenuLabel>
          {regions.map((region) => (
            <DropdownMenuRadioItem key={region.id} value={region.id}>
              {region.label}
              <span className="text-ui-sm text-fg-subtle tabular-nums">{region.currency}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
