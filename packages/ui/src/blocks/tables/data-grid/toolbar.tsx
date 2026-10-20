'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { useLocale } from '@youj/core'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../../components/ui/input-group'
import { Kbd } from '../../../components/ui/kbd'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn } from '../../../lib/utils'
import { useCopy } from './copy'
import type { DataGridDensity } from './model'

/* ── Search ──────────────────────────────────────────────────────────────── */

/** The search: filters after a short pause (Enter at once), Escape clears, `/` anywhere focuses it. */
export function GridSearch({
  value,
  onChange,
  placeholder,
  debounce = 180,
  shortcut = '/',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounce?: number
  shortcut?: string | false
  className?: string
}) {
  const labels = useCopy()
  placeholder ??= labels.searchPlaceholder
  const [draft, setDraft] = useState(value)
  // What the search last sent: a value that comes back as it was sent is the echo of typing, not a change to follow.
  const [sent, setSent] = useState(value)
  const [seen, setSeen] = useState(value)
  const input = useRef<HTMLInputElement>(null)

  // Another control changed the search (clear all, a view): follow it.
  if (value !== seen) {
    setSeen(value)
    if (value !== sent) {
      setSent(value)
      setDraft(value)
    }
  }

  const commit = (next: string) => {
    setSent(next)
    onChange(next)
  }
  useEffect(() => {
    if (draft === sent) return
    const id = setTimeout(() => commit(draft), debounce)
    return () => clearTimeout(id)
  })

  useEffect(() => {
    if (!shortcut) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== shortcut || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable=true], [role=combobox]')) return
      event.preventDefault()
      input.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [shortcut])

  return (
    <InputGroup data-slot="data-grid-search" className={cn('h-control-sm w-full sm:w-60', className)}>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        ref={input}
        type="search"
        aria-label={labels.search}
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit(draft)
          if (event.key === 'Escape' && draft) {
            event.preventDefault()
            setDraft('')
            commit('')
          }
        }}
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      <InputGroupAddon align="inline-end">
        {draft ? (
          <InputGroupButton
            size="icon-xs"
            aria-label={labels.clearSearch}
            onClick={() => {
              setDraft('')
              commit('')
              input.current?.focus()
            }}
          >
            <XIcon />
          </InputGroupButton>
        ) : (
          shortcut && <Kbd aria-hidden>{shortcut}</Kbd>
        )}
      </InputGroupAddon>
    </InputGroup>
  )
}

/* ── Saved views, as tabs ────────────────────────────────────────────────── */

export interface ViewTab {
  id: string
  label: string
  /** How many rows it holds, shown after its name. */
  count?: number
}

export function ViewTabs({ views, value, onValueChange }: { views: readonly ViewTab[]; value: string; onValueChange: (id: string) => void }) {
  const labels = useCopy()
  const locale = useLocale()
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(String(next))} className="own:min-w-0 shrink">
      {/* shape: a toolbar-sized view switch takes the small control height and tighter padding; the control's own padding or case sits on a more specific selector than a className, so `!` wins; kept because moving it into the recipe layer must not change what shows */}
      <TabsList variant="pill" aria-label={labels.views} className="own:!h-control-sm">
        {views.map((view) => (
          // Bezel sets the label a size down (bezel.css keys on data-view-tab).
          // shape: same view switch as above, a tab with the tighter padding
          <TabsTrigger key={view.id} value={view.id} data-view-tab="" className="group/view-tab own:gap-1.5 own:!px-2.5 own:text-ui-sm">
            {view.label}
            {view.count !== undefined && (
              // On the selected key, the key's own lettering: a muted gray there misses AA (3.5:1).
              <span className="own:font-mono own:text-ui-xs own:text-fg-subtle own:tabular-nums transition-colors yj-duration-fast ease-standard own:group-data-active/view-tab:text-current">
                {view.count.toLocaleString(locale)}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

/* ── Density ─────────────────────────────────────────────────────────────── */

function DensityGlyph({ lines }: { lines: number }) {
  // Three row pitches drawn as bars, so the choice reads without words.
  const gap = lines === 4 ? 3 : lines === 3 ? 4.5 : 6
  const top = (16 - gap * (lines - 1)) / 2
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      {Array.from({ length: lines }, (_, i) => (
        <path key={i} d={`M3 ${top + i * gap}H13`} />
      ))}
    </svg>
  )
}

export function DensitySwitch({ value, onValueChange }: { value: DataGridDensity; onValueChange: (value: DataGridDensity) => void }) {
  const labels = useCopy()
  const options: { value: DataGridDensity; label: string; lines: number }[] = [
    { value: 'compact', label: labels.compactRows, lines: 4 },
    { value: 'comfortable', label: labels.comfortableRows, lines: 3 },
    { value: 'spacious', label: labels.spaciousRows, lines: 2 },
  ]
  return (
    <SegmentedControl aria-label={labels.rowDensity} value={value} onValueChange={(next) => onValueChange(next as DataGridDensity)} className="h-control-sm">
      {options.map((option) => (
        <Tooltip key={option.value}>
          <TooltipTrigger render={<SegmentedControlItem value={option.value} aria-label={option.label} className="own:px-2" />}>
            <DensityGlyph lines={option.lines} />
          </TooltipTrigger>
          <TooltipContent>{option.label}</TooltipContent>
        </Tooltip>
      ))}
    </SegmentedControl>
  )
}

export function ToolbarDivider() {
  return <span aria-hidden className="own:mx-0.5 h-5 w-px shrink-0 own:bg-line" />
}

export function ToolbarSlot({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn('own:flex min-w-0 items-center gap-1.5', className)}>{children}</div>
}
