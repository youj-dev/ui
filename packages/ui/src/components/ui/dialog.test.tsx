import { useState, type ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

function RenameDialog() {
  return (
    <Dialog>
      <DialogTrigger>Rename</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          <DialogDescription>The name shows in the sidebar.</DialogDescription>
        </DialogHeader>
        <input aria-label="Name" defaultValue="Orion" />
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
          <button type="button">Save</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

describe('Dialog', () => {
  test('opens a modal dialog named by its title and described by its description, focused on the first field', async () => {
    const user = userEvent.setup()
    render(<RenameDialog />)
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    const dialog = await screen.findByRole('dialog', { name: 'Rename project' })
    expect(dialog).toHaveAccessibleDescription('The name shows in the sidebar.')
    expect(dialog).toHaveClass('yj-dialog')
    expect(document.querySelector('[data-slot=dialog-overlay]')).toHaveClass('yj-backdrop')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus())
  })

  test('is the one dialog on the page: the viewport and the backdrop around it are presentation', async () => {
    const user = userEvent.setup()
    render(<RenameDialog />)
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    await screen.findByRole('dialog', { name: 'Rename project' })
    expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(1)
    expect(document.querySelectorAll('[role=dialog], [role=alertdialog], dialog')).toHaveLength(1)
    for (const slot of ['dialog-viewport', 'dialog-overlay']) expect(document.querySelector(`[data-slot=${slot}]`)).toHaveAttribute('role', 'presentation')
  })

  test('traps focus: Tab from the last control wraps to the first', async () => {
    const user = userEvent.setup()
    render(<RenameDialog />)
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    const name = await screen.findByRole('textbox', { name: 'Name' })
    await waitFor(() => expect(name).toHaveFocus())
    await user.tab() // Cancel
    await user.tab() // Save
    await user.tab() // the × button
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    // Tab lands on Base UI's focus-trap sentinel, which sends focus back to the start.
    await user.tab()
    await waitFor(() => expect(name).toHaveFocus())
  })

  test('Escape, Cancel and × all close it and return focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<RenameDialog />)
    const trigger = screen.getByRole('button', { name: 'Rename' })
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

  test('a nested dialog makes its parent recede, and closing it hands focus back to its own trigger', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Settings</DialogTrigger>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
          <Dialog>
            <DialogTrigger>Transfer</DialogTrigger>
            <DialogContent>
              <DialogTitle>Transfer project</DialogTitle>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>,
    )
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const parent = await screen.findByRole('dialog', { name: 'Settings' })
    await user.click(screen.getByRole('button', { name: 'Transfer' }))
    await screen.findByRole('dialog', { name: 'Transfer project' })
    expect(parent).toHaveAttribute('data-nested-dialog-open')
    expect(parent.style.getPropertyValue('--nested-dialogs')).toBe('1')
    // Base UI renders one scrim for the stack.
    expect(document.querySelectorAll('[data-slot=dialog-overlay]')).toHaveLength(1)

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Transfer project' })).not.toBeInTheDocument())
    expect(parent).not.toHaveAttribute('data-nested-dialog-open')
    expect(screen.getByRole('button', { name: 'Transfer' })).toHaveFocus()
  })

  test('when the first control is below the fold, focus starts on the dialog so its start stays in view', async () => {
    const user = userEvent.setup()
    // jsdom has no layout: the viewport is 700px tall and "Done" sits 1900px down the popup.
    const slot = (el: Element) => el.getAttribute('data-slot')
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (this: HTMLElement) {
      if (this.textContent === 'Done') return this.closest('[data-slot=dialog-content]')
      if (slot(this) === 'dialog-content') return this.parentElement
      return null
    })
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
      return this.textContent === 'Done' ? 1900 : 0
    })
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => 32)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return slot(this) === 'dialog-viewport' ? 700 : 0
    })
    render(
      <Dialog>
        <DialogTrigger>Changelog</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Changelog</DialogTitle>
          <p>A long list of releases…</p>
          <DialogClose>Done</DialogClose>
        </DialogContent>
      </Dialog>,
    )
    await user.click(screen.getByRole('button', { name: 'Changelog' }))
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toHaveFocus())
    vi.restoreAllMocks()
  })

  test('its portal carries the youj scope', async () => {
    const user = userEvent.setup()
    function Scoped() {
      const [open, setOpen] = useState(false)
      return (
        <YoujProvider reducedMotion="always" timeScale={2}>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Scoped</DialogTitle>
            </DialogContent>
          </Dialog>
        </YoujProvider>
      )
    }
    render(<Scoped />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const portal = (await screen.findByRole('dialog')).closest('[data-yj-reduced]') as HTMLElement
    expect(portal.style.getPropertyValue('--yj-motion')).toBe('0')
    expect(portal.style.getPropertyValue('--yj-time-scale')).toBe('2')
  })
})

