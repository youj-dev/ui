'use client'

import type { ReactNode } from 'react'
import { styles, type StyleId } from '@youj/core'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@youj/react/components/ui/select'
import { Segmented } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import { type PreviewSpeed } from '@/lib/preview'

/* The pieces every preview toolbar shares (a docs example's, a block's or
 * example's frame, Create's): its one size, the component style switch, the
 * menu each of View options' settings is, and the speeds' names. */

export const SPEED_LABEL: Record<PreviewSpeed, { short: string; name: string }> = {
  2: { short: '2×', name: 'Double speed' },
  1: { short: '1×', name: 'Normal speed' },
  0.5: { short: '½×', name: 'Half speed' },
  0.25: { short: '¼×', name: 'Quarter speed' },
}

/**
 * A preview toolbar's one size: tabs, menus, segments and buttons all take the
 * `control-xs` token (28px in the site's presets, 36px on touch), so the row reads as a
 * single strip of controls. Menus take it through the kit's small trigger, and
 * are rounded like the tracks beside them (pills in a pill theme), fields on
 * the frame's card.
 */
export const TOOLBAR_MENU = 'data-[size=sm]:h-control-xs gap-1.5 rounded-field-xs text-ui-sm'
/** An icon button in a preview toolbar (Replay, Reload, Open), the same height as its menus. */
export const TOOLBAR_BUTTON = 'icon-button size-control-xs rounded-button-xs'

/** The style a preview is built in: Clean (the default), Bezel, Classic, Brutal or Terminal. Each brings its look. */
export function LookSegmented({
  value,
  onChange,
  compact,
  className,
}: {
  value: StyleId | null
  onChange: (style: StyleId) => void
  /** In a preview's toolbar: the row's compact size. */
  compact?: boolean
  className?: string
}) {
  return (
    <Segmented
      label="Style"
      compact={compact}
      value={value}
      onChange={(next) => onChange(next)}
      options={styles.map((style) => ({ value: style.id, label: style.name }))}
      className={className}
    />
  )
}

/**
 * One of a preview's settings as a menu (View options' rows): the current choice on its trigger, every choice in the
 * list, so a setting can take more choices without outgrowing its row. `value` is null when none applies (shown as
 * the placeholder).
 */
export function MenuSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder = '—',
  icon,
}: {
  label: string
  value: T | null
  options: { value: T; label: string; detail?: string }[]
  onChange: (value: T) => void
  disabled?: boolean
  placeholder?: string
  icon?: ReactNode
}) {
  const current = options.find((o) => o.value === value)
  return (
    <Select items={Object.fromEntries(options.map((o) => [o.value, o.label]))} value={value} onValueChange={(next) => next != null && onChange(next as T)} disabled={disabled}>
      {/* shape: a toolbar menu is flat on the toolbar well, so `!` drops the field shadow */}
      <SelectTrigger size="sm" aria-label={`${label}: ${current?.label ?? placeholder}`} className={cn(TOOLBAR_MENU, 'site-fill w-32 justify-between tabular-nums shadow-none!')}>
        {icon}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false} className="w-auto min-w-44">
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="tabular-nums">
              {o.label}
              {o.detail && <span className="ms-auto ps-3 text-ui-xs text-fg-muted">{o.detail}</span>}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
