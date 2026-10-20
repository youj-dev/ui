import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatMessage, type ChatFeedback } from './chat-message'

const AT = new Date('2026-01-15T09:41:00Z')

function Answer({ onRegenerate = () => {}, onFeedback = () => {} }: { onRegenerate?: () => void; onFeedback?: (f: ChatFeedback) => void }) {
  const [feedback, setFeedback] = useState<ChatFeedback>(null)
  return (
    <ChatMessage
      role="assistant"
      name="Youj"
      timestamp={AT}
      content="The build **passed**."
      onRegenerate={onRegenerate}
      feedback={feedback}
      onFeedbackChange={(next) => {
        setFeedback(next)
        onFeedback(next)
      }}
    />
  )
}

describe('ChatMessage', () => {
  test('is an article named by its author and time', () => {
    render(<Answer />)
    const article = screen.getByRole('article')
    expect(article).toHaveAccessibleName(/^Youj /)
    expect(within(article).getByText('passed').tagName).toBe('STRONG')
    expect(article.querySelector('time')).toHaveAttribute('datetime', AT.toISOString())
  })

  test('actions are one toolbar: a single tab stop, arrow keys inside, Enter and Space act', async () => {
    const user = userEvent.setup()
    const onRegenerate = vi.fn()
    const onFeedback = vi.fn()
    render(
      <>
        <Answer onRegenerate={onRegenerate} onFeedback={onFeedback} />
        <button>after</button>
      </>,
    )
    const toolbar = screen.getByRole('toolbar', { name: 'Message actions' })
    await user.tab()
    expect(within(toolbar).getByRole('button', { name: 'Copy' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(within(toolbar).getByRole('button', { name: 'Regenerate' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onRegenerate).toHaveBeenCalledTimes(1)

    await user.keyboard('{ArrowRight}')
    const good = within(toolbar).getByRole('button', { name: 'Good response' })
    expect(good).toHaveFocus()
    expect(good).toHaveAttribute('aria-pressed', 'false')
    await user.keyboard(' ')
    expect(good).toHaveAttribute('aria-pressed', 'true')
    expect(onFeedback).toHaveBeenLastCalledWith('up')

    // Good and bad are exclusive.
    await user.keyboard('{ArrowRight}{Enter}')
    expect(within(toolbar).getByRole('button', { name: 'Bad response' })).toHaveAttribute('aria-pressed', 'true')
    expect(good).toHaveAttribute('aria-pressed', 'false')
    expect(onFeedback).toHaveBeenLastCalledWith('down')

    // One tab stop: Tab leaves the toolbar.
    await user.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  test('copy puts the message source on the clipboard and announces it', async () => {
    const user = userEvent.setup()
    render(<Answer />)
    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(await navigator.clipboard.readText()).toBe('The build **passed**.')
    expect(await screen.findByText('Copied', { selector: '[role=status]' })).toBeInTheDocument()
  })

  test('while streaming it is busy and has no actions yet', () => {
    const { rerender } = render(<ChatMessage role="assistant" content="Checking" streaming onRegenerate={() => {}} />)
    expect(screen.getByRole('article')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('toolbar')).toBeNull()
    rerender(<ChatMessage role="assistant" content="Checking done." onRegenerate={() => {}} />)
    expect(screen.getByRole('toolbar')).toBeInTheDocument()
  })

  test('an error shows under what arrived, with Retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ChatMessage role="assistant" content="Checking the" error="The connection dropped." onRetry={onRetry} />)
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('data-status', 'error')
    expect(article).toHaveTextContent('Checking the')
    expect(article).toHaveTextContent('The connection dropped.')
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  describe('editing your own message', () => {
    function Mine({ onEdit }: { onEdit: (text: string) => void }) {
      const [text, setText] = useState('Deploy orion')
      return (
        <ChatMessage
          role="user"
          name="Ada"
          content={text}
          onEdit={(next) => {
            setText(next)
            onEdit(next)
          }}
        />
      )
    }

    test('Edit opens the text in place; Enter sends it and focus returns to Edit', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      render(<Mine onEdit={onEdit} />)
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      const field = screen.getByRole('textbox', { name: 'Edit message' })
      expect(field).toHaveFocus()
      expect(field).toHaveValue('Deploy orion')
      await user.keyboard(' to fra1{Shift>}{Enter}{/Shift}now')
      expect(field).toHaveValue('Deploy orion to fra1\nnow')
      await user.keyboard('{Enter}')
      expect(onEdit).toHaveBeenCalledWith('Deploy orion to fra1\nnow')
      expect(screen.queryByRole('textbox')).toBeNull()
      expect(screen.getByRole('article')).toHaveTextContent('Deploy orion to fra1 now')
      expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus()
    })

    test('Escape cancels without saving', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      render(<Mine onEdit={onEdit} />)
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      await user.keyboard(' and more{Escape}')
      expect(onEdit).not.toHaveBeenCalled()
      expect(screen.getByRole('article')).toHaveTextContent('Deploy orion')
      expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus()
    })
  })

  test('a system message is a quiet notice, still named', () => {
    render(<ChatMessage role="system" content="Model switched to Youj Pro" />)
    const article = screen.getByRole('article', { name: 'System' })
    expect(article).toHaveTextContent('Model switched to Youj Pro')
    expect(screen.queryByRole('toolbar')).toBeNull()
  })
})
