import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { renderFull, renderReduced } from '@youj/core/test-utils'
import { SlidingIndicator, type SlidingIndicatorProps } from './sliding-indicator'

/* jsdom has no layout. Elements get their rect from data-rect="x y w h", the
 * indicator's containing block is its parent, and the indicator is 2px tall.
 * The ResizeObserver stub records what is being watched. */
const watched = new Set<Element>()
class StubResizeObserver {
  observe(el: Element) {
    watched.add(el)
  }
  unobserve(el: Element) {
    watched.delete(el)
  }
  disconnect() {
    watched.clear()
  }
}

/* With follow="active" the indicator measures in the next animation frame.
 * Frames are queued here and run by nextFrame(), which box() calls first, as
 * a browser runs them before it paints. */
let frames = new Map<number, FrameRequestCallback>()
let frameId = 0
const nextFrame = () =>
  act(() => {
    const due = [...frames.values()]
    frames = new Map()
    for (const callback of due) callback(performance.now())
  })

beforeEach(() => {
  watched.clear()
  frames = new Map()
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.set(++frameId, callback)
    return frameId
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => void frames.delete(id))
  globalThis.ResizeObserver = StubResizeObserver as never
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const [x = 0, y = 0, w = 0, h = 0] = (this.getAttribute('data-rect') ?? '0 0 0 0').split(' ').map(Number)
    return { left: x, top: y, width: w, height: h, right: x + w, bottom: y + h, x, y, toJSON() {} } as DOMRect
  })
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (this: HTMLElement) {
    return this.parentElement
  })
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute('data-yj-indicator') ? 2 : 0
  })
})
afterEach(() => vi.restoreAllMocks())

const indicator = () => document.querySelector<HTMLElement>('[data-yj-indicator]')!
const box = () => {
  nextFrame()
  const s = indicator().style
  const opacity = indicator().classList.contains('opacity-100') ? '1' : '0'
  return { left: s.left, top: s.top, width: s.width, height: s.height, opacity }
}

function Tabs({ initial = 'Two', ...props }: SlidingIndicatorProps & { initial?: string | null }) {
  const [active, setActive] = useState(initial)
  return (
    <div role="tablist" data-rect="100 50 400 40">
      {['One', 'Two', 'Three'].map((tab, i) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          data-rect={`${110 + i * 90} 55 80 30`}
          onClick={() => setActive(tab)}
        >
          {tab}
        </button>
      ))}
      <SlidingIndicator {...props} />
    </div>
  )
}

test('sits on the selected item, measured in its container', () => {
  renderFull(<Tabs />)
  expect(box()).toMatchObject({ left: '100px', top: '5px', width: '80px', height: '30px', opacity: '1' })
})

test('follows the selection as the item attributes change', async () => {
  renderFull(<Tabs />)
  await act(async () => fireEvent.click(screen.getByRole('tab', { name: 'Three' })))
  expect(box()).toMatchObject({ left: '190px', width: '80px' })
})

test('fades out when nothing is selected, and back in place when something is', async () => {
  renderFull(<Tabs initial={null} />)
  expect(box().opacity).toBe('0')
  await act(async () => fireEvent.click(screen.getByRole('tab', { name: 'One' })))
  expect(box()).toMatchObject({ left: '10px', opacity: '1' })
})

test('underline is a bar along the bottom edge that keeps its own thickness', () => {
  renderFull(<Tabs variant="underline" />)
  expect(box()).toMatchObject({ left: '100px', top: '33px', width: '80px', height: '' })
  expect(indicator()).toHaveAttribute('data-yj-indicator', 'underline')
})

test('a custom match can key off a class, and the observer watches it', async () => {
  function Nav() {
    const [page, setPage] = useState('a')
    return (
      <nav data-rect="0 0 300 40">
        <a href="#a" data-rect="0 0 60 40" className={page === 'a' ? 'is-current' : ''} onClick={() => setPage('a')}>
          A
        </a>
        <a href="#b" data-rect="60 0 90 40" className={page === 'b' ? 'is-current' : ''} onClick={() => setPage('b')}>
          B
        </a>
        <SlidingIndicator match=".is-current" />
      </nav>
    )
  }
  renderFull(<Nav />)
  expect(box()).toMatchObject({ left: '0px', width: '60px' })
  await act(async () => fireEvent.click(screen.getByRole('link', { name: 'B' })))
  expect(box()).toMatchObject({ left: '60px', width: '90px' })
})

