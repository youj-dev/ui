'use client'

import { CheckIcon, GlobeIcon } from '@youj/icons'
import { DotMap } from '../../../components/ui/dot-map'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import type { MarketingSecurityCopy, SecurityRegion } from './data'

/* Data residency: pick a region and the map lights it while the table says
 * what stays there (a check each) and what is processed outside it, and why. */

interface ResidencyProps {
  regions: SecurityRegion[]
  value: string
  onValueChange: (id: string) => void
  copy: MarketingSecurityCopy
}

export function Residency({ regions, value, onValueChange, copy }: ResidencyProps) {
  const region = regions.find((r) => r.id === value) ?? regions[0]
  if (!region) return null
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,--spacing(120))] lg:items-center lg:gap-12">
      <div className="flex flex-col gap-5">
        <div className="-mx-4 overflow-x-auto px-4 yj-scrollbar sm:mx-0 sm:px-0">
          <SegmentedControl value={region.id} onValueChange={onValueChange} aria-label={copy.regionLabel}>
            {regions.map((r) => (
              <SegmentedControlItem key={r.id} value={r.id}>
                {r.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
        {/* The fullest region's height at 100%: picking another never resizes the section. */}
        <div aria-live="polite" className="flex min-h-64.75 flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
          <p className="text-ui-lg font-semibold text-fg">{copy.staysIn(region.location)}</p>
          <ul className="flex flex-col gap-2">
            {region.stays.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-ui text-fg">
                <CheckIcon size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                {item}
              </li>
            ))}
          </ul>
          {region.global && region.global.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <p className="text-ui-sm font-medium text-fg-muted">{copy.processedElsewhere}</p>
              <ul className="flex flex-col gap-2">
                {region.global.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-ui text-fg-muted">
                    <GlobeIcon size={16} aria-hidden className="mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <DotMap
        label={copy.mapLabel}
        active={region.id}
        onActiveChange={(id) => id && onValueChange(id)}
        regions={regions.map((r) => ({ id: r.id, name: r.label, lon: r.lon, lat: r.lat, value: 1 }))}
        formatValue={() => ''}
        className="w-full"
      />
    </div>
  )
}
