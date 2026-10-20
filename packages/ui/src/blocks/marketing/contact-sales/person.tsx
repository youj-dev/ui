'use client'

import type { ReactNode } from 'react'
import { Reveal } from '@youj/motion'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { initials } from '../../../lib/utils'
import type { ContactSalesCopy, ContactSalesRegion } from './data'

/* Who answers: the region's person, swapping in as the region changes (the
 * region decides who answers and which times are on offer), with the region
 * as a compact menu at the end. */

interface PersonProps {
  regions: ContactSalesRegion[]
  region: ContactSalesRegion
  /** The line under the name. */
  line: ReactNode
  title: string
  onRegionChange: (id: string) => void
  copy: ContactSalesCopy
}

export function Person({ regions, region, line, title, onRegionChange, copy }: PersonProps) {
  const { contact } = region
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line p-3">
      <Reveal key={region.id} variant="fade" inView={false} duration="fast" className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar size="lg">
          {contact.avatar && <AvatarImage src={contact.avatar} alt="" />}
          <AvatarFallback>{initials(contact.name)}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col">
          <span className="text-pretty text-ui font-medium text-fg">{title}</span>
          <span className="text-pretty text-ui-sm text-fg-muted">{line}</span>
        </span>
      </Reveal>
      {regions.length > 1 && (
        <Select
          items={regions.map((r) => ({ value: r.id, label: r.label }))}
          value={region.id}
          onValueChange={(next) => {
            if (typeof next === 'string' && next !== region.id) onRegionChange(next)
          }}
        >
          <SelectTrigger size="sm" aria-label={copy.region} className="max-w-40 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