test('matches a descendant of an item too (li > a[aria-current])', () => {
  renderFull(
    <ul data-rect="0 0 300 40">
      <li data-rect="0 0 100 40">
        <a href="#x" data-rect="8 4 84 32">
          X
        </a>
      </li>
      <li data-rect="100 0 100 40">
        <a href="#y" aria-current="page" data-rect="108 4 84 32">
          Y
        </a>
      </li>
      <SlidingIndicator />
    </ul>,
  )
  expect(box()).toMatchObject({ left: '108px', top: '4px', width: '84px', height: '32px' })
})

test('a selected item wins over a match inside an earlier one (an icon drawn in its active state)', () => {
  renderFull(
    <div data-rect="0 0 300 40">
      <button type="button" aria-pressed="false" data-rect="0 0 100 40">
        <svg data-state="active" data-rect="40 12 16 16" />
      </button>
      <button type="button" aria-pressed="true" data-rect="100 0 100 40">
        B
      </button>
      <SlidingIndicator />
    </div>,
  )
  expect(box()).toMatchObject({ left: '100px', width: '100px', height: '40px' })
})

function HoverNav() {
  return (
    <nav data-rect="0 0 400 40">
      <a href="#one" data-rect="0 0 100 40">
        One
      </a>
      <a href="#two" data-rect="100 0 120 40">
        Two
      </a>
      <a href="#off" aria-disabled="true" data-rect="220 0 100 40">
        Off
      </a>
      <SlidingIndicator follow="hover" />
    </nav>
  )
}

function pointer(type: string, el: Element, pointerType = 'mouse') {
  const e = new MouseEvent(type, { bubbles: type !== 'pointerleave' })
  Object.defineProperty(e, 'pointerType', { value: pointerType })
  fireEvent(el, e)
}

test('hover mode tracks the pointer, skips disabled items and touch, and fades out on leave', () => {
  renderFull(<HoverNav />)
  expect(box().opacity).toBe('0')

  pointer('pointermove', screen.getByText('Two'), 'touch')
  expect(box().opacity).toBe('0')

  act(() => pointer('pointermove', screen.getByText('Two')))
  expect(box()).toMatchObject({ left: '100px', width: '120px', opacity: '1' })

  act(() => pointer('pointermove', screen.getByText('Off')))
  expect(box()).toMatchObject({ left: '100px' })

  act(() => pointer('pointerleave', screen.getByRole('navigation')))
  expect(box().opacity).toBe('0')
})

test('hover mode follows keyboard focus', () => {
  // jsdom has no focus-visible heuristics; a keyboard focus is what the browser would report.
  const matches = Element.prototype.matches
  vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
    return selector === ':focus-visible' ? this === document.activeElement : matches.call(this, selector)
  })
  renderFull(<HoverNav />)
  act(() => screen.getByText('Two').focus())
  expect(box()).toMatchObject({ left: '100px', width: '120px', opacity: '1' })
  act(() => pointer('pointerleave', screen.getByRole('navigation')))
  expect(box()).toMatchObject({ left: '100px', opacity: '1' })
})

test('reduced motion still marks the item, just without the glide', async () => {
  renderReduced(<Tabs />)
  expect(box()).toMatchObject({ left: '100px', opacity: '1' })
  await act(async () => fireEvent.click(screen.getByRole('tab', { name: 'One' })))
  expect(box()).toMatchObject({ left: '10px' })
})

