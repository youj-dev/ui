import { render, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CursorFollower } from './cursor-follower'

const original = window.matchMedia

function mockPointer(fine: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('pointer: fine') ? fine : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

afterEach(() => {
  window.matchMedia = original
})

const layer = () => document.querySelector('[data-yj-cursor]')

test('renders a cursor layer for a fine pointer with full motion', () => {
  mockPointer(true)
  render(
    <YoujProvider reducedMotion="never">
      <CursorFollower />
    </YoujProvider>,
  )
  expect(layer()).toBeInTheDocument()
  expect(layer()).toHaveAttribute('aria-hidden', 'true')
})

test('renders nothing under reduced motion and never hides the native cursor', () => {
  mockPointer(true)
  render(
    <YoujProvider reducedMotion="always">
      <CursorFollower hideNativeCursor />
    </YoujProvider>,
  )
  document.dispatchEvent(new MouseEvent('pointermove', { clientX: 10, clientY: 10, bubbles: true }))
  expect(layer()).not.toBeInTheDocument()
  expect(document.documentElement).not.toHaveAttribute('data-yj-cursor-hidden')
})

test('renders nothing for touch / coarse pointers', () => {
  mockPointer(false)
  render(
    <YoujProvider reducedMotion="never">
      <CursorFollower hideNativeCursor />
    </YoujProvider>,
  )
  expect(layer()).not.toBeInTheDocument()
  expect(document.documentElement).not.toHaveAttribute('data-yj-cursor-hidden')
})

test('renders nothing on the low motion-budget tier, and the native cursor stays', () => {
  mockPointer(true)
  const { rerender } = render(
    <YoujProvider reducedMotion="never" quality="low">
      <CursorFollower hideNativeCursor />
    </YoujProvider>,
  )
  document.body.dispatchEvent(new MouseEvent('pointermove', { clientX: 10, clientY: 10, bubbles: true }))
  expect(layer()).not.toBeInTheDocument()
  expect(document.documentElement).not.toHaveAttribute('data-yj-cursor-hidden')

  rerender(
    <YoujProvider reducedMotion="never" quality="high">
      <CursorFollower hideNativeCursor />
    </YoujProvider>,
  )
  expect(layer()).toBeInTheDocument()
})

test('restores the native cursor on unmount', () => {
  mockPointer(true)
  const { unmount } = render(
    <YoujProvider reducedMotion="never">
      <CursorFollower hideNativeCursor />
    </YoujProvider>,
  )
  const move = new MouseEvent('pointermove', { clientX: 10, clientY: 10, bubbles: true })
  document.body.dispatchEvent(move)
  expect(document.documentElement).toHaveAttribute('data-yj-cursor-hidden')
  unmount()
  expect(document.documentElement).not.toHaveAttribute('data-yj-cursor-hidden')
  expect(layer()).not.toBeInTheDocument()
})

test('with the native cursor hidden, the dot marks the pointer but steps aside for the View badge', async () => {
  mockPointer(true)
  const { getByText } = render(
    <YoujProvider reducedMotion="never" timeScale={0.05}>
      <CursorFollower hideNativeCursor />
      <p>Plain</p>
      <figure data-cursor="media">Shot</figure>
    </YoujProvider>,
  )
  const dot = () => document.querySelector<HTMLElement>('[data-yj-cursor] .rounded-full')!
  getByText('Plain').dispatchEvent(new MouseEvent('pointermove', { clientX: 10, clientY: 10, bubbles: true }))
  await waitFor(() => expect(Number(dot().style.opacity)).toBeCloseTo(1, 1))
  getByText('Shot').dispatchEvent(new MouseEvent('pointermove', { clientX: 40, clientY: 40, bubbles: true }))
  await waitFor(() => expect(Number(dot().style.opacity)).toBeCloseTo(0, 1))
})
