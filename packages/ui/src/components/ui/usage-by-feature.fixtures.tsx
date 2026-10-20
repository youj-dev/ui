import { useState, type ReactNode } from 'react'
import { GlobeIcon } from '@youj/icons/components/youj/icons/globe'
import { ImageIcon } from '@youj/icons/components/youj/icons/image'
import { MicIcon } from '@youj/icons/components/youj/icons/mic'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { SparklesIcon } from '@youj/icons/components/youj/icons/sparkles'
import { Button } from './button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Progress } from './progress'
import { SegmentedMeter } from './segmented-meter'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { numberFormat } from '../../lib/utils'

/* A credit-usage dialog for the "Usage by feature" story and its test: the
 * month's total as a big figure over a progress bar and when it resets, a
 * filter and a sort over the features, and one row per feature with its use
 * against its limit as a tick meter (SegmentedMeter, amber from 80%, red from
 * 95%). The rows sit in a region of fixed height, so filtering never resizes
 * the dialog. */

interface Feature {
  id: string
  name: string
  icon: ReactNode
  used: number
  limit: number
}

const ICON = { size: 16, strokeWidth: 1.75 }
export const FEATURES: Feature[] = [
  { id: 'drafting', name: 'Drafting assistant', icon: <SparklesIcon {...ICON} />, used: 2_140, limit: 4_000 },
  { id: 'images', name: 'Image studio', icon: <ImageIcon {...ICON} />, used: 1_720, limit: 2_000 },
  { id: 'voice', name: 'Voice notes', icon: <MicIcon {...ICON} />, used: 310, limit: 1_000 },
  { id: 'search', name: 'Document search', icon: <SearchIcon {...ICON} />, used: 940, limit: 1_000 },
  { id: 'translate', name: 'Translations', icon: <GlobeIcon {...ICON} />, used: 120, limit: 2_500 },
]
const PLAN_CREDITS = 10_000

const FILTERS = [
  { value: 'all', label: 'All features' },
  { value: 'near', label: 'Near limit' },
  { value: 'roomy', label: 'Plenty left' },
]
const SORTS = [
  { value: 'used', label: 'Most used' },
  { value: 'closest', label: 'Closest to limit' },
  { value: 'name', label: 'Name' },
]
/** Amber from 80% of a feature's limit, red from 95%. */
const hot = (limit: number) => [
  { value: limit * 0.8, tone: 'warning' as const, label: 'Near limit' },
  { value: limit * 0.95, tone: 'danger' as const, label: 'Almost out' },
]

const share = (f: Feature) => f.used / f.limit
const SORT_BY: Record<string, (a: Feature, b: Feature) => number> = {
  used: (a, b) => b.used - a.used,
  closest: (a, b) => share(b) - share(a),
  name: (a, b) => a.name.localeCompare(b.name),
}
const KEEP: Record<string, (f: Feature) => boolean> = {
  all: () => true,
  near: (f) => share(f) >= 0.8,
  roomy: (f) => share(f) < 0.5,
}

const number = numberFormat('en-US')

function Pick({ label, items, value, onChange }: { label: string; items: typeof FILTERS; value: string; onChange: (value: string) => void }) {
  return (
    <Select items={items} value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger variant="ghost" aria-label={label} className="shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function UsageByFeature({ defaultOpen = false, features = FEATURES }: { defaultOpen?: boolean; features?: Feature[] }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('used')
  const used = features.reduce((sum, f) => sum + f.used, 0)
  const rows = features.filter(KEEP[filter]!).sort(SORT_BY[sort]!)
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Credit usage</DialogTrigger>
      <DialogContent showCloseButton={false} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Credit usage</DialogTitle>
          <DialogDescription>Credits spent this month, by feature.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {number.format(used)} <span className="text-ui font-normal tracking-normal text-fg-muted">/ {number.format(PLAN_CREDITS)} credits</span>
            </p>
            <p className="text-ui-sm text-fg-muted">Resets in 12 days</p>
          </div>
          <Progress aria-label="Credits used this month" value={used} max={PLAN_CREDITS} size="lg" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Pick label="Filter features" items={FILTERS} value={filter} onChange={setFilter} />
          <Pick label="Sort features" items={SORTS} value={sort} onChange={setSort} />
        </div>
        {/* A fixed height, so filtering swaps the rows without resizing the dialog. */}
        <div className="h-88 overflow-y-auto yj-scrollbar">
          {rows.length === 0 ? (
            <p className="grid h-full place-items-center text-ui text-fg-muted">No features match this filter.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line-subtle">
              {rows.map((f) => (
                <li key={f.id} className="flex flex-col gap-2.5 py-3.5 first:pt-1 last:pb-1">
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden className="text-fg-muted">
                      {f.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ui font-medium">{f.name}</span>
                    <span className="text-ui-sm text-fg-muted tabular-nums">
                      {number.format(f.used)} / {number.format(f.limit)}
                    </span>
                  </div>
                  <SegmentedMeter aria-label={`${f.name} usage`} value={f.used} max={f.limit} segments={40} thresholds={hot(f.limit)} showValue={false} className="[&_[data-slot=segmented-meter-track]]:h-2" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
          <Button>Upgrade plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
