import { CardContent } from '../../../components/ui/card'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import type { ArcGlobeCopy, ArcGlobePeriod, ArcGlobeSite } from './data'

/* The period toggle and the site select that re-cut every figure. */

interface ControlsProps {
  periods: ArcGlobePeriod[]
  period: ArcGlobePeriod
  sites: ArcGlobeSite[]
  site: ArcGlobeSite | undefined
  copy: ArcGlobeCopy
  onPeriod: (period: ArcGlobePeriod) => void
  onSite: (site: ArcGlobeSite) => void
}

export function Controls({ periods, period, sites, site, copy, onPeriod, onSite }: ControlsProps) {
  return (
    <CardContent className="flex flex-wrap items-center justify-between gap-3 py-[calc(var(--card-spacing)-var(--spacing))]">
      <SegmentedControl
        aria-label={copy.period}
        size="sm"
        value={period.id}
        onValueChange={(next) => {
          const found = periods.find((p) => p.id === next)
          if (found) onPeriod(found)
        }}
      >
        {periods.map((p) => (
          <SegmentedControlItem key={p.id} value={p.id} aria-label={p.name ?? p.label} className="px-2.5 font-mono text-ui-sm">
            {p.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <Select
        items={sites.map((s) => ({ value: s.id, label: s.label }))}
        value={site?.id}
        onValueChange={(next) => {
          const found = sites.find((s) => s.id === next)
          if (found) onSite(found)
        }}
      >
        <SelectTrigger size="sm" aria-label={copy.scope} className="w-48 font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sites.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span className="font-mono">{s.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardContent>
  )
}
