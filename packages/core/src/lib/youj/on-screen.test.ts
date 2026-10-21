import { afterEach, describe, expect, it, vi } from 'vitest'
import { observeOnScreen } from './on-screen'

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void

function stubObserver() {
  const state = { cb: undefined as Callback | undefined, options: undefined as unknown, disconnected: false }
  class FakeObserver {
    constructor(cb: Callback, options?: unknown) {
      state.cb = cb
      state.options = options
    }
    observe() {}
    disconnect() {
      state.disconnected = true
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  return state
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden })
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: hidden ? 'hidden' : 'visible' })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  vi.unstubAllGlobals()
  setHidden(false)
})

describe('observeOnScreen', () => {
  it('reports changes in intersection and ignores repeats', () => {
    const io = stubObserver()
    const seen: boolean[] = []
    observeOnScreen(document.createElement('div'), (on) => seen.push(on))
    expect(seen).toEqual([])
    io.cb!([{ isIntersecting: false }])
    io.cb!([{ isIntersecting: false }])
    io.cb!([{ isIntersecting: true }])
    io.cb!([])
    expect(seen).toEqual([false, true])
  })

  it('reports the starting state right away when immediate, and passes rootMargin', () => {
    const io = stubObserver()
    const seen: boolean[] = []
    observeOnScreen(document.createElement('div'), (on) => seen.push(on), { immediate: true, rootMargin: '100px' })
    expect(seen).toEqual([true])
    expect(io.options).toEqual({ rootMargin: '100px' })
  })

  it('counts a hidden tab as off screen even while intersecting', () => {
    const io = stubObserver()
    const seen: boolean[] = []
    observeOnScreen(document.createElement('div'), (on) => seen.push(on), { immediate: true })
    setHidden(true)
    io.cb!([{ isIntersecting: true }])
    setHidden(false)
    expect(seen).toEqual([true, false, true])
  })

  it('treats the element as on screen where IntersectionObserver is missing', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const seen: boolean[] = []
    const stop = observeOnScreen(document.createElement('div'), (on) => seen.push(on))
    expect(seen).toEqual([true])
    setHidden(true)
    expect(seen).toEqual([true, false])
    stop()
    setHidden(false)
    expect(seen).toEqual([true, false])
  })

  it('disconnects and stops listening on cleanup', () => {
    const io = stubObserver()
    const seen: boolean[] = []
    const stop = observeOnScreen(document.createElement('div'), (on) => seen.push(on), { immediate: true })
    stop()
    expect(io.disconnected).toBe(true)
    setHidden(true)
    expect(seen).toEqual([true])
  })
})
