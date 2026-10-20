import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { RadialMenu, type RadialMenuItem, type RadialMenuProps } from './radial-menu'

// jsdom has no layout: the window layer is 800 × 600, the trigger a 200px square at (300, 200).
const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect
let restore: () => void
beforeEach(() => {
  const original = HTMLElement.prototype.getBoundingClientRect
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    if (this.dataset.slot === 'radial-menu-layer') return rect(0, 0, 800, 600)
    if (this.dataset.slot === 'radial-menu-trigger') return rect(300, 200, 200, 200)
    return original.call(this)
  }
  restore = () => {
    HTMLElement.prototype.getBoundingClientRect = original
  }
})
afterEach(() => restore())

const make = (onSelect = vi.fn()): RadialMenuItem[] => [
  { id: 'copy', label: 'Copy', icon: <span />, onSelect },
  { id: 'paste', label: 'Paste', icon: <span />, onSelect },
  { id: 'share', label: 'Share', icon: <span />, disabled: true },
  { id: 'delete', label: 'Delete', icon: <span />, onSelect },
]

function Menu(props: Partial<RadialMenuProps>) {
  return (
    <RadialMenu items={make()} aria-label="Canvas" {...props}>
      canvas
    </RadialMenu>
  )
}

const trigger = () => screen.getByRole('button', { name: 'Canvas' })
const item = (name: string) => screen.getByRole('menuitem', { name })
// youj-allow: sleep — only for proving a quick tap opens nothing: there is no condition to wait for, only time to give it.
const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))

