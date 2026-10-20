'use client'

import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { DEFAULT_STYLE } from '@youj/core/lib/youj/theme'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@youj/react'
import { LookSegmented, TOOLBAR_MENU } from '@/components/ui/preview-controls'
import { cn } from '@/lib/cn'
import { previewName, previewPresets, SITE_PRESET } from '@/lib/preview'
import { useModePreset } from '@/lib/site-theme'
import { setPreviewLook, useShowcaseLook } from '@/lib/showcase-theme'
import { Swatch } from './theme-tag'

/**
 * The preset a preview's toolbar wears, as a dropdown at the row's `control-xs`
 * size: the trigger shows the current one (swatch and name), the list every
 * preset the library ships, the site's for the mode first. A null `value` is
 * that default, which follows the mode until one is picked. The one theme
 * control of every preview toolbar, and of View options on a phone.
 */
export function ThemeSelect({
  value,
  onChange,
  describedBy,
  size = 'xs',
  className,
}: {
  value: ThemeId | null
  onChange: (preset: ThemeId) => void
  describedBy?: string
  /** `xs`: the preview toolbar row's `control-xs`. `md`: a gallery bar's control height, the search field's. */
  size?: 'xs' | 'md'
  className?: string
}) {
  const modeDefault = useModePreset() ?? SITE_PRESET.dark
  const current = value ?? modeDefault
  const presets = previewPresets(modeDefault === SITE_PRESET.dark)
  return (
    <Select items={Object.fromEntries(presets.map((t) => [t.id, t.name]))} value={current} onValueChange={(next) => next && onChange(next as ThemeId)}>
      <SelectTrigger
        size={size === 'xs' ? 'sm' : 'default'}
        aria-label={`Palette: ${previewName(current)}`}
        aria-describedby={describedBy}
        className={cn(size === 'xs' ? TOOLBAR_MENU : 'gap-2 text-ui', 'shrink-0', className)}
      >
        <Swatch preset={current} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false} className="w-auto min-w-44">
        <SelectGroup>
          <SelectLabel>Theme</SelectLabel>
          {presets.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              <Swatch preset={theme.id} />
              {theme.name}
              {theme.id === modeDefault && <span className="ms-auto ps-3 text-ui-xs text-fg-muted">Default</span>}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

/**
 * The same picker for a docs example's toolbar, at the row's size: its preset
 * is that preview's own (`value`, the site's for the mode until one is
 * picked), the style the reader's for every preview (lib/showcase-theme).
 * Nothing goes in the URL.
 */
export function PreviewLook({ value, onChange }: { value: ThemeId | null; onChange: (preset: ThemeId) => void }) {
  const style = useShowcaseLook() ?? DEFAULT_STYLE
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <ThemeSelect value={value} onChange={onChange} />
      <LookSegmented value={style} onChange={setPreviewLook} compact />
    </div>
  )
}
