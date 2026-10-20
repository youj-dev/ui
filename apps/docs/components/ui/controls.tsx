'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  SegmentedControl,
  SegmentedControlItem,
  Switch as SwitchControl,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@youj/react'
import { cn } from '@/lib/cn'

/* The docs chrome's selectors: one family, built from Youj UI itself.
 * - TabList: which view of a thing is showing. Underline tabs whose bar glides
 *   along the host's hairline, with a hover pill that follows the pointer.
 * - Segmented: which value a setting takes. A recessed track whose raised key
 *   glides to the choice.
 * - Switch: on or off, with its label as part of the target.
 * Every option is at least 32px tall (40px on touch) whatever the preset's
 * density, except in a toolbar (`compact`), where the whole row shares the
 * `control-xs` token; its hit area is the control's full height. Labels keep their
 * padding: a control short of room truncates them, with a tooltip, rather than
 * overflow. The glides are motion's SlidingIndicator on the `smooth` spring,
 * and jump under reduced motion. */

export interface Option<T extends string> {
  value: T
  label: ReactNode
  /** The accessible name, shown as a tooltip, when the label is terse or an icon (e.g. "¼×"). */
  title?: string
}

/** Controls never drop below 32px (40px on touch), even in a compact preset; a comfortable one still grows them. */
const FLOOR = '[--spacing-control:max(calc(2rem_+_max(0rem,var(--yj-density)*0.25rem)_+_var(--yj-touch)*0.5rem),calc(var(--yj-touch)*2.75rem))]'

/**
 * A toolbar's size: the track takes the `control-xs` token (28px in Basalt,
 * 36px on touch), which every other control in a preview's toolbar shares, so
 * the row reads as one. A track is sized by `--spacing-control` and rounded
 * by `--radius-choice`, so the toolbar points both at their xs step.
 * shape: a preview toolbar's tracks take the xs size every control in the toolbar shares
 */
const COMPACT = '[--spacing-control:var(--spacing-control-xs)] [--radius-choice:var(--radius-choice-xs)]'

/** True while `ref`'s text is cut short by its box. */
export function useTruncated<E extends HTMLElement>() {
  const ref = useRef<E>(null)
  const [truncated, setTruncated] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setTruncated(el.scrollWidth - el.clientWidth > 0.5)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, truncated] as const
}

export function TabList<T extends string>({
  tabs,
  value,
  onChange,
  idBase,
  label,
  variant = 'underline',
  fill = false,
  compact = false,
  className,
}: {
  tabs: Option<T>[]
  value: T
  onChange: (value: T) => void
  /** Prefix for tab and panel ids: `${idBase}-tab-${value}` / `${idBase}-panel-${value}`. The panels are the host's. */
  idBase: string
  label: string
  /** 'underline' runs on its host's hairline; 'pill' is a track with a raised key, for tabs that stand on their own (Create's steps). */
  variant?: 'underline' | 'pill'
  /** The tabs share the full width. */
  fill?: boolean
  /** A toolbar's tabs (a preview's Preview and Code, an install's Package and Registry): the row's compact size, the label a step smaller, the keys tighter. */
  compact?: boolean
  className?: string
}) {
  const pill = variant === 'pill'
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as T)}
      // The host draws the hairline the bar runs on, across its whole width.
      className={cn('min-w-0 [&_[data-slot=tabs-list-frame]]:shadow-none!', className)}
    >
      <TabsList aria-label={label} variant={variant} className={cn(pill && FLOOR, compact && COMPACT, fill && 'w-full')}>
        {tabs.map((tab) => (
          // shape: the compact bar tightens its tabs; `!` wins over the tab padding set above
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            id={`${idBase}-tab-${tab.value}`}
            aria-controls={`${idBase}-panel-${tab.value}`}
            aria-label={tab.title}
            // A pill's hit area takes in the track's padding, as a segment's does.
            className={cn(fill && 'flex-1', pill && 'px-3 after:absolute after:-inset-0.5 touch:after:-inset-1', compact && 'px-2.5! text-ui-xs')}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

function Segment<T extends string>({ option, numeric, compact }: { option: Option<T>; numeric: boolean; compact: boolean }) {
  const [label, truncated] = useTruncated<HTMLSpanElement>()
  const tip = option.title ?? (typeof option.label === 'string' ? option.label : undefined)
  return (
    <Tooltip disabled={!tip || (!option.title && !truncated)}>
      <TooltipTrigger
        render={
          // shape: the compact switch tightens its items; `!` wins over the item padding
          <SegmentedControlItem
            value={option.value}
            aria-label={option.title}
            // Sized by its label (never an equal split that squeezes one), and
            // allowed to shrink only by truncating it.
            // Compact keys are a toolbar's: an icon's is near square, a word's a step smaller.
            className={cn('min-w-0 flex-auto px-3', numeric && 'px-2.5 tabular-nums', compact && 'px-2.5! text-ui-sm', compact && typeof option.label !== 'string' && 'px-2!')}
          />
        }
      >
        <span ref={label} className="min-w-0 truncate">
          {option.label}
        </span>
      </TooltipTrigger>
      {tip && <TooltipContent>{tip}</TooltipContent>}
    </Tooltip>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  labelledBy,
  numeric = false,
  compact = false,
  disabled,
  className,
}: {
  options: Option<T>[]
  /** Null while the value isn't known yet (before hydration): no segment is raised. */
  value: T | null
  /** Called with the new value and the segment that was pressed (where a theme change grows from). */
  onChange: (value: T, segment: HTMLElement | null) => void
  /** The control's accessible name, or… */
  label?: string
  /** …the id of the visible text that names it. */
  labelledBy?: string
  /** Numeric options (speeds, sizes): tabular figures, tighter keys. */
  numeric?: boolean
  /** A toolbar's control: the row's compact size (`control-xs`) instead of the 32px floor. */
  compact?: boolean
  disabled?: boolean
  className?: string
}) {
  const group = useRef<HTMLDivElement>(null)
  return (
    // The site has no tooltip provider at its root (it would ship the tooltip's code to every page): each group brings its own.
    <TooltipProvider>
      <SegmentedControl
        ref={group}
        aria-label={label}
        aria-labelledby={labelledBy}
        value={value ?? ''}
        disabled={disabled}
        onValueChange={(next) => {
          const index = options.findIndex((o) => o.value === next)
          onChange(next as T, group.current?.querySelectorAll<HTMLElement>(':scope > button')[index] ?? null)
        }}
        className={cn(compact ? COMPACT : FLOOR, 'max-w-full', className)}
      >
        {options.map((option) => (
          <Segment key={option.value} option={option} numeric={numeric} compact={compact} />
        ))}
      </SegmentedControl>
    </TooltipProvider>
  )
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: ReactNode
  className?: string
}) {
  // The label is the switch's name and part of its target.
  return (
    <label
      className={cn(
        'inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-md px-1.5 text-ui font-medium text-fg-muted transition-colors yj-duration-fast ease-standard select-none hover:text-fg pointer-coarse:h-10',
        className,
      )}
    >
      <SwitchControl checked={checked} onCheckedChange={(next) => onCheckedChange(next)} />
      {label}
    </label>
  )
}