describe('RadialMenu', () => {
  test('opens from the keyboard on the first slot, goes round with the arrows and chooses with Enter', async () => {
    const user = userEvent.setup()
    const onItem = vi.fn()
    const onSelect = vi.fn()
    const onOpenChange = vi.fn()
    render(<Menu items={make(onItem)} onSelect={onSelect} onOpenChange={onOpenChange} />)
    trigger().focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menu')).toHaveAccessibleName('Actions')
    expect(screen.getByRole('menu')).toHaveAccessibleDescription(/arrow keys/)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    expect(item('Copy')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(item('Paste')).toHaveFocus()
    // Share is disabled, so the ring steps over it.
    await user.keyboard('{ArrowRight}')
    expect(item('Delete')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(item('Copy')).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(item('Delete')).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(onItem).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'delete' }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(trigger()).toHaveFocus()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Delete chosen'))
  })

  test('Escape closes and returns focus; the context menu key opens it too', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    trigger().focus()
    await user.keyboard('{Shift>}{F10}{/Shift}')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).toHaveFocus()
  })

  test('a click opens it at the pointer, the pointer’s angle highlights a slot and a click there chooses it', async () => {
    const onSelect = vi.fn()
    render(<Menu trigger="click" onSelect={onSelect} />)
    fireEvent.click(trigger(), { clientX: 400, clientY: 300, detail: 1 })
    expect(screen.getByRole('menu')).toBeInTheDocument()
    // Four slots from the top, clockwise: Paste is to the right.
    fireEvent.pointerMove(window, { clientX: 470, clientY: 310 })
    expect(item('Paste')).toHaveAttribute('data-highlighted')
    expect(item('Paste')).toHaveFocus()
    // Pointing at the disabled slot highlights nothing.
    fireEvent.pointerMove(window, { clientX: 400, clientY: 390 })
    expect(document.querySelector('[data-highlighted]')).toBeNull()
    fireEvent.pointerMove(window, { clientX: 470, clientY: 310 })
    fireEvent.pointerDown(document.querySelector('[data-slot="radial-menu-layer"]') as Element, { clientX: 470, clientY: 310 })
    fireEvent.pointerUp(window, { clientX: 470, clientY: 310 })
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'paste' }))
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  test('a click in the hub or far outside closes without choosing', () => {
    const onSelect = vi.fn()
    render(<Menu trigger="click" onSelect={onSelect} />)
    const layer = () => document.querySelector('[data-slot="radial-menu-layer"]') as Element
    fireEvent.click(trigger(), { clientX: 400, clientY: 300, detail: 1 })
    fireEvent.pointerDown(layer(), { clientX: 402, clientY: 302 })
    fireEvent.pointerUp(window, { clientX: 402, clientY: 302 })
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger(), { clientX: 400, clientY: 300, detail: 1 })
    fireEvent.pointerDown(layer(), { clientX: 700, clientY: 40 })
    fireEvent.pointerUp(window, { clientX: 700, clientY: 40 })
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(onSelect).not.toHaveBeenCalled()
  })

  test('hold: a held press opens it, and the release picks the slot it was dragged toward', async () => {
    const onSelect = vi.fn()
    render(<Menu holdDelay={5} onSelect={onSelect} />)
    // A quick tap opens nothing.
    fireEvent.pointerDown(trigger(), { clientX: 400, clientY: 300, button: 0 })
    fireEvent.pointerUp(trigger(), { clientX: 400, clientY: 300 })
    // youj-allow: sleep — a quick tap must open nothing; there is no condition to wait for.
    await wait(20)
    expect(screen.queryByRole('menu')).toBeNull()

    fireEvent.pointerDown(trigger(), { clientX: 400, clientY: 300, button: 0 })
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    fireEvent.pointerMove(window, { clientX: 400, clientY: 220 })
    expect(item('Copy')).toHaveAttribute('data-highlighted')
    fireEvent.pointerUp(window, { clientX: 400, clientY: 220 })
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'copy' }))
  })

  test('hold: releasing in the hub keeps the ring open to click', async () => {
    render(<Menu holdDelay={5} />)
    fireEvent.pointerDown(trigger(), { clientX: 400, clientY: 300, button: 0 })
    await screen.findByRole('menu')
    fireEvent.pointerUp(window, { clientX: 401, clientY: 301 })
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
  })

  test('a right-click opens it in contextmenu mode', () => {
    render(<Menu trigger="contextmenu" />)
    fireEvent.click(trigger(), { clientX: 400, clientY: 300, detail: 1 })
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.contextMenu(trigger(), { clientX: 400, clientY: 300 })
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  test('at an edge a full ring turns into a half ring facing away from it', () => {
    render(<Menu trigger="click" />)
    fireEvent.click(trigger(), { clientX: 795, clientY: 300, detail: 1 })
    const menu = screen.getByRole('menu')
    const cx = Number.parseFloat(menu.style.left) + Number.parseFloat(menu.style.width) / 2
    expect(cx).toBeLessThan(800 - 8)
    // Nothing lies to the right of the center; the slots fan out to the left.
    fireEvent.pointerMove(window, { clientX: cx + 80, clientY: 300 })
    expect(document.querySelector('[data-highlighted]')).toBeNull()
    fireEvent.pointerMove(window, { clientX: cx - 80, clientY: 340 })
    expect(document.querySelector('[data-highlighted]')).not.toBeNull()
  })

  test('mirrors in RTL: the second slot sits on the left', () => {
    render(
      <YoujProvider dir="rtl">
        <Menu trigger="click" />
      </YoujProvider>,
    )
    fireEvent.click(trigger(), { clientX: 400, clientY: 300, detail: 1 })
    fireEvent.pointerMove(window, { clientX: 320, clientY: 300 })
    expect(item('Paste')).toHaveAttribute('data-highlighted')
  })

  test('controlled: open follows the prop', () => {
    const { rerender } = render(<Menu open={false} />)
    expect(screen.queryByRole('menu')).toBeNull()
    rerender(<Menu open />)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(item('Copy')).toHaveFocus()
  })

  test('reduced motion: the ring goes at once', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <Menu />
      </YoujProvider>,
    )
    trigger().focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  test('disabled opens nothing', async () => {
    const user = userEvent.setup()
    render(<Menu disabled trigger="click" />)
    fireEvent.click(trigger(), { clientX: 400, clientY: 300, detail: 1 })
    trigger().focus()
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger()).toHaveAttribute('aria-disabled', 'true')
  })
})