describe('keyboard moves jump, pointer moves glide', () => {
  const jumped = () => indicator().hasAttribute('data-instant')
  const press = (key: string) => fireEvent.keyDown(document.activeElement ?? document.body, { key })

  test('a move that follows a navigation key lands at once', async () => {
    const { rerender } = renderFull(<Rows highlighted="Open" />)
    box()
    press('ArrowDown')
    await act(async () => rerender(<Rows highlighted="Rename" />))
    expect(box()).toMatchObject({ top: '32px' })
    expect(jumped()).toBe(true)
  })

  test('the pointer takes the glide back', async () => {
    const { rerender } = renderFull(<Rows highlighted="Open" />)
    box()
    press('ArrowDown')
    await act(async () => rerender(<Rows highlighted="Rename" />))
    box()
    pointer('pointermove', screen.getByText('Delete'))
    await act(async () => rerender(<Rows highlighted="Delete" />))
    expect(box()).toMatchObject({ top: '69px' })
    expect(jumped()).toBe(false)
  })

  test('Enter and Space activate rather than navigate, so their selection still glides', async () => {
    renderFull(<Tabs />)
    box()
    press('Enter')
    await act(async () => fireEvent.click(screen.getByRole('tab', { name: 'Three' })))
    expect(box()).toMatchObject({ left: '190px' })
    expect(jumped()).toBe(false)
  })

  test('a key press long past does not make a later move jump', async () => {
    const now = vi.spyOn(performance, 'now')
    now.mockReturnValue(1000)
    const { rerender } = renderFull(<Rows highlighted="Open" />)
    box()
    press('ArrowDown')
    now.mockReturnValue(5000)
    await act(async () => rerender(<Rows highlighted="Rename" />))
    box()
    expect(jumped()).toBe(false)
  })

  test('the page-wide listeners go with the last indicator', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderFull(
      <>
        <Tabs />
        <Rows highlighted="Open" />
      </>,
    )
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1)
    unmount()
    expect(remove.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1)
  })
})

test('measures in the next frame, not while mounting, and places before it paints without fading in', () => {
  renderFull(<Tabs />)
  expect(Element.prototype.getBoundingClientRect).not.toHaveBeenCalled()
  expect(indicator().className).not.toContain('opacity-100')
  nextFrame()
  expect(Element.prototype.getBoundingClientRect).toHaveBeenCalled()
  expect(indicator().className).toContain('opacity-100')
  expect(indicator().className).not.toContain('transition-opacity')
})

test('groups mounting together all read in one frame before any of them writes', () => {
  renderFull(
    <>
      <Tabs />
      <Tabs />
    </>,
  )
  const [first, second] = document.querySelectorAll<HTMLElement>('[data-yj-indicator]')
  const written = vi.fn()
  const measure = vi.mocked(Element.prototype.getBoundingClientRect).getMockImplementation()!
  vi.mocked(Element.prototype.getBoundingClientRect).mockImplementation(function (this: Element) {
    if (second!.parentElement!.contains(this)) written(first!.style.width)
    return measure.call(this)
  })
  nextFrame()
  // The second group measured while the first still had no box: one layout for both, not one each.
  expect(written).toHaveBeenCalled()
  expect(written.mock.calls.every(([width]) => width === '0px')).toBe(true)
  expect(first!.style.width).toBe('80px')
  expect(second!.style.width).toBe('80px')
})

