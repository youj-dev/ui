import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { preloadMotionFeatures } from '../lib/youj/features'

/* What jsdom lacks, stubbed once for every test file (the same set as
 * @youj/react's setup). Tests that need to observe these (what is being
 * resized, whether an element intersects) install a recording double over
 * them, e.g. installObservers() from primitives/test-utils. */

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

// ResizeObserver: the blocks and primitives observe their boxes. Nothing
// resizes in jsdom, so observing is a no-op.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// The Web Animations API, which code waiting for a transition to finish polls
// (Base UI does). Nothing animates in jsdom.
if (!Element.prototype.getAnimations) {
  Element.prototype.getAnimations = () => []
}

// scrollIntoView: lists scroll their active row into view.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// window.scrollTo only logs "not implemented" in jsdom; Motion calls it to
// restore the scroll position after measuring a height: auto animation.
window.scrollTo = () => {}

// What one test stores (a remembered mute, a theme choice) doesn't carry into the next.
afterEach(() => localStorage.clear())

// Motion's animation features load lazily in an app (motion's
// lib/youj/features.tsx). Tests load them up front, so components animate
// from their first render, as they do once an app has fetched them;
// features.test.tsx covers the lazy path itself.
await preloadMotionFeatures('max')
