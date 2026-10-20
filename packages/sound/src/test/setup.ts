import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// The provider remembers the user's mute in localStorage: one test's mute doesn't carry into the next.
if (typeof window !== 'undefined') afterEach(() => localStorage.clear())

// matchMedia: useYouj reads the OS reduced-motion setting through it.
if (typeof window !== 'undefined' && !window.matchMedia) {
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
