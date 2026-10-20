'use client'

import { ThemeScope } from '@youj/core'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { sitePreset } from '@/lib/preview'
import { cn } from '@/lib/cn'

/** A swatch in a preset's own accent, derived for the page's light or dark like every accent. */
export function Swatch({ preset, className }: { preset: ThemeId; className?: string }) {
  return (
    <ThemeScope theme={sitePreset(preset)}>
      <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full bg-accent ring-1 ring-line-subtle', className)} />
    </ThemeScope>
  )
}