describe('Dialog on touch', () => {
  const touch = (ui: ReactNode) => render(<YoujProvider device="touch">{ui}</YoujProvider>)
  const sheet = () => document.querySelector<HTMLElement>('[data-slot=dialog-content]')

  /** A pull on the sheet with a mouse-like pointer (SheetLayer's preview path; jsdom has no touch layout). */
  function pull(el: HTMLElement, distance: number) {
    fireEvent.pointerDown(el, { pointerType: 'mouse', button: 0, clientY: 100 })
    for (let i = 1; i <= 4; i++) fireEvent.pointerMove(el, { pointerType: 'mouse', clientY: 100 + (distance * i) / 4 })
    fireEvent.pointerUp(el, { pointerType: 'mouse', clientY: 100 + distance })
  }

  test('is a bottom sheet with a grab handle over the shared scrim, still a named modal dialog', async () => {
    const user = userEvent.setup()
    touch(<RenameDialog />)
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    const dialog = await screen.findByRole('dialog', { name: 'Rename project' })
    expect(dialog).toHaveAttribute('data-sheet-popup')
    expect(dialog).toHaveClass('yj-sheet-bottom')
    expect(dialog).not.toHaveClass('yj-dialog')
    expect(dialog.querySelector('[data-slot=sheet-handle]')).toHaveAttribute('aria-hidden')
    expect(document.querySelector('[data-slot=dialog-overlay]')).toHaveAttribute('data-sheet-scrim')
    expect(dialog).toHaveAccessibleDescription('The name shows in the sidebar.')
    // The actions stack full width in a sheet, whatever the screen's width.
    expect(dialog.querySelector('[data-slot=dialog-footer]')?.className).toContain('group-data-sheet-popup/sheet:flex-col-reverse!')
  })

  test('opened by a touch, focus goes to the sheet, not its field, so the keyboard waits for a tap', async () => {
    const user = userEvent.setup()
    touch(<RenameDialog />)
    await user.pointer({ keys: '[TouchA]', target: screen.getByRole('button', { name: 'Rename' }) })
    const dialog = await screen.findByRole('dialog')
    await waitFor(() => expect(dialog).toHaveFocus())
    expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveFocus()
  })

  test('presentation="dialog" keeps it centered on touch; "sheet" forces the sheet under a pointer', async () => {
    const user = userEvent.setup()
    const { unmount } = touch(
      <Dialog defaultOpen>
        <DialogContent presentation="dialog">
          <DialogTitle>Centered</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    expect(await screen.findByRole('dialog')).toHaveClass('yj-dialog')
    expect(sheet()).not.toHaveAttribute('data-sheet-popup')
    unmount()
    render(
      <YoujProvider device="pointer">
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent presentation="sheet">
            <DialogTitle>Forced</DialogTitle>
          </DialogContent>
        </Dialog>
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByRole('dialog')).toHaveAttribute('data-sheet-popup')
  })

  test('under a pointer it is the centered dialog, unchanged', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="pointer">
        <RenameDialog />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveClass('yj-dialog')
    expect(dialog).not.toHaveAttribute('data-sheet-popup')
    expect(dialog.querySelector('[data-slot=sheet-handle]')).toBeNull()
  })

  test('pulled down far enough it closes and focus returns to the trigger; Escape and Cancel still close it', async () => {
    const user = userEvent.setup()
    touch(<RenameDialog />)
    const trigger = screen.getByRole('button', { name: 'Rename' })
    await user.click(trigger)
    await screen.findByRole('dialog')
    pull(sheet()!.querySelector<HTMLElement>('[data-slot=sheet-handle]')!, 300)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()

    for (const close of [() => user.keyboard('{Escape}'), () => user.click(screen.getByRole('button', { name: 'Cancel' }))]) {
      await user.click(trigger)
      await screen.findByRole('dialog')
      await close()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(trigger).toHaveFocus()
    }
  })

  test('a dialog that refuses to close (busy) springs back instead of staying pulled down', async () => {
    const user = userEvent.setup()
    touch(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Saving</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    const dialog = await screen.findByRole('dialog')
    const layer = dialog.closest<HTMLElement>('[data-slot=sheet-layer]')!
    pull(dialog, 300)
    expect(layer.style.getPropertyValue('--drawer-swipe-movement-y')).not.toBe('0px')
    await waitFor(() => expect(layer.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('0px'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
  })

  test('a sheet opened from a sheet makes the one below recede, and Escape closes only the top one', async () => {
    const user = userEvent.setup()
    touch(
      <Dialog>
        <DialogTrigger>Settings</DialogTrigger>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
          <Dialog>
            <DialogTrigger>Transfer</DialogTrigger>
            <DialogContent>
              <DialogTitle>Transfer project</DialogTitle>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>,
    )
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const parent = await screen.findByRole('dialog', { name: 'Settings' })
    await user.click(screen.getByRole('button', { name: 'Transfer' }))
    expect(await screen.findByRole('dialog', { name: 'Transfer project' })).toHaveAttribute('data-sheet-popup')
    expect(parent).toHaveAttribute('data-nested-dialog-open')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Transfer project' })).not.toBeInTheDocument())
    expect(parent).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Transfer' })).toHaveFocus()
  })

  test("it renders in the provider's portal container", async () => {
    const frame = document.createElement('div')
    document.body.append(frame)
    render(
      <YoujProvider device="touch" portalContainer={frame}>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Framed</DialogTitle>
          </DialogContent>
        </Dialog>
      </YoujProvider>,
    )
    expect(frame).toContainElement(await screen.findByRole('dialog'))
    frame.remove()
  })
})

describe('Dialog on touch, controls with their own drag', () => {
  test('a drag that starts in an element with touch-action: none (a crop area) never moves the sheet', async () => {
    render(
      <YoujProvider device="touch">
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Crop</DialogTitle>
            <div data-testid="crop" style={{ touchAction: 'none' }}>
              <span data-testid="photo">photo</span>
            </div>
          </DialogContent>
        </Dialog>
      </YoujProvider>,
    )
    const dialog = await screen.findByRole('dialog')
    const layer = dialog.closest<HTMLElement>('[data-slot=sheet-layer]')!
    const photo = screen.getByTestId('photo')
    fireEvent.pointerDown(photo, { pointerType: 'mouse', button: 0, clientY: 100 })
    fireEvent.pointerMove(photo, { pointerType: 'mouse', clientY: 300 })
    expect(layer.style.getPropertyValue('--drawer-swipe-movement-y')).toBe('')
    expect(dialog).not.toHaveAttribute('data-swiping')
    fireEvent.pointerUp(photo, { pointerType: 'mouse', clientY: 300 })
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
