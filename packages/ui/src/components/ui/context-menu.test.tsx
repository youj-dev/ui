import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './context-menu'

function FileRow({ onAction = () => {} }: { onAction?: (action: string) => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <a href="#vercel.json">vercel.json</a>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>vercel.json</ContextMenuLabel>
        <ContextMenuItem onClick={() => onAction('rename')}>Rename</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="danger" onClick={() => onAction('delete')}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

const trigger = () => document.querySelector('[data-slot=context-menu-trigger]')!

describe('ContextMenu', () => {
  test('a right click opens a menu of items at the pointer; choosing one runs it', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<FileRow onAction={onAction} />)
    fireEvent.contextMenu(trigger(), { clientX: 40, clientY: 20 })
    const menu = await screen.findByRole('menu')
    expect(menu).toHaveClass('yj-pop')
    expect(trigger()).toHaveAttribute('data-popup-open')
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(onAction).toHaveBeenCalledWith('delete')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  test.each([
    ['Shift+F10', '{Shift>}{F10}{/Shift}'],
    ['the Menu key', '{ContextMenu}'],
  ])('%s on a focused element inside the trigger opens it, and Escape closes it', async (_, keys) => {
    const user = userEvent.setup()
    render(<FileRow />)
    const link = screen.getByRole('link', { name: 'vercel.json' })
    link.focus()
    await user.keyboard(keys)
    expect(await screen.findByRole('menu')).toBeInTheDocument()
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  test('other keys leave it closed', async () => {
    const user = userEvent.setup()
    render(<FileRow />)
    screen.getByRole('link', { name: 'vercel.json' }).focus()
    await user.keyboard('{F10}{Shift>}a{/Shift}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('its portal carries the youj scope', async () => {
    render(
      <YoujProvider reducedMotion="always">
        <FileRow />
      </YoujProvider>,
    )
    fireEvent.contextMenu(trigger(), { clientX: 40, clientY: 20 })
    const portal = (await screen.findByRole('menu')).closest('[data-yj-reduced]') as HTMLElement
    expect(portal.style.getPropertyValue('--yj-motion')).toBe('0')
  })
})

describe('ContextMenu on touch', () => {
  const touchAt = (el: Element, x = 20, y = 20) => ({ touches: [{ clientX: x, clientY: y, target: el }] })
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  test('a long press opens the action sheet; a tap on a row runs it and closes the sheet', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <YoujProvider device="touch">
        <FileRow onAction={onAction} />
      </YoujProvider>,
    )
    const trigger = screen.getByText('vercel.json').closest('[data-slot=context-menu-trigger]')!
    fireEvent.touchStart(trigger, touchAt(trigger))
    await wait(600)
    fireEvent.touchEnd(trigger)
    const menu = await screen.findByRole('menu')
    expect(menu).toHaveAttribute('data-sheet-popup')
    expect(menu).toHaveClass('yj-sheet-bottom')
    expect(menu.querySelector('[data-slot=sheet-handle]')).not.toBeNull()
    expect(document.querySelector('[data-sheet-scrim]')).not.toBeNull()
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }))
    expect(onAction).toHaveBeenCalledWith('rename')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  test('a touch that moves (a scroll) or lifts early does not open it', async () => {
    render(
      <YoujProvider device="touch">
        <FileRow />
      </YoujProvider>,
    )
    const trigger = screen.getByText('vercel.json').closest('[data-slot=context-menu-trigger]')!
    fireEvent.touchStart(trigger, touchAt(trigger))
    fireEvent.touchMove(trigger, touchAt(trigger, 20, 60))
    await wait(600)
    fireEvent.touchEnd(trigger)
    fireEvent.touchStart(trigger, touchAt(trigger))
    await wait(200)
    fireEvent.touchEnd(trigger)
    await wait(500)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('presentation="popover" keeps the popup at the finger on touch', async () => {
    render(
      <YoujProvider device="touch">
        <ContextMenu>
          <ContextMenuTrigger>Row</ContextMenuTrigger>
          <ContextMenuContent presentation="popover">
            <ContextMenuItem>Rename</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </YoujProvider>,
    )
    fireEvent.contextMenu(screen.getByText('Row'), { clientX: 40, clientY: 40 })
    expect(await screen.findByRole('menu')).not.toHaveAttribute('data-sheet-popup')
  })
})
