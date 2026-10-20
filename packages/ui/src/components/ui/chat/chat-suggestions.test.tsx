import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChatSuggestions } from './chat-suggestions'

const SUGGESTIONS = [
  { label: 'Ship to production', prompt: 'How do I ship orion?' },
  { label: 'Compare regions' },
]

describe('ChatSuggestions', () => {
  test('a labelled group of buttons; picking one hands over its prompt (or its label)', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ChatSuggestions suggestions={SUGGESTIONS} onSelect={onSelect} />)
    const group = screen.getByRole('group', { name: 'Suggested prompts' })
    const [first, second] = within(group).getAllByRole('button')
    await user.click(first!)
    expect(onSelect).toHaveBeenLastCalledWith('How do I ship orion?', SUGGESTIONS[0])
    await user.tab()
    expect(second).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenLastCalledWith('Compare regions', SUGGESTIONS[1])
  })

  test('with motion they arrive from hidden; reduced motion shows them in place at once', () => {
    const { unmount } = render(<ChatSuggestions suggestions={SUGGESTIONS} onSelect={() => {}} />, {
      wrapper: ({ children }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>,
    })
    expect(screen.getAllByRole('listitem')[0]).toHaveStyle({ opacity: '0' })
    unmount()
    render(<ChatSuggestions suggestions={SUGGESTIONS} onSelect={() => {}} />, {
      wrapper: ({ children }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>,
    })
    for (const item of screen.getAllByRole('listitem')) expect(item.style.opacity).not.toBe('0')
  })

  test('cards show their description', () => {
    render(<ChatSuggestions layout="cards" suggestions={[{ label: 'Compare regions', description: 'Cold starts and cost' }]} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /Compare regions/ })).toHaveTextContent('Cold starts and cost')
  })
})
