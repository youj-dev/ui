import '@testing-library/jest-dom/vitest'
import { createElement } from 'react'
import { cleanup, configure, render, waitFor } from '@testing-library/react'
import { preloadMotionFeatures } from '@youj/core'

/* waitFor / findBy* give up after 5s instead of 1s. They still return the
 * moment their condition holds, so this only matters when a busy runner makes
 * something take longer to arrive: an announcement on its 370ms timer, a
 * collapse on its 220ms tween. A state asserted *during* a hold needs a faked
 * timer instead (see the Button onAction tests). Reduced-motion "at once"
 * tests run at timeScale 50, where any animation takes 7s or more, so they
 * still fail if something animates. */
configure({ asyncUtilTimeout: 5000 })

/* What jsdom lacks, stubbed once for every test file (the same set as
 * @youj/motion's setup), so no test file carries its own copy. A test that
 * needs different behavior (a phone-sized matchMedia, say) overrides it
 * locally and restores it afterwards. */

// matchMedia: Motion's reduced-motion hook reads it.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// ResizeObserver: Floating UI, cmdk, motion's SlidingIndicator and
// ContentSwap observe their boxes. Nothing resizes in jsdom, so observing is
// a no-op.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// IntersectionObserver: motion's useInView (the DataTable bar's rolling count)
// waits for the viewport. Nothing scrolls into view in jsdom.
if (!globalThis.IntersectionObserver) {
  globalThis.IntersectionObserver = class {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as unknown as typeof IntersectionObserver
}

// The Web Animations API, which Base UI polls to know when a transition has
// finished (e.g. the scroll area's scrollbars). Nothing animates in jsdom.
if (!Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => []
}

// scrollIntoView: cmdk scrolls the active row into view.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// SVG geometry: the miniatures some blocks show measure a few of their parts
// while drawing (the same stand-ins as @youj/miniatures' own setup).
{
  const svg = (globalThis.SVGElement ?? Element).prototype as unknown as Record<string, unknown>
  svg.getTotalLength ??= () => 100
  svg.getPointAtLength ??= () => ({ x: 0, y: 0 })
  svg.getBBox ??= () => ({ x: 0, y: 0, width: 10, height: 10 })
  svg.getComputedTextLength ??= () => 10
  svg.getScreenCTM ??= () => null
}

// window.scrollTo only logs "not implemented" in jsdom; Motion calls it to
// restore the scroll position after measuring a height: auto animation
// (Collapse).
window.scrollTo = () => {}

// Motion's animation features load lazily in an app (motion's
// lib/youj/features.tsx). Tests load them up front, so components animate
// from their first render, as they do once an app has fetched them;
// features.test.tsx covers the lazy path itself.
await preloadMotionFeatures('max')

// Button fetches its spinner on demand, and renders without it until it
// arrives. Fetch it once here, so buttons in tests are complete from their
// first render, as they are in an app once that chunk is loaded;
// button.on-demand.test.tsx covers the on-demand path itself.
{
  const { Button } = await import('../components/ui/button')
  render(createElement(Button, { loading: true }))
  await waitFor(() => {
    if (!document.querySelector('[data-slot=spinner]')) throw new Error('loading')
  })
  cleanup()
}
