import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerDirection,
} from './drawer'

function Actions({ swipeDirection }: { swipeDirection?: DrawerDirection }) {
  return (
    <Drawer swipeDirection={swipeDirection}>
      <DrawerTrigger>Actions</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Preview deployment</DrawerTitle>
          <DrawerDescription>Built in 41s.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose>Redeploy</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

describe('Drawer', () => {
  test('is a modal dialog named by its header: a bottom sheet with a decorative handle by default', async () => {
    const user = userEvent.setup()
    render(<Actions />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    const drawer = await screen.findByRole('dialog', { name: 'Preview deployment' })
    expect(drawer).toHaveAccessibleDescription('Built in 41s.')
    expect(drawer).toHaveAttribute('data-swipe-direction', 'down')
    expect(drawer).toHaveClass('yj-sheet-bottom')
    expect(drawer.querySelector('[data-slot=drawer-handle]')).toHaveAttribute('aria-hidden', 'true')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Redeploy' })).toHaveFocus())
  })

  test.each<[DrawerDirection, string, boolean]>([
    ['up', 'yj-sheet-top', true],
    ['left', 'yj-sheet-left', false],
    ['right', 'yj-sheet-right', false],
  ])('swipeDirection="%s" sits on its edge with %s', async (direction, preset, handle) => {
    const user = userEvent.setup()
    render(<Actions swipeDirection={direction} />)
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    const drawer = await screen.findByRole('dialog')
    expect(drawer).toHaveAttribute('data-swipe-direction', direction)
    expect(drawer).toHaveClass(preset)
    expect(!!drawer.querySelector('[data-slot=drawer-handle]')).toBe(handle)
  })

  test('Escape and its close buttons dismiss it and return focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<Actions />)
    const trigger = screen.getByRole('button', { name: 'Actions' })
    for (const close of [() => user.keyboard('{Escape}'), () => user.click(screen.getByRole('button', { name: 'Redeploy' }))]) {
      await user.click(trigger)
      await screen.findByRole('dialog')
      await close()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(trigger).toHaveFocus()
    }
  })

  test('its portal carries the youj scope, and the scrim thins with the swipe', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always" timeScale={2}>
        <Actions />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    const portal = (await screen.findByRole('dialog')).closest('[data-yj-reduced]') as HTMLElement
    expect(portal.style.getPropertyValue('--yj-motion')).toBe('0')
    expect(portal.style.getPropertyValue('--yj-time-scale')).toBe('2')
    expect(document.querySelector('[data-slot=drawer-overlay]')).toHaveClass('yj-backdrop')
  })
})
