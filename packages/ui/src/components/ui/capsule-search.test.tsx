import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CapsuleSearch } from './capsule-search'

const root = () => document.querySelector('[data-slot=capsule-search]')!

describe('CapsuleSearch', () => {
  test('a searchbox named by default, showing its shortcut at rest', () => {
    render(<CapsuleSearch shortcut="/" />)
    const box = screen.getByRole('searchbox', { name: 'Search' })
    expect(box).toHaveAttribute('aria-keyshortcuts', '/')
    expect(document.querySelector('[data-slot=capsule-search-hint]')).toHaveTextContent('/')
    expect(root()).not.toHaveAttribute('data-open')
  })

  test('the shortcut focuses it from the page, but not while typing elsewhere', async () => {
    const user = userEvent.setup()
    render(
      <>
        <input aria-label="Notes" />
        <CapsuleSearch shortcut="/" />
      </>,
    )
    await user.click(screen.getByRole('textbox', { name: 'Notes' }))
    await user.keyboard('/')
    expect(screen.getByRole('searchbox')).not.toHaveFocus()
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('/')
    screen.getByRole('textbox', { name: 'Notes' }).blur()
    fireEvent.keyDown(document.body, { key: '/' })
    expect(screen.getByRole('searchbox')).toHaveFocus()
    expect(root()).toHaveAttribute('data-open')
    expect(document.querySelector('[data-slot=capsule-search-hint]')).toBeNull()
  })

  test('mod+k works with either modifier and stops listening once unmounted', () => {
    const { unmount } = render(<CapsuleSearch shortcut="mod+k" />)
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true })
    expect(screen.getByRole('searchbox')).toHaveFocus()
    const remove = vi.spyOn(document, 'removeEventListener')
    unmount()
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function))
    remove.mockRestore()
  })

  test('typing offers a clear button; Enter submits; Escape clears, then leaves', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onValueChange = vi.fn()
    render(<CapsuleSearch onSubmit={onSubmit} onValueChange={onValueChange} />)
    const box = screen.getByRole('searchbox')
    await user.click(box)
    await user.type(box, 'kick')
    expect(onValueChange).toHaveBeenLastCalledWith('kick')
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('kick')
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(box).toHaveValue('')
    expect(box).toHaveFocus()
    await user.type(box, 'snare')
    await user.keyboard('{Escape}')
    expect(box).toHaveValue('')
    expect(box).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(box).not.toHaveFocus()
    expect(root()).not.toHaveAttribute('data-open')
  })

  test('stays open while it holds text', () => {
    render(<CapsuleSearch defaultValue="808" />)
    expect(root()).toHaveAttribute('data-open')
  })
})
