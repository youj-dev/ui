import { useRef, useState } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  ConfirmDialog,
  type ConfirmDialogProps,
} from './alert-dialog'

function Discard() {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Close editor</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>Your edits haven’t been saved.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="danger">Discard</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function Confirm(props: Partial<ConfirmDialogProps>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Delete projects
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        title="Delete 3 projects?"
        description="This can’t be undone."
        confirmLabel="Delete 3 projects"
        onConfirm={() => {}}
        {...props}
      />
    </>
  )
}

describe('AlertDialog', () => {
  test('is an alertdialog named and described by its header, with focus on the least destructive action', async () => {
    const user = userEvent.setup()
    render(<Discard />)
    await user.click(screen.getByRole('button', { name: 'Close editor' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Discard changes?' })
    expect(dialog).toHaveAccessibleDescription('Your edits haven’t been saved.')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus())
  })

  test('is the one dialog on the page, and not also a plain dialog', async () => {
    const user = userEvent.setup()
    render(<Discard />)
    await user.click(screen.getByRole('button', { name: 'Close editor' }))
    await screen.findByRole('alertdialog', { name: 'Discard changes?' })
    expect(screen.queryAllByRole('dialog', { hidden: true })).toHaveLength(0)
    expect(document.querySelectorAll('[role=dialog], [role=alertdialog], dialog')).toHaveLength(1)
  })

  test('a press outside neither closes it nor takes focus away; Escape cancels back to the trigger', async () => {
    const user = userEvent.setup()
    render(<Discard />)
    const trigger = screen.getByRole('button', { name: 'Close editor' })
    await user.click(trigger)
    await screen.findByRole('alertdialog')
    const cancel = screen.getByRole('button', { name: 'Keep editing' })
    await waitFor(() => expect(cancel).toHaveFocus())
    await user.click(document.querySelector('[data-slot=alert-dialog-viewport]')!)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(cancel).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })
})

describe('ConfirmDialog', () => {
  test('the confirm button names its action; a synchronous confirm runs and closes', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Confirm onConfirm={onConfirm} />)
    await user.click(screen.getByRole('button', { name: 'Delete projects' }))
    await user.click(await screen.findByRole('button', { name: 'Delete 3 projects' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  test('consequences list what will be lost, and the phrase sits in a chip with a copy button', async () => {
    const user = userEvent.setup()
    render(<Confirm challenge="acme/orion" consequences={['12 deployments', '3 domains']} />)
    await user.click(screen.getByRole('button', { name: 'Delete projects' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['12 deployments', '3 domains'])
    expect(dialog.querySelector('[data-slot="confirm-dialog-phrase"] code')).toHaveTextContent('acme/orion')
    expect(within(dialog).getByRole('button', { name: 'Copy phrase' })).toBeInTheDocument()
  })

  test('the phrase is case-sensitive and trimmed, and a paste counts', async () => {
    const user = userEvent.setup()
    render(<Confirm challenge="Orion" />)
    await user.click(screen.getByRole('button', { name: 'Delete projects' }))
    const field = await screen.findByRole('textbox')
    const confirm = screen.getByRole('button', { name: 'Delete 3 projects' })
    await user.type(field, 'orion')
    expect(confirm).toBeDisabled()
    await user.clear(field)
    await user.click(field)
    await user.paste('  Orion ')
    expect(confirm).toBeEnabled()
  })

  test('a challenge arms the confirm only once the exact phrase is typed, then Enter confirms', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Confirm onConfirm={onConfirm} challenge="delete 3 projects" />)
    await user.click(screen.getByRole('button', { name: 'Delete projects' }))
    const field = await screen.findByRole('textbox', { name: 'Type this phrase to confirm: delete 3 projects' })
    await waitFor(() => expect(field).toHaveFocus())
    const confirm = screen.getByRole('button', { name: 'Delete 3 projects' })
    expect(confirm).toBeDisabled()

    await user.type(field, 'delete 3 project')
    expect(confirm).toBeDisabled()
    await user.keyboard('{Enter}')
    expect(onConfirm).not.toHaveBeenCalled()

    await user.type(field, 's')
    expect(confirm).toBeEnabled()
    expect(screen.getByText('Phrase matches')).toHaveAttribute('role', 'status')
    await user.keyboard('{Enter}')
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  test('an async confirm holds the dialog open and busy until it resolves, then returns focus', async () => {
    const user = userEvent.setup()
    let resolve!: () => void
    const onConfirm = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    render(<Confirm onConfirm={onConfirm} pendingLabel="Deleting 3 projects" />)
    const trigger = screen.getByRole('button', { name: 'Delete projects' })
    await user.click(trigger)
    const confirm = await screen.findByRole('button', { name: 'Delete 3 projects' })
    await user.click(confirm)
    expect(confirm).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Deleting 3 projects')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()

    await user.keyboard('{Escape}')
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    resolve()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test('an async failure keeps the dialog open, shows why as an alert, and keeps focus in the field', async () => {
    const user = userEvent.setup()
    const onConfirm = () => Promise.reject(new Error('acme/orion is still deploying.'))
    render(<Confirm onConfirm={onConfirm} challenge="delete" />)
    await user.click(screen.getByRole('button', { name: 'Delete projects' }))
    const field = await screen.findByRole('textbox')
    await user.type(field, 'delete{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('acme/orion is still deploying.')
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(field).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Delete 3 projects' })).not.toHaveAttribute('aria-busy')
  })

  test('finalFocus decides where focus lands after it closes', async () => {
    const user = userEvent.setup()
    function Elsewhere() {
      const next = useRef<HTMLButtonElement>(null)
      return (
        <>
          <Confirm finalFocus={next} />
          <button ref={next} type="button">
            Next project
          </button>
        </>
      )
    }
    render(<Elsewhere />)
    await user.click(screen.getByRole('button', { name: 'Delete projects' }))
    await user.click(await screen.findByRole('button', { name: 'Delete 3 projects' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next project' })).toHaveFocus())
  })

  test('a finalFocus function that returns false leaves focus where it put it', async () => {
    const user = userEvent.setup()
    function Handover() {
      const next = useRef<HTMLButtonElement>(null)
      return (
        <>
          <Confirm
            finalFocus={() => {
              next.current?.focus()
              return false
            }}
          />
          <button ref={next} type="button">
            Next project
          </button>
        </>
      )
    }
    render(<Handover />)
    await user.click(screen.getByRole('button', { name: 'Delete projects' }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    // Base UI's own return to the trigger would land a microtask later: it must not.
    await new Promise((resolve) => setTimeout(resolve))
    expect(screen.getByRole('button', { name: 'Next project' })).toHaveFocus()
  })

  test('onOpenChangeComplete reports the open and the close, after its own reset', async () => {
    const user = userEvent.setup()
    const onOpenChangeComplete = vi.fn()
    render(<Confirm challenge="delete" onOpenChangeComplete={onOpenChangeComplete} />)
    const trigger = screen.getByRole('button', { name: 'Delete projects' })
    await user.click(trigger)
    await user.type(await screen.findByRole('textbox'), 'del')
    await waitFor(() => expect(onOpenChangeComplete).toHaveBeenLastCalledWith(true))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(onOpenChangeComplete).toHaveBeenLastCalledWith(false))
    await user.click(trigger)
    expect(await screen.findByRole('textbox')).toHaveValue('')
  })

  test('closing clears the typed phrase and the error for next time', async () => {
    const user = userEvent.setup()
    render(<Confirm challenge="delete" onConfirm={() => Promise.reject(new Error('Nope'))} />)
    const trigger = screen.getByRole('button', { name: 'Delete projects' })
    await user.click(trigger)
    await user.type(await screen.findByRole('textbox'), 'delete{Enter}')
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    await user.click(trigger)
    expect(await screen.findByRole('textbox')).toHaveValue('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('AlertDialog on touch', () => {
  test('stays a centered alert: no sheet, no handle, and a pull does not dismiss it', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Discard />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Close editor' }))
    const alert = await screen.findByRole('alertdialog', { name: 'Discard changes?' })
    expect(alert).toHaveClass('yj-dialog')
    expect(alert).not.toHaveAttribute('data-sheet-popup')
    expect(document.querySelector('[data-slot=sheet-layer], [data-slot=sheet-handle]')).toBeNull()
    fireEvent.pointerDown(alert, { pointerType: 'mouse', button: 0, clientY: 100 })
    fireEvent.pointerMove(alert, { pointerType: 'mouse', clientY: 400 })
    fireEvent.pointerUp(alert, { pointerType: 'mouse', clientY: 400 })
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  test('its actions stack full width at 44px on touch, and both still answer it', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Discard />
      </YoujProvider>,
    )
    const trigger = screen.getByRole('button', { name: 'Close editor' })
    await user.click(trigger)
    const footer = (await screen.findByRole('alertdialog')).querySelector('[data-slot=alert-dialog-footer]')!
    expect(footer.className).toContain('touch:flex-col-reverse!')
    expect(footer.className).toContain('touch:[&>:is(button,a)]:min-h-11')
    await user.click(screen.getByRole('button', { name: 'Keep editing' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  test("it renders in the provider's portal container", async () => {
    const frame = document.createElement('div')
    document.body.append(frame)
    render(
      <YoujProvider device="touch" portalContainer={frame}>
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogTitle>Framed</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      </YoujProvider>,
    )
    expect(frame).toContainElement(await screen.findByRole('alertdialog'))
    frame.remove()
  })
})
