import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './styles/promo.css'
import { useLayoutEffect, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { continueRender, delayRender } from 'remotion'
import { basalt, YoujProvider } from '@youj/core'
import { Simulation } from './sim/simulation'
import youjDisplay from '../../../packages/brand-font/fonts/youj-display.woff2'

export type Theme = 'dark' | 'light'

/** Basalt's faces, from Google Fonts as the docs' font catalogue loads them (no @fontsource package for Geist yet). */
const GEIST = 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap'
/** The site's display face, for its display steps (the docs serve the same file as /fonts/youj-display.woff2). */
const YOUJ_DISPLAY = 'Youj Display'

/**
 * The page every composition renders on: youj's tokens in the given theme
 * (on <html> too, so portaled overlays match), in Basalt and the bezel style
 * (the site's default look), full motion regardless of the
 * OS setting, and the Simulation, mounted only once the fonts are in so no
 * layout shifts mid-simulation.
 */
export function Stage({ theme = 'dark', children }: { theme?: Theme; children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    document.body.style.background = 'var(--color-canvas)'
    document.body.style.margin = '0'
  }, [theme])

  useLayoutEffect(() => {
    const handle = delayRender('youj fonts')
    let link = document.querySelector<HTMLLinkElement>(`link[href="${GEIST}"]`)
    if (!link) {
      link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = GEIST
      document.head.append(link)
    }
    const sheet = link.sheet ? Promise.resolve() : new Promise((resolve) => link.addEventListener('load', resolve, { once: true }))
    const geist = sheet.then(() =>
      Promise.all(['400 16px "Geist"', '500 16px "Geist"', '600 16px "Geist"', '400 16px "Geist Mono"', '500 16px "Geist Mono"'].map((font) => document.fonts.load(font))),
    )
    if (![...document.fonts].some((face) => face.family === YOUJ_DISPLAY)) document.fonts.add(new FontFace(YOUJ_DISPLAY, `url(${youjDisplay})`, { weight: '100 900' }))
    Promise.all([
      geist,
      document.fonts.load(`400 16px "${YOUJ_DISPLAY}"`),
      document.fonts.load('400 16px "Inter Variable"'),
      document.fonts.load('600 16px "Inter Variable"'),
      document.fonts.load('400 16px "JetBrains Mono Variable"'),
    ])
      .catch((error) => console.error(error))
      .finally(() => {
        // The Simulation's first frame (and its own delayRender) exists before the fonts' handle is released.
        flushSync(() => setReady(true))
        continueRender(handle)
      })
  }, [])

  return (
    <YoujProvider reducedMotion="never" theme={basalt} look="bezel">
      <div data-theme={theme} className="absolute inset-0 overflow-hidden bg-canvas font-sans text-fg antialiased">
        {ready && <Simulation>{children}</Simulation>}
      </div>
    </YoujProvider>
  )
}
