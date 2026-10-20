import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { YoujProvider } from './lib/youj/provider'

/* jsdom has no IntersectionObserver or ResizeObserver. These stubs report
 * everything as intersecting and record live observers so tests can check cleanup. */
export const liveObservers = new Set<object>()

class StubIntersectionObserver {
  constructor(private cb: IntersectionObserverCallback) {
    liveObservers.add(this)
  }
  observe(target: Element) {
    this.cb([{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry], this as never)
  }
  unobserve() {}
  disconnect() {
    liveObservers.delete(this)
  }
  takeRecords() {
    return []
  }
}

class StubResizeObserver {
  constructor() {
    liveObservers.add(this)
  }
  observe() {}
  unobserve() {}
  disconnect() {
    liveObservers.delete(this)
  }
}

export function installObservers() {
  globalThis.IntersectionObserver = StubIntersectionObserver as never
  globalThis.ResizeObserver = StubResizeObserver as never
}

/* Wrapper-based, so rerender() keeps the provider. */
export function renderReduced(ui: ReactElement) {
  return render(ui, { wrapper: ({ children }) => <YoujProvider reducedMotion="always">{children}</YoujProvider> })
}

export function renderFull(ui: ReactElement) {
  return render(ui, { wrapper: ({ children }) => <YoujProvider reducedMotion="never">{children}</YoujProvider> })
}
