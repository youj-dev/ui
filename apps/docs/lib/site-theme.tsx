'use client'

import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { useTheme as useColorScheme } from 'fumadocs-ui/provider/base'
import { useYouj } from '@youj/core'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { modePreset } from '@/lib/site-mode'

/* The site's theme, behind one hook, so every switcher on the site (the
 * header, the menu, the palette) moves the same thing: light or dark for the
 * whole document, revealed as a circle from where it was asked for. That's
 * the only choice the site offers: it wears Basalt in dark and, in light,
 * Basalt's character in Graphite's colors (lib/site-preset), its own chrome in Classic, following the OS's
 * reduced-motion setting. Presets,
 * the component style and motion settings belong to the previews, which
 * change only themselves (lib/preview.ts). */

export interface Point {
  x: number
  y: number
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { ready: Promise<void> } }

const subscribe = () => () => {}

export function useSiteTheme() {
  const k = useYouj()
  const { resolvedTheme, setTheme } = useColorScheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const dark = mounted && resolvedTheme === 'dark'

  /* The new mode grows as a circle from `from` (else the screen's top
   * center), on the deliberate token with the emphasized curve. Without View
   * Transitions, or under reduced motion, it switches in place. */
  const reveal = (update: () => void, from?: Point) => {
    const doc = document as ViewTransitionDocument
    if (k.reduced || !doc.startViewTransition) {
      update()
      return
    }
    const x = from?.x ?? window.innerWidth / 2
    const y = from?.y ?? 0
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    doc
      .startViewTransition(() => flushSync(update))
      .ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: k.ms('deliberate'), easing: `cubic-bezier(${k.ease('emphasized').join(',')})`, pseudoElement: '::view-transition-new(root)' },
        )
      })
      .catch(() => {})
  }

  return {
    /** False until the stored mode is known (after hydration). */
    mounted,
    dark,
    toggleMode: (from?: Point) => reveal(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'), from),
  }
}

/**
 * The stock preset for the site's current mode (Graphite in light, Basalt in dark),
 * which a preview wears until its toolbar picks another. Null until the
 * stored mode is known (the server's render and hydration): a preview then
 * inherits <html>'s own preset, which the stylesheet already switched by mode.
 * An unknown mode reads as the site's default, dark.
 */
export function useModePreset(): ThemeId | null {
  const { resolvedTheme } = useColorScheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  return mounted ? modePreset(resolvedTheme !== 'light') : null
}

/** The center of the element an event came from: where a theme change grows from. */
export function originOf(target: Element): Point {
  const box = target.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}
