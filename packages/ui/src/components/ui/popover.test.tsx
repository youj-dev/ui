import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from './popover'

function SharePopover() {
  return (
    <Popover>
      <PopoverTrigger>Share</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Share project</PopoverTitle>
        <PopoverDescription>Invite people by email.</PopoverDescription>
        <input aria-label="Email" />
        <PopoverClose>Done</PopoverClose>
      </PopoverContent>
    </Popover>
  )
}

describe('Popover', () => {
  test('opens a dialog named by its title, moves focus inside, and Escape returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<SharePopover />)
    const trigger = screen.getByRole('button', { name: 'Share' })
    await user.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'Share project' })
    expect(dialog).toHaveAccessibleDescription('Invite people by email.')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Email' })).toHaveFocus())

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('PopoverClose closes it', async () => {
    const user = userEvent.setup()
    render(<SharePopover />)
    await user.click(screen.getByRole('button', { name: 'Share' }))
    await user.click(await screen.findByRole('button', { name: 'Done' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('the popup animates with the yj-pop preset and its portal carries the youj scope', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always" timeScale={2}>
        <SharePopover />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Share' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveClass('yj-pop')
    // Portaled outside the provider's wrapper, so the scope must be re-applied on the portal.
    const portal = dialog.closest('[data-yj-reduced]') as HTMLElement
    expect(portal).not.toBeNull()
    expect(portal.style.getPropertyValue('--yj-motion')).toBe('0')
    expect(portal.style.getPropertyValue('--yj-time-scale')).toBe('2')
  })

  test('unmounting while open leaves nothing behind', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<SharePopover />)
    await user.click(screen.getByRole('button', { name: 'Share' }))
    await screen.findByRole('dialog')
    unmount()
    expect(document.querySelector('[data-slot=popover-content]')).toBeNull()
  })
})

describe('Popover on touch', () => {
  function Share({ presentation }: { presentation?: 'auto' | 'sheet' | 'popover' }) {
    return (
      <Popover>
        <PopoverTrigger>Share</PopoverTrigger>
        <PopoverContent presentation={presentation} className="w-80 p-3">
          <PopoverTitle>Share project</PopoverTitle>
          <div data-sheet-no-drag="" data-testid="own-drag">
            A control with its own drag
          </div>
          <PopoverClose>Done</PopoverClose>
        </PopoverContent>
      </Popover>
    )
  }

  test('is a bottom sheet with a handle and a scrim, still a dialog named by its title', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Share />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Share' }))
    const dialog = await screen.findByRole('dialog', { name: 'Share project' })
    expect(dialog).toHaveAttribute('data-sheet-popup')
    expect(dialog).toHaveClass('yj-sheet-bottom')
    expect(dialog).not.toHaveClass('yj-pop')
    // A popover's width does not narrow the sheet; its edges belong to the sheet.
    expect(dialog).toHaveClass('w-full!', 'own:pt-1', 'own:rounded-b-none')
    expect(dialog.querySelector('[data-slot=sheet-handle]')).toHaveAttribute('aria-hidden')
    expect(document.querySelector('[data-sheet-scrim]')).not.toBeNull()
  })

  test('Escape closes the sheet and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Share />
      </YoujProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Share' })
    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test('pulling the sheet down dismisses it; a drag that starts on data-sheet-no-drag does not', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Share />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Share' }))
    const dialog = await screen.findByRole('dialog')

    const own = screen.getByTestId('own-drag')
    fireEvent.pointerDown(own, { clientY: 10, button: 0 })
    fireEvent.pointerMove(own, { clientY: 300 })
    fireEvent.pointerUp(own, { clientY: 300 })
    expect(dialog).not.toHaveAttribute('data-swiping')
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const handle = dialog.querySelector('[data-slot=sheet-handle]')!
    fireEvent.pointerDown(handle, { clientY: 10, button: 0 })
    fireEvent.pointerMove(handle, { clientY: 300 })
    fireEvent.pointerUp(handle, { clientY: 300 })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('presentation="popover" keeps the anchored popover on touch', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Share presentation="popover" />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Share' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveClass('yj-pop', 'w-80')
    expect(dialog).not.toHaveAttribute('data-sheet-popup')
    expect(document.querySelector('[data-slot=sheet-handle]')).toBeNull()
  })

  test('under a pointer it stays a popover, and presentation="sheet" forces the sheet', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <YoujProvider device="pointer">
        <Share />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(await screen.findByRole('dialog')).toHaveClass('yj-pop')
    expect(document.querySelector('[data-sheet-scrim]')).toBeNull()
    unmount()

    render(
      <YoujProvider device="pointer">
        <Share presentation="sheet" />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(await screen.findByRole('dialog')).toHaveAttribute('data-sheet-popup')
  })
})

