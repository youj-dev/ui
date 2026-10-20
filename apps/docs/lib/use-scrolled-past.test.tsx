import { act, render, screen } from '@testing-library/react'
import { useScrolledPast } from './use-scrolled-past'

/* Scrolling must never read scrollY: that forced a style and layout pass in
 * every scroll event. The hook watches a strip at the top of the page instead. */

let callback: IntersectionObserverCallback | undefined
let observed: Element | undefined
const disconnect = vi.fn()

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb
      }
      observe(el: Element) {
        observed = el
      }
      disconnect = disconnect
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

function Probe() {
  return <output>{String(useScrolledPast('100vh'))}</output>
}

const cross = (isIntersecting: boolean) =>
  act(() => callback!([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver))

test('flips when the strip leaves and re-enters the viewport, without reading scrollY', () => {
  const scrollY = vi.spyOn(window, 'scrollY', 'get')
  render(<Probe />)
  expect(screen.getByRole('status').textContent).toBe('false')
  expect(observed).toBeInstanceOf(HTMLElement)
  expect((observed as HTMLElement).style.height).toBe('100vh')
  cross(false)
  expect(screen.getByRole('status').textContent).toBe('true')
  cross(true)
  expect(screen.getByRole('status').textContent).toBe('false')
  window.dispatchEvent(new Event('scroll'))
  expect(scrollY).not.toHaveBeenCalled()
})

test('disconnects on unmount and keeps its strip for the next page, so a navigation never changes <body>', () => {
  const { unmount } = render(<Probe />)
  const strip = observed!
  expect(strip.isConnected).toBe(true)
  expect(strip.getAttribute('aria-hidden')).toBe('true')
  unmount()
  expect(disconnect).toHaveBeenCalled()
  expect(strip.isConnected).toBe(true)
  render(<Probe />)
  expect(observed).toBe(strip)
})
