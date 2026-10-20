'use client'
import type { ReactNode } from 'react'
import { ThemeScope } from '@youj/core'
import { modePreset, sitePreset } from '@/lib/preview'
import { SITE_INK, SITE_INK_DARK } from '@/lib/site-ink'
import { useSiteTheme } from '@/lib/site-theme'

export function SiteInk({ children, ink = true }: { children: ReactNode; /** false: lit, in Youj's accent (a hovered card). */ ink?: boolean }) {
  const dark = useSiteTheme().dark
  const base = sitePreset(modePreset(dark))
  // Ink in both modes at rest (near-black on light, near-white on dark); lit, Youj's accent (Graphite's blue in light, Basalt's amber in dark).
  const accent = ink ? { light: SITE_INK, dark: SITE_INK_DARK } : base.accent
  return <ThemeScope theme={{ ...base, accent }}>{children}</ThemeScope>
}
