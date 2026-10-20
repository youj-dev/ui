import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Dock, type DockItem } from './dock'

const ITEMS: DockItem[] = ['Files', 'Mail', 'Calendar', 'Music'].map((label) => ({ id: label.toLowerCase(), label, icon: <svg /> }))

function Harness() {
  const [value, setValue] = useState('mail')
  return (
    <>
      <button type="button">before</button>
      <Dock items={ITEMS} value={value} onValueChange={setValue} />
    </>
  )
}

const focused = () => document.activeElement?.getAttribute('aria-label')

test('is a toolbar with a single roving tab stop on the active item', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  const toolbar = screen.getByRole('toolbar', { name: 'Dock' })
  const stops = within(toolbar).getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0')
  expect(stops.map((b) => b.getAttribute('aria-label'))).toEqual(['Mail'])

  await user.tab()
  await user.tab()
  expect(focused()).toBe('Mail')
})

test('arrow keys, Home and End move focus and wrap around', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.tab()
  await user.tab()

  await user.keyboard('{ArrowRight}')
  expect(focused()).toBe('Calendar')
  await user.keyboard('{End}')
  expect(focused()).toBe('Music')
  await user.keyboard('{ArrowRight}')
  expect(focused()).toBe('Files')
  await user.keyboard('{ArrowLeft}')
  expect(focused()).toBe('Music')
  await user.keyboard('{Home}')
  expect(focused()).toBe('Files')

  // The tab stop follows focus, so leaving and returning lands on the last focused item.
  expect(screen.getByRole('button', { name: 'Files' })).toHaveAttribute('tabindex', '0')
  expect(screen.getByRole('button', { name: 'Mail' })).toHaveAttribute('tabindex', '-1')
})

test('Enter activates the focused item and moves the active indicator', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.tab()
  await user.tab()
  await user.keyboard('{ArrowRight}{Enter}')
  expect(screen.getByRole('button', { name: 'Calendar' })).toHaveAttribute('aria-current', 'true')
  expect(screen.getByRole('button', { name: 'Mail' })).not.toHaveAttribute('aria-current')
})

test('shrinks its icons to fit a narrow container, never below 28px', () => {
  let report: ResizeObserverCallback = () => {}
  const Observer = globalThis.ResizeObserver
  globalThis.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      report = callback
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  try {
    render(<Harness />)
    const mail = () => screen.getByRole('button', { name: 'Mail' })
    expect(mail()).toHaveStyle({ width: '48px' })
    // Four icons in 200px: (200 - 2×8 padding - 3×8 gaps) / 4 = 40.
    act(() => report([{ contentRect: { width: 200 } } as ResizeObserverEntry], {} as ResizeObserver))
    expect(mail()).toHaveStyle({ width: '40px' })
    act(() => report([{ contentRect: { width: 60 } } as ResizeObserverEntry], {} as ResizeObserver))
    expect(mail()).toHaveStyle({ width: '28px' })
  } finally {
    globalThis.ResizeObserver = Observer
  }
})
