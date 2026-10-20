'use client'

import { ThemeIcon } from '@youj/icons'
import { useSoundCue } from '@youj/core/lib/youj/sound-cue'
import { originOf, useSiteTheme } from '@/lib/site-theme'

/**
 * The header's theme control: one button that switches the site between
 * light and dark, the new mode growing as a circle from it. The site wears
 * Basalt in dark and Basalt's character in Graphite's blue in light; presets are tried in the previews and in Create.
 */
export function ThemeControl() {
  const theme = useSiteTheme()
  const cue = useSoundCue()
  const label = theme.mounted ? (theme.dark ? 'Switch to light theme' : 'Switch to dark theme') : 'Switch theme'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        cue('tap')
        theme.toggleMode(originOf(event.currentTarget))
      }}
      className="inline-grid size-8 touch:size-11 place-items-center rounded-lg text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring"
    >
      {theme.mounted ? <ThemeIcon size={18} strokeWidth={1.6} active={theme.dark} /> : <span className="size-[18px]" />}
    </button>
  )
}
