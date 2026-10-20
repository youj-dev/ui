import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Bookmark, BookmarkCheck, Pause, Play } from 'lucide-react'
import { useState } from 'react'
import { YoujProvider } from '@youj/core'
import { IconSwap } from './icon-swap'
import { MenuIcon } from './menu'
import { useIconState, type UseIconStateOptions } from './use-icon-state'

const wrapper = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>

function BookmarkButton(options: Partial<UseIconStateOptions>) {
  const state = useIconState({ label: 'Bookmark', ...options } as UseIconStateOptions)
  return (
    <button {...state.buttonProps}>
      <IconSwap {...state.iconProps} from={Bookmark} to={BookmarkCheck} transition="draw" />
    </button>
  )
}

function PlayButton() {
  const state = useIconState({ labels: ['Play', 'Pause'] })
  return (
    <button {...state.buttonProps}>
      <IconSwap {...state.iconProps} from={Play} to={Pause} transition="morph" />
    </button>
  )
}

describe('pressed toggles (label)', () => {
  test('announce state with aria-pressed and keep one name', async () => {
    const user = userEvent.setup()
    render(<BookmarkButton />, { wrapper })
    const button = screen.getByRole('button', { name: 'Bookmark' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveAccessibleName('Bookmark')
    expect(button.querySelector('.youj-icon-swap')).toHaveAttribute('data-state', 'to')
  })

  test('toggle from the keyboard with Enter and Space', async () => {
    const user = userEvent.setup()
    render(<BookmarkButton />, { wrapper })
    const button = screen.getByRole('button', { name: 'Bookmark' })
    await user.tab()
    expect(button).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard(' ')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  test('defaultActive sets the starting state', () => {
    render(<BookmarkButton defaultActive />, { wrapper })
    expect(screen.getByRole('button', { name: 'Bookmark' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('actions that flip (labels)', () => {
  test('name what the button will do next, without aria-pressed', async () => {
    const user = userEvent.setup()
    render(<PlayButton />, { wrapper })
    const button = screen.getByRole('button', { name: 'Play' })
    expect(button).not.toHaveAttribute('aria-pressed')
    await user.click(button)
    expect(button).toHaveAccessibleName('Pause')
    await user.click(button)
    expect(button).toHaveAccessibleName('Play')
  })
})

describe('controlled', () => {
  test('reports changes and follows the owner’s state', async () => {
    const user = userEvent.setup()
    const onActiveChange = vi.fn()
    function Owner() {
      const [open, setOpen] = useState(false)
      const state = useIconState({
        labels: ['Open menu', 'Close menu'],
        active: open,
        onActiveChange: (next) => {
          onActiveChange(next)
          setOpen(next)
        },
      })
      return (
        <button {...state.buttonProps}>
          <MenuIcon {...state.iconProps} />
        </button>
      )
    }
    render(<Owner />, { wrapper })
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(onActiveChange).toHaveBeenCalledWith(true)
    const button = screen.getByRole('button', { name: 'Close menu' })
    expect(button.querySelector('svg')).toHaveAttribute('data-state', 'active')
  })

  test('without the owner updating, a controlled state stays put', async () => {
    const user = userEvent.setup()
    const onActiveChange = vi.fn()
    render(<BookmarkButton active={false} onActiveChange={onActiveChange} />, { wrapper })
    const button = screen.getByRole('button', { name: 'Bookmark' })
    await user.click(button)
    expect(onActiveChange).toHaveBeenCalledWith(true)
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })
})
