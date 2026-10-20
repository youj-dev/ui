import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetSide,
} from './sheet'

function Settings({ side, body, variant, backdrop }: { side?: SheetSide; body?: React.ReactNode; variant?: 'docked' | 'floating'; backdrop?: 'dim' | 'blur' }) {
  return (
    <Sheet>
      <SheetTrigger>Settings</SheetTrigger>
      <SheetContent side={side} variant={variant} backdrop={backdrop}>
        <SheetHeader>
          <SheetTitle>Project settings</SheetTitle>
          <SheetDescription>Changes apply to the next deployment.</SheetDescription>
        </SheetHeader>
        <SheetBody>{body ?? <input aria-label="Project name" defaultValue="orion" />}</SheetBody>
        <SheetFooter>
          <SheetClose>Cancel</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

describe('Sheet', () => {
  test('is a modal dialog named by its header that slides from the end edge by default', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const sheet = await screen.findByRole('dialog', { name: 'Project settings' })
    expect(sheet).toHaveAccessibleDescription('Changes apply to the next deployment.')
    expect(sheet).toHaveAttribute('data-side', 'end')
    expect(sheet).toHaveClass('yj-sheet-end')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Project name' })).toHaveFocus())
  })

  test.each<[SheetSide, string]>([
    ['top', 'yj-sheet-top'],
    ['right', 'yj-sheet-right'],
    ['bottom', 'yj-sheet-bottom'],
    ['left', 'yj-sheet-left'],
    ['start', 'yj-sheet-start'],
  ])('side="%s" slides with %s', async (side, preset) => {
    const user = userEvent.setup()
    render(<Settings side={side} />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(await screen.findByRole('dialog')).toHaveClass(preset)
  })

  test('Escape, Cancel and × close it and return focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const trigger = screen.getByRole('button', { name: 'Settings' })
    for (const close of [
      () => user.keyboard('{Escape}'),
      () => user.click(screen.getByRole('button', { name: 'Cancel' })),
      () => user.click(screen.getByRole('button', { name: 'Close' })),
    ]) {
      await user.click(trigger)
      await screen.findByRole('dialog')
      await close()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(trigger).toHaveFocus()
    }
  })

  test('a body that overflows with nothing focusable inside becomes a tab stop, so the keyboard can scroll it', async () => {
    const user = userEvent.setup()
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.slot === 'sheet-body' ? 2000 : 0
    })
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.dataset.slot === 'sheet-body' ? 500 : 0
    })
    render(<Settings body={<p>A very long changelog…</p>} />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await screen.findByRole('dialog')
    await waitFor(() => expect(document.querySelector('[data-slot=sheet-body]')).toHaveAttribute('tabindex', '0'))
    vi.restoreAllMocks()
  })

  test('a body with controls stays out of the tab order', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await screen.findByRole('dialog')
    expect(document.querySelector('[data-slot=sheet-body]')).not.toHaveAttribute('tabindex')
  })

  test('its portal carries the youj scope', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <Settings />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const portal = (await screen.findByRole('dialog')).closest('[data-yj-reduced]') as HTMLElement
    expect(portal.style.getPropertyValue('--yj-motion')).toBe('0')
  })
})

describe('Sheet on touch', () => {
  test('a side sheet takes the full width of a phone, its × is a 44px target, and it still closes the same ways', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Settings />
      </YoujProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Settings' })
    await user.click(trigger)
    const sheet = await screen.findByRole('dialog', { name: 'Project settings' })
    expect(sheet).toHaveClass('touch:w-[min(calc(var(--spacing)*112),100vw)]')
    // Not a drag-to-dismiss sheet: that is Drawer.
    expect(document.querySelector('[data-slot=sheet-layer], [data-slot=sheet-handle]')).toBeNull()
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close).toHaveClass('touch:after:-inset-1')
    expect(close).toHaveClass('touch:top-[calc(var(--spacing)*3+env(safe-area-inset-top))]')
    expect(sheet.querySelector('[data-slot=sheet-footer]')).toHaveClass('touch:[&>:is(button,a)]:min-h-11')
    await user.click(close)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test('a bottom sheet keeps its × at the top edge, with no notch above it', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Settings side="bottom" />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await screen.findByRole('dialog')
    expect(screen.getByRole('button', { name: 'Close' })).not.toHaveClass('touch:top-[calc(var(--spacing)*3+env(safe-area-inset-top))]')
  })
})

describe('Floating sheet', () => {
  test('is inset from every edge, rounded and raised, and travels past its gap', async () => {
    const user = userEvent.setup()
    render(<Settings variant="floating" />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const sheet = await screen.findByRole('dialog', { name: 'Project settings' })
    expect(sheet).toHaveAttribute('data-variant', 'floating')
    expect(sheet).toHaveClass('yj-sheet-end', '[--yj-sheet-gap:calc(var(--spacing)*3)]', 'own:end-(--yj-sheet-gap)', 'own:inset-y-(--yj-sheet-gap)', 'own:shadow-lg')
    expect(sheet.className).toMatch(/own:rounded-\[min\(var\(--radius-overlay-lg\)/)
    // A docked sheet's edge-to-edge placement is not applied.
    expect(sheet).not.toHaveClass('own:inset-y-0')
  })

  test('the default sheet stays docked, with a plain scrim', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const sheet = await screen.findByRole('dialog')
    expect(sheet).toHaveAttribute('data-variant', 'docked')
    expect(sheet).toHaveClass('own:inset-y-0')
    expect(document.querySelector('[data-slot=dialog-overlay]')).not.toHaveClass('backdrop-blur-sm')
  })

  test('backdrop="blur" blurs the page behind the scrim', async () => {
    const user = userEvent.setup()
    render(<Settings variant="floating" backdrop="blur" />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await screen.findByRole('dialog')
    expect(document.querySelector('[data-slot=dialog-overlay]')).toHaveClass('yj-backdrop', 'backdrop-blur-sm')
  })

  test.each<[SheetSide, string]>([
    ['top', 'own:top-(--yj-sheet-gap)'],
    ['bottom', 'own:bottom-(--yj-sheet-gap)'],
    ['start', 'own:start-(--yj-sheet-gap)'],
  ])('side="%s" floats off that edge', async (side, edge) => {
    const user = userEvent.setup()
    render(<Settings side={side} variant="floating" />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(await screen.findByRole('dialog')).toHaveClass(edge)
  })

  test('on touch it is the pull-to-dismiss bottom sheet, and closes the same ways', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Settings variant="floating" backdrop="blur" />
      </YoujProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Settings' })
    await user.click(trigger)
    const sheet = await screen.findByRole('dialog', { name: 'Project settings' })
    expect(sheet).toHaveAttribute('data-side', 'bottom')
    expect(sheet).toHaveAttribute('data-sheet-popup')
    expect(sheet).toHaveClass('yj-sheet-bottom')
    expect(document.querySelector('[data-slot=sheet-layer]')).toBeInTheDocument()
    expect(sheet.querySelector('[data-slot=sheet-handle]')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })
})