test('coalesces a burst of attribute changes into one read', async () => {
  renderFull(<Tabs />)
  nextFrame()
  const tabReads = () => vi.mocked(Element.prototype.getBoundingClientRect).mock.contexts.filter((el) => (el as Element).role === 'tab').length
  const before = tabReads()
  await act(async () => {
    fireEvent.click(screen.getByRole('tab', { name: 'Three' }))
    fireEvent.click(screen.getByRole('tab', { name: 'One' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Three' }))
  })
  expect(box()).toMatchObject({ left: '190px' })
  expect(tabReads() - before).toBe(1)
})

test('is decorative and never takes the pointer', () => {
  renderFull(<Tabs />)
  expect(indicator()).toHaveAttribute('aria-hidden', 'true')
  expect(indicator()).toHaveClass('pointer-events-none')
})

test('watches the group and every item for resizes, and lets go of everything on unmount', () => {
  const stopMutations = vi.spyOn(MutationObserver.prototype, 'disconnect')
  const { unmount } = renderFull(<Tabs />)
  expect(watched).toContain(screen.getByRole('tablist'))
  for (const tab of screen.getAllByRole('tab')) expect(watched).toContain(tab)
  unmount()
  expect(watched.size).toBe(0)
  expect(stopMutations).toHaveBeenCalled()
})

/** A menu-like group: rows, a separator and whichever row the test highlights. */
function Rows({ highlighted, ...props }: SlidingIndicatorProps & { highlighted: string | null }) {
  return (
    <div role="menu" data-rect="0 0 200 100">
      {['Open', 'Rename'].map((label, i) => (
        <div key={label} role="menuitem" data-highlighted={highlighted === label ? '' : undefined} data-rect={`4 ${4 + i * 28} 192 28`}>
          {label}
        </div>
      ))}
      <div role="separator" data-rect="0 60 200 9" />
      <div role="menuitem" data-highlighted={highlighted === 'Delete' ? '' : undefined} data-rect="4 69 192 28">
        Delete
      </div>
      <SlidingIndicator match="[data-highlighted]" {...props} />
    </div>
  )
}

describe('linger', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }))
  afterEach(() => vi.useRealTimers())

  test('without it, the highlight lets go as soon as nothing matches', async () => {
    const { rerender } = renderFull(<Rows highlighted="Rename" />)
    await act(async () => rerender(<Rows highlighted={null} />))
    expect(box().opacity).toBe('0')
  })

  test('holds the last item for the fast token when nothing matches, then fades', async () => {
    const { rerender } = renderFull(<Rows highlighted="Rename" linger />)
    expect(box()).toMatchObject({ top: '32px', opacity: '1' })
    // The pointer is on the separator: Base UI has dropped its highlight.
    await act(async () => rerender(<Rows highlighted={null} linger />))
    expect(box()).toMatchObject({ top: '32px', opacity: '1' })
    act(() => vi.advanceTimersByTime(139))
    expect(box().opacity).toBe('1')
    act(() => vi.advanceTimersByTime(1))
    expect(box()).toMatchObject({ top: '32px', opacity: '0' })
  })

  test('a new item inside the hold takes the highlight on without it ever fading', async () => {
    const { rerender } = renderFull(<Rows highlighted="Rename" linger />)
    await act(async () => rerender(<Rows highlighted={null} linger />))
    act(() => vi.advanceTimersByTime(100))
    await act(async () => rerender(<Rows highlighted="Delete" linger />))
    expect(box()).toMatchObject({ top: '69px', opacity: '1' })
    // The pending fade was called off.
    act(() => vi.advanceTimersByTime(500))
    expect(box()).toMatchObject({ top: '69px', opacity: '1' })
  })

  test('follows the Speed control', async () => {
    const at = (highlighted: string | null) => (
      <YoujProvider timeScale={2} reducedMotion="never">
        <Rows highlighted={highlighted} linger />
      </YoujProvider>
    )
    const { rerender } = render(at('Open'))
    nextFrame()
    await act(async () => rerender(at(null)))
    nextFrame()
    act(() => vi.advanceTimersByTime(279))
    expect(box().opacity).toBe('1')
    act(() => vi.advanceTimersByTime(1))
    expect(box().opacity).toBe('0')
  })

  test('reduced motion has no hold: there is no glide to carry on', async () => {
    const { rerender } = renderReduced(<Rows highlighted="Rename" linger />)
    await act(async () => rerender(<Rows highlighted={null} linger />))
    expect(box().opacity).toBe('0')
  })

  test('in hover mode, the highlight lingers after the pointer leaves', () => {
    renderFull(
      <nav data-rect="0 0 400 40">
        <a href="#one" data-rect="0 0 100 40">
          One
        </a>
        <a href="#two" data-rect="100 0 120 40">
          Two
        </a>
        <SlidingIndicator follow="hover" linger />
      </nav>,
    )
    act(() => pointer('pointermove', screen.getByText('Two')))
    act(() => pointer('pointerleave', screen.getByRole('navigation')))
    expect(box()).toMatchObject({ left: '100px', opacity: '1' })
    act(() => vi.advanceTimersByTime(140))
    expect(box().opacity).toBe('0')
  })

  test('unmounting mid-hold leaves no timer behind', async () => {
    const { rerender, unmount } = renderFull(<Rows highlighted="Rename" linger />)
    nextFrame()
    await act(async () => rerender(<Rows highlighted={null} linger />))
    nextFrame()
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
