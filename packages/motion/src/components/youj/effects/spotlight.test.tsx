import { useRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { renderFull, renderReduced } from '@youj/core/test-utils'
import { SpotlightGroup, SpotlightSurface, useSpotlight } from './spotlight'

/* jsdom has no PointerEvent constructor with pointerType, so events are built by hand. */
function pointerMove(el: Element, x: number, y: number, pointerType = 'mouse') {
  const e = new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y })
  Object.defineProperty(e, 'pointerType', { value: pointerType })
  fireEvent(el, e)
}

let rafs: FrameRequestCallback[] = []
beforeEach(() => {
  rafs = []
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => rafs.push(cb))
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())
const flush = () => rafs.splice(0).forEach((cb) => cb(0))

function rectAt(el: Element, left: number, top: number) {
  el.getBoundingClientRect = () => ({ left, top, width: 100, height: 80, right: left + 100, bottom: top + 80, x: left, y: top, toJSON() {} })
}

test('a group gives every surface the pointer in its own coordinates, once per frame', () => {
  renderFull(
    <SpotlightGroup data-testid="group">
      <SpotlightSurface data-testid="a" />
      <SpotlightSurface data-testid="b" />
    </SpotlightGroup>,
  )
  rectAt(screen.getByTestId('a'), 0, 0)
  rectAt(screen.getByTestId('b'), 120, 0)
  pointerMove(screen.getByTestId('a'), 50, 40)
  pointerMove(screen.getByTestId('a'), 60, 40)
  expect(rafs).toHaveLength(1)
  flush()
  expect(screen.getByTestId('a').style.getPropertyValue('--yj-spot-x')).toBe('60px')
  expect(screen.getByTestId('b').style.getPropertyValue('--yj-spot-x')).toBe('-60px')
  expect(screen.getByTestId('group')).toHaveAttribute('data-yj-spot-active')
})

test('touch does not move the light, and leaving the group puts it out', () => {
  renderFull(
    <SpotlightGroup data-testid="group">
      <SpotlightSurface data-testid="a" />
    </SpotlightGroup>,
  )
  pointerMove(screen.getByTestId('a'), 10, 10, 'touch')
  expect(rafs).toHaveLength(0)
  pointerMove(screen.getByTestId('a'), 10, 10)
  fireEvent.pointerLeave(screen.getByTestId('group'))
  expect(screen.getByTestId('group')).not.toHaveAttribute('data-yj-spot-active')
})

test('a standalone surface tracks itself; inside a group it leaves tracking to the group', () => {
  renderFull(<SpotlightSurface data-testid="alone" radius={120} />)
  const alone = screen.getByTestId('alone')
  expect(alone.style.getPropertyValue('--yj-spot-r')).toBe('120px')
  rectAt(alone, 10, 10)
  pointerMove(alone, 30, 30)
  flush()
  expect(alone.style.getPropertyValue('--yj-spot-x')).toBe('20px')
  expect(alone).toHaveAttribute('data-yj-spot-active')
})

test('surfaces bring no look of their own; the effect is the only class', () => {
  renderFull(<SpotlightSurface data-testid="s" className="rounded-2xl" />)
  expect(screen.getByTestId('s').className).toBe('yj-spot rounded-2xl')
})

test('the lit layers are hidden from assistive tech', () => {
  const { container } = renderFull(<SpotlightSurface />)
  container.querySelectorAll('.yj-spot__surface, .yj-spot__edge').forEach((layer) => {
    expect(layer).toHaveAttribute('aria-hidden', 'true')
  })
})

test('reduced motion never tracks and marks surfaces for the static border', () => {
  renderReduced(
    <SpotlightGroup data-testid="group">
      <SpotlightSurface data-testid="a" />
    </SpotlightGroup>,
  )
  pointerMove(screen.getByTestId('a'), 10, 10)
  expect(rafs).toHaveLength(0)
  expect(screen.getByTestId('group')).not.toHaveAttribute('data-yj-spot-active')
  expect(screen.getByTestId('a')).toHaveAttribute('data-reduced')
})

function Custom() {
  const ref = useRef<HTMLDivElement>(null)
  useSpotlight(ref)
  return (
    <div ref={ref} data-testid="root">
      <div data-yj-spot-card="" data-testid="card" />
    </div>
  )
}

test('useSpotlight drives any markup that opts in with data-yj-spot-card, and cleans up on unmount', () => {
  const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener')
  const { unmount } = render(
    <YoujProvider reducedMotion="never">
      <Custom />
    </YoujProvider>,
  )
  rectAt(screen.getByTestId('card'), 0, 0)
  pointerMove(screen.getByTestId('card'), 5, 6)
  flush()
  expect(screen.getByTestId('card').style.getPropertyValue('--yj-spot-y')).toBe('6px')
  const root = screen.getByTestId('root')
  unmount()
  const removed = removeSpy.mock.calls.map(([type]) => type)
  expect(removed).toEqual(expect.arrayContaining(['pointermove', 'pointerleave', 'focusin', 'focusout']))
  expect(root).not.toHaveAttribute('data-yj-spot-active')
})
