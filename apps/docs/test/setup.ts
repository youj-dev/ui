import '@testing-library/jest-dom/vitest'
import { configure } from '@testing-library/react'

// findBy* and waitFor give up after 5s, not 1s, like packages/ui's setup: the menus, explorers and cards load their
// parts as lazy chunks, and a busy machine (parallel verify, an agent building) takes longer than a second to import
// them. They still return the moment the condition holds.
configure({ asyncUtilTimeout: 5000 })

// jsdom lacks matchMedia; Motion's reduced-motion hook reads it.
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

// jsdom lacks IntersectionObserver; Motion's useInView reads it. Nothing is ever in view.
if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  window.IntersectionObserver = class {
    readonly root = null
    readonly rootMargin = '0px'
    readonly thresholds = [0]
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as unknown as typeof IntersectionObserver
}

// jsdom lacks ResizeObserver, and lays nothing out: sizes are measured once, on observe.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

