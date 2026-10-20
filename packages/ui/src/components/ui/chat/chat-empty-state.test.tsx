import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChatEmptyState } from './chat-empty-state'

describe('ChatEmptyState', () => {
  test('reads the greeting whole, though it is revealed word by word', () => {
    const { container } = render(<ChatEmptyState greeting="Good morning, Ada" description="Ask about your deployments." />, {
      wrapper: ({ children }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>,
    })
    expect(screen.getByText('Good morning, Ada')).toHaveClass('sr-only')
    // The split copy is decorative.
    expect(container.querySelector('[data-slot=empty-title] [aria-hidden]')).toBeInTheDocument()
    expect(screen.getByText('Ask about your deployments.')).toBeInTheDocument()
  })

  test('its suggestions hand over their prompt', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ChatEmptyState greeting="Hello" suggestions={[{ label: 'Compare regions', prompt: 'Compare cold starts' }]} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /Compare regions/ }))
    expect(onSelect).toHaveBeenCalledWith('Compare cold starts', { label: 'Compare regions', prompt: 'Compare cold starts' })
  })

  test('reduced motion renders the greeting as plain text, in place', () => {
    const { container } = render(<ChatEmptyState greeting="Good morning, Ada" />, {
      wrapper: ({ children }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>,
    })
    expect(container.querySelector('[data-slot=empty-title]')).toHaveTextContent('Good morning, Ada')
    expect(container.querySelector('[data-slot=empty-title] [aria-hidden]')).toBeNull()
  })
})
