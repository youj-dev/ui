import { fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { renderFull, renderReduced } from '@youj/core/test-utils'
import { Shimmer, useShimmer } from './shimmer'

type IOCallback = (entries: { isIntersecting: boolean }[]) => void
let observers: { cb: IOCallback; disconnected: boolean }[] = []
beforeEach(() => {
  observers = []
  globalThis.IntersectionObserver = class {
    entry: { cb: IOCallback; disconnected: boolean }
    constructor(cb: IOCallback) {
      this.entry = { cb, disconnected: false }
      observers.push(this.entry)
    }
    observe() {}
    unobserve() {}
    disconnect() {
      this.entry.disconnected = true
    }
    takeRecords() {
      return []
    }
  } as never
})

test('Shimmer wraps content in the effect and brings no look of its own', () => {
  const { container } = renderFull(
    <Shimmer data-testid="s" className="rounded-2xl" speed="fast" borderWidth={2}>
      <textarea aria-label="Prompt" />
    </Shimmer>,
  )
  const root = screen.getByTestId('s')
  expect(root.className).toBe('yj-sb rounded-2xl')
  expect(root.style.getPropertyValue('--yj-sb-width')).toBe('2px')
  expect(root.style.getPropertyValue('--yj-sb-period')).toBe('calc(var(--yj-duration-deliberate) * 3.5)')
  expect(root).toHaveAttribute('data-intensify')
  expect(screen.getByRole('textbox', { name: 'Prompt' })).toBeInTheDocument()
  container.querySelectorAll('.yj-sb__glow, .yj-sb__ring').forEach((layer) => expect(layer).toHaveAttribute('aria-hidden', 'true'))
})

test('idle visibility maps to the ring opacity, and intensify can be turned off', () => {
  renderFull(<Shimmer data-testid="s" idle="hidden" intensify={false} />)
  const root = screen.getByTestId('s')
  expect(root.style.getPropertyValue('--yj-sb-idle-opacity')).toBe('0')
  expect(root).not.toHaveAttribute('data-intensify')
})

test('the loop pauses offscreen and in hidden tabs, and stops observing on unmount', () => {
  const { unmount } = renderFull(<Shimmer data-testid="s" />)
  const root = screen.getByTestId('s')
  observers[0]!.cb([{ isIntersecting: false }])
  expect(root).toHaveAttribute('data-paused')
  observers[0]!.cb([{ isIntersecting: true }])
  expect(root).not.toHaveAttribute('data-paused')

  Object.defineProperty(document, 'hidden', { configurable: true, value: true })
  fireEvent(document, new Event('visibilitychange'))
  expect(root).toHaveAttribute('data-paused')
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })

  unmount()
  expect(observers[0]!.disconnected).toBe(true)
})

test('reduced motion parks the light: marked reduced, nothing observed', () => {
  renderReduced(<Shimmer data-testid="s" />)
  expect(screen.getByTestId('s')).toHaveAttribute('data-reduced')
  expect(observers).toHaveLength(0)
})

function CustomLink() {
  const { rootProps, layers } = useShimmer<HTMLAnchorElement>({ idle: 'visible' })
  return (
    <a href="#pro" {...rootProps} className={`${rootProps.className} rounded-full`}>
      {layers}
      Go Pro
    </a>
  )
}

test('useShimmer puts the effect on any element', () => {
  render(
    <YoujProvider reducedMotion="never">
      <CustomLink />
    </YoujProvider>,
  )
  const link = screen.getByRole('link', { name: 'Go Pro' })
  expect(link).toHaveClass('yj-sb', 'rounded-full')
  expect(link.style.getPropertyValue('--yj-sb-idle-opacity')).toBe('1')
  expect(link.querySelector('.yj-sb__ring')).toBeInTheDocument()
})
