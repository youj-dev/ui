'use client'

import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { useTheme as useColorScheme } from 'fumadocs-ui/provider/base'
import { SearchProvider } from 'fumadocs-ui/contexts/search'
import { useDemoToasterShown } from '@/lib/demo-toasters'
import { settleModeSwitch } from '@/lib/site-mode'
import { useModePreset } from '@/lib/site-theme'
import type { SearchOptions } from '@/components/site/search'
import { loadSearch } from '@/components/site/search-seed'
import { SiteSound } from '@/components/site/site-sound'
import { DevPanelGate } from '@/components/site/dev-panel-gate'

/* <html>'s data-yj-theme names the preset the stylesheet is showing for the
 * mode, for what reads it (the product hero); the stylesheet itself needs no
 * attribute. The tab icon and the browser bar's color follow the mode too:
 * the layout's tags carry both modes' values (lib/site-brand), which the
 * pre-paint script chose from before first paint, and this keeps them in step
 * with every change after it. */
function SitePresetMarker() {
  const preset = useModePreset()
  const { resolvedTheme } = useColorScheme()
  // A framed demo's document takes its preset from its page (lib/frame-sync), which reads this attribute.
  const framed = usePathname()?.startsWith('/view/')
  useEffect(() => {
    if (preset && !framed) document.documentElement.setAttribute('data-yj-theme', preset)
  }, [preset, framed])
  const shown = useRef(resolvedTheme)
  useEffect(() => {
    if (!resolvedTheme || framed) return
    const mode = resolvedTheme === 'light' ? 'light' : 'dark'
    for (const el of document.head.querySelectorAll('[data-brand]')) {
      const value = el.getAttribute(`data-${mode}`)
      if (value) el.setAttribute(el.getAttribute('data-brand')!, value)
    }
    // A switch (not the first mode known): settled once next-themes, whose
    // effect runs after this one in the same flush, has written the mode.
    if (shown.current && shown.current !== resolvedTheme) queueMicrotask(settleModeSwitch)
    shown.current = resolvedTheme
  }, [resolvedTheme, framed])
  return null
}

const Toaster = lazy(() => import('@youj/react/components/ui/toast').then((m) => ({ default: m.Toaster })))

/* Framed demos under /view bring their own Toaster; a second one there would
 * repeat the region. Nothing toasts before someone does something, so the
 * region and its code arrive once the page is idle, or at the first press or
 * key, whichever is sooner, and stay out of the page's load. */
function SiteToaster() {
  const framed = usePathname()?.startsWith('/view/')
  const [wanted, setWanted] = useState(false)
  useEffect(() => {
    if (framed || wanted) return
    const want = () => setWanted(true)
    const idle = window.requestIdleCallback ? window.requestIdleCallback(want, { timeout: 2000 }) : window.setTimeout(want, 1000)
    window.addEventListener('pointerdown', want, { capture: true, once: true })
    window.addEventListener('keydown', want, { capture: true, once: true })
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
      window.removeEventListener('pointerdown', want, { capture: true })
      window.removeEventListener('keydown', want, { capture: true })
    }
  }, [framed, wanted])
  // A demo that brings its own Toaster takes over while it's on the page; this one comes back after.
  const demoOwns = useDemoToasterShown()
  if (framed || !wanted || demoOwns) return null
  return (
    <Suspense fallback={null}>
      <Toaster />
    </Suspense>
  )
}

// Loaded on the first open (preload={false} below mounts no dialog until then): the palette, Orama and the Markdown parser stay out of every page load.
const SiteSearch = lazy(loadSearch)

/* next-themes writes both `class="dark"` (Fumadocs' dark variant) and
 * `data-theme` (youj's token overrides), so one toggle drives both. A
 * first visit follows the OS's light or dark; the header's toggle stores a
 * choice of its own, which wins from then on. The site's
 * theme follows that mode (Basalt in dark, SITE_LIGHT in light) from a
 * stylesheet in <head> (lib/site-preset), so the provider carries no theme
 * of its own: it holds the site's clock, the motion personality the presets
 * share (read from <html>), the OS's reduced-motion setting, and the default
 * look, Classic, for the site's own chrome (every preview sets its own style,
 * lib/preview.ts). One
 * Toaster serves every page. Sound is the provider's `sound`, with
 * @youj/sound behind it only once the visitor turns sound on. */
export function Providers({ children, search }: { children: ReactNode; search: SearchOptions }) {
  // Fumadocs turns on next-themes' transition-blocking stylesheet (two extra full restyles per switch); SitePresetMarker settles a switch in one.
  return (
    <RootProvider
      theme={{ attribute: ['class', 'data-theme'], defaultTheme: 'dark', enableSystem: true, disableTransitionOnChange: false }}
      search={{ enabled: false }}
    >
      {/* Above search, whose palette the provider renders beside the page, so its cues sound too. */}
      <SiteSound>
        <SearchProvider SearchDialog={SiteSearch} options={search} preload={false}>
          <SitePresetMarker />
          {children}
          <SiteToaster />
          {/* The colour panel isn't ready for visitors: local dev only, never in a build (staging or production). */}
          {process.env.NODE_ENV === 'development' && <DevPanelGate />}
        </SearchProvider>
      </SiteSound>
    </RootProvider>
  )
}
