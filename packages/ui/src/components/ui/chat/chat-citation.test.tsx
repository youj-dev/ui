import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatCitation, ChatSources } from './chat-citation'
import { ChatMarkdown } from './chat-markdown'
import { ChatMessage } from './chat-message'

const SOURCES = [
  { title: 'Regions and pricing', url: 'https://youj.io/docs/regions', snippet: 'Per-region pricing.' },
  { title: 'Cold starts', url: 'https://youj.io/blog/cold-starts' },
]

describe('citations', () => {
  test('[n] in markdown becomes a link to that source, named by its number and title', () => {
    render(<ChatMarkdown content="fra1 is cheapest [1], and iad1 fastest [2]. Unknown: [3]." sources={SOURCES} />)
    const first = screen.getByRole('link', { name: '1, Regions and pricing' })
    expect(first).toHaveAttribute('href', 'https://youj.io/docs/regions')
    expect(first).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: '2, Cold starts' })).toBeInTheDocument()
    // A number without a source stays text.
    expect(screen.getByText(/Unknown: \[3\]/)).toBeInTheDocument()
  })

  test('focusing a citation previews its source', async () => {
    const user = userEvent.setup()
    render(<ChatCitation index={1} source={SOURCES[0]!} />)
    await user.tab()
    expect(await screen.findByText('Per-region pricing.')).toBeInTheDocument()
    expect(screen.getByText('youj.io')).toBeInTheDocument()
  })

  test('a source with an unsafe URL is shown but not linked', () => {
    render(<ChatSources sources={[{ title: 'Runbook', url: 'javascript:alert(1)' }, SOURCES[1]!]} />)
    const list = screen.getByRole('list', { name: 'Sources' })
    expect(within(list).getAllByRole('link')).toHaveLength(1)
    // No host to show: the title stands in, once.
    expect(within(list).getByText('Runbook')).toBeInTheDocument()
  })

  test('a finished answer lists its sources under it; a streaming one waits', () => {
    const { rerender } = render(<ChatMessage role="assistant" content="Cheapest is fra1 [1]." sources={SOURCES} streaming />)
    expect(screen.queryByRole('list', { name: 'Sources' })).toBeNull()
    rerender(<ChatMessage role="assistant" content="Cheapest is fra1 [1]." sources={SOURCES} />)
    expect(within(screen.getByRole('list', { name: 'Sources' })).getAllByRole('link')).toHaveLength(2)
  })
})
