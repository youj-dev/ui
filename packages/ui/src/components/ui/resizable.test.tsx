import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable'

/* jsdom has no layout: give every group a 1000 × 500 box so the library can
 * turn sizes into pixels. */
const rect = { x: 0, y: 0, top: 0, left: 0, right: 1000, bottom: 500, width: 1000, height: 500, toJSON: () => ({}) }
const original = HTMLElement.prototype.getBoundingClientRect
beforeAll(() => {
  HTMLElement.prototype.getBoundingClientRect = () => rect as DOMRect
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 1000 })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 500 })
})
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = original
  globalThis.ResizeObserver = OriginalObserver
})

/* Panels report their size from a ResizeObserver, which jsdom never fires.
 * This one records what it watches; flushResizes() reports every box. */
const OriginalObserver = globalThis.ResizeObserver
const observers = new Set<{ cb: ResizeObserverCallback; els: Set<Element> }>()
globalThis.ResizeObserver = class {
  entry: { cb: ResizeObserverCallback; els: Set<Element> }
  constructor(cb: ResizeObserverCallback) {
    this.entry = { cb, els: new Set() }
    observers.add(this.entry)
  }
  observe(el: Element) {
    this.entry.els.add(el)
  }
  unobserve(el: Element) {
    this.entry.els.delete(el)
  }
  disconnect() {
    observers.delete(this.entry)
  }
} as unknown as typeof ResizeObserver
function flushResizes() {
  for (const { cb, els } of observers) {
    const entries = [...els].map((target) => ({ target, contentRect: rect, borderBoxSize: [{ inlineSize: 1000, blockSize: 500 }] }) as unknown as ResizeObserverEntry)
    if (entries.length) cb(entries, {} as ResizeObserver)
  }
}

function Split(props: { onCollapsedChange?: (c: boolean) => void; onLayoutChanged?: (l: Record<string, number>) => void; reduced?: boolean }) {
  return (
    <YoujProvider reducedMotion={props.reduced ? 'always' : 'never'}>
      <ResizablePanelGroup orientation="horizontal" onLayoutChanged={props.onLayoutChanged}>
        <ResizablePanel id="side" defaultSize="30%" minSize="20%" collapsible onCollapsedChange={props.onCollapsedChange}>
          Sidebar
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize sidebar" />
        <ResizablePanel id="main">Main</ResizablePanel>
      </ResizablePanelGroup>
    </YoujProvider>
  )
}

describe('Resizable', () => {
  test('the handle is a named, focusable separator with its value', async () => {
    render(<Split />)
    const handle = screen.getByRole('separator', { name: 'Resize sidebar' })
    expect(handle).toHaveAttribute('tabindex', '0')
    expect(handle).toHaveAttribute('aria-orientation', 'vertical')
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '30'))
    expect(handle.querySelector('[data-slot=resizable-grip]')).toHaveAttribute('aria-hidden')
  })

  test('arrow keys resize and report the settled layout', async () => {
    const user = userEvent.setup()
    const onLayoutChanged = vi.fn()
    render(<Split onLayoutChanged={onLayoutChanged} />)
    const handle = screen.getByRole('separator')
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '30'))
    handle.focus()
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '35'))
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '25'))
    expect(onLayoutChanged).toHaveBeenLastCalledWith({ side: 25, main: 75 }, { isUserInteraction: true })
  })

  test('Enter collapses a collapsible panel and restores it', async () => {
    const user = userEvent.setup()
    const onCollapsedChange = vi.fn()
    render(<Split onCollapsedChange={onCollapsedChange} />)
    const handle = screen.getByRole('separator')
    await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '30'))
    const panel = screen.getByText('Sidebar').closest('[data-panel]')!
    handle.focus()

    await user.keyboard('{Enter}')
    act(flushResizes)
    await waitFor(() => expect(onCollapsedChange).toHaveBeenLastCalledWith(true))
    expect(panel).toHaveAttribute('data-collapsed')
    expect(handle).toHaveAttribute('aria-valuenow', '0')

    await user.keyboard('{Enter}')
    act(flushResizes)
    await waitFor(() => expect(onCollapsedChange).toHaveBeenLastCalledWith(false))
    expect(panel).not.toHaveAttribute('data-collapsed')
    expect(handle).toHaveAttribute('aria-valuenow', '30')
  })

  test('panels glide on keyboard resizes, except while a separator is dragged or motion is reduced', () => {
    const { container, rerender } = render(<Split />)
    const group = container.querySelector('[data-slot=resizable-panel-group]')!
    expect(group.className).toContain('*:data-panel:transition-[flex-grow]')
    expect(group.className).toContain('has-[>[data-separator=active]]:*:data-panel:transition-none')
    // yj-duration-* utilities multiply by --yj-motion, which the provider zeroes when reduced.
    expect(group.className).toContain('*:data-panel:yj-duration-base')
    expect(group).not.toHaveAttribute('data-reduced-motion')
    rerender(<Split reduced />)
    expect(container.querySelector('[data-slot=resizable-panel-group]')).toHaveAttribute('data-reduced-motion')
  })
})
