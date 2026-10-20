import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChatMarkdown, revealedUnderReducedMotion } from './chat-markdown'
import { createTextStream } from './chat-text-stream'

const withMotion = (reducedMotion: 'always' | 'never') => ({
  wrapper: ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion={reducedMotion}>{children}</YoujProvider>,
})

const ANSWER = `## Deploy checklist

Ship it with **care** and read [the docs](https://youj.io/docs).

1. Run \`pnpm build\`
2. Check the preview
   - lighthouse
   - bundle size

> Rollbacks are instant.

| Region | Latency |
| :----- | ------: |
| iad1   | 18 ms   |

\`\`\`ts
const ok = await deploy()
\`\`\``

describe('ChatMarkdown', () => {
  test('renders the chat subset as real elements', () => {
    const { container } = render(<ChatMarkdown content={ANSWER} />)
    // The message's top heading is an h2, whatever markdown level the model used.
    expect(screen.getByRole('heading', { level: 2, name: 'Deploy checklist' })).toBeInTheDocument()
    expect(screen.getByText('care').tagName).toBe('STRONG')
    const link = screen.getByRole('link', { name: 'the docs' })
    expect(link).toHaveAttribute('href', 'https://youj.io/docs')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    const [ordered, nested] = screen.getAllByRole('list')
    expect(ordered!.tagName).toBe('OL')
    expect(within(nested!).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('pnpm build').tagName).toBe('CODE')
    expect(container.querySelector('blockquote')).toHaveTextContent('Rollbacks are instant.')
    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Latency' })).toHaveClass('text-end')
    expect(within(table).getByRole('cell', { name: 'iad1' })).toBeInTheDocument()
    const code = container.querySelector('[data-slot=chat-code]')!
    expect(code).toHaveTextContent('const ok = await deploy()')
    expect(within(code as HTMLElement).getByText('const')).toHaveClass('own:text-accent-text')
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
  })

  test('headings keep the page outline: the top one takes headingLevel, deeper ones follow', () => {
    const { rerender } = render(<ChatMarkdown content={'### Plan\n\n#### Steps\n\n#### Risks'} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Plan' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
    rerender(<ChatMarkdown content={'### Plan\n\n#### Steps'} headingLevel={3} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Plan' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Steps' })).toBeInTheDocument()
  })

  test('a code block copies its code and announces it', async () => {
    const user = userEvent.setup()
    render(<ChatMarkdown content={'```sh\npnpm add motion\n```'} />)
    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(await navigator.clipboard.readText()).toBe('pnpm add motion')
    expect(await screen.findByText('Copied', { selector: '[role=status]' })).toBeInTheDocument()
  })

  describe('sanitising', () => {
    test('a script injection renders as inert text', () => {
      const attack = [
        '<script>window.pwned = true</script>',
        '<img src=x onerror="window.pwned = true">',
        '[click me](javascript:window.pwned=true)',
        '[data](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
        '<a href="javascript:alert(1)">link</a>',
        '![pixel](javascript:alert(1))',
      ].join('\n\n')
      const { container } = render(<ChatMarkdown content={attack} />)
      expect(container.querySelector('script, img, iframe, object, embed, style:not([href])')).toBeNull()
      expect(screen.getByText('<script>window.pwned = true</script>')).toBeInTheDocument()
      expect((window as { pwned?: boolean }).pwned).toBeUndefined()
      // No element carries an event handler attribute, and no anchor a script URL.
      for (const el of container.querySelectorAll('*')) {
        expect([...el.attributes].filter((a) => a.name.startsWith('on'))).toEqual([])
      }
      for (const a of container.querySelectorAll('a')) expect(a.getAttribute('href')).toMatch(/^https?:|^mailto:/)
      expect(screen.queryByRole('link', { name: 'click me' })).toBeNull()
      expect(screen.getByText('click me')).toBeInTheDocument()
    })
  })

  describe('streaming', () => {
    test('marks the end with a caret, and words fade in as they arrive', () => {
      const { container, rerender } = render(<ChatMarkdown content="Hello there, the build" streaming />, withMotion('never'))
      expect(container.querySelector('[data-slot=chat-caret]')).toBeInTheDocument()
      const words = [...container.querySelectorAll('.yj-chat-word')].map((w) => w.textContent)
      expect(words).toEqual(['Hello ', 'there, ', 'the ', 'build'])

      rerender(<ChatMarkdown content="Hello there, the build passed." streaming />)
      // Words already shown keep their element (they don't fade again); new ones mount.
      expect(container.querySelectorAll('.yj-chat-word')).toHaveLength(5)

      rerender(<ChatMarkdown content="Hello there, the build passed." />)
      expect(container.querySelector('[data-slot=chat-caret]')).toBeNull()
      expect(container.querySelector('.yj-chat-word')).toBeNull()
      expect(screen.getByText('Hello there, the build passed.')).toBeInTheDocument()
    })

    test('unfinished syntax renders optimistically, never as raw markers', () => {
      const { container } = render(<ChatMarkdown content={'Use **bold** and `pnpm i`, then\n\n```ts\nconst x'} streaming />, withMotion('never'))
      expect(container).not.toHaveTextContent('```')
      expect(container.querySelector('[data-slot=chat-code]')).toHaveTextContent('const x')
      // The caret sits inside the open code block, where the text is being written.
      expect(container.querySelector('[data-slot=chat-code] [data-slot=chat-caret]')).toBeInTheDocument()
    })

    test('an answer cut off mid-table still renders its rows, without a caret', () => {
      const { container } = render(<ChatMarkdown content={'Costs:\n\n| Region | Cost |\n| :----- | --'} incomplete />)
      expect(screen.getByRole('columnheader', { name: 'Cost' })).toBeInTheDocument()
      expect(container).not.toHaveTextContent('| :-----')
      expect(container.querySelector('[data-slot=chat-caret]')).toBeNull()
    })

    test('a text source re-renders the markdown as tokens arrive', () => {
      const stream = createTextStream('Rolling')
      const { container } = render(<ChatMarkdown content={stream} streaming />, withMotion('never'))
      act(() => stream.append(' out to iad1'))
      expect(container).toHaveTextContent('Rolling out to iad1')
    })
  })

  describe('reduced motion', () => {
    test('no word fades: the text arrives in whole sentences and lines', () => {
      const stream = createTextStream('Deploying now. Building the')
      const { container, rerender } = render(<ChatMarkdown content={stream} streaming />, withMotion('always'))
      expect(container.querySelector('.yj-chat-word')).toBeNull()
      expect(container).toHaveTextContent('Deploying now.')
      expect(container).not.toHaveTextContent('Building')

      // A full stop at the very end may still become "3.14": the sentence shows once a space follows.
      act(() => stream.append(' functions took 18s.'))
      expect(container).not.toHaveTextContent('Building')
      act(() => stream.append(' Almost'))
      expect(container).toHaveTextContent('Deploying now. Building the functions took 18s.')
      expect(container).not.toHaveTextContent('Almost')

      rerender(<ChatMarkdown content={stream} />)
      expect(container).toHaveTextContent('Almost')
    })

    test('the caret holds still', () => {
      const { container } = render(<ChatMarkdown content="Hi." streaming />, withMotion('always'))
      expect(container.querySelector('[data-slot=chat-markdown]')).toHaveAttribute('data-reduced-motion')
      expect(container.querySelector('[data-slot=chat-caret]')).toBeInTheDocument()
    })

    test('chunks end at sentence ends and line breaks, not inside numbers', () => {
      expect(revealedUnderReducedMotion('Pi is 3.14 and')).toBe('')
      expect(revealedUnderReducedMotion('One. Two')).toBe('One.')
      expect(revealedUnderReducedMotion('- a\n- b')).toBe('- a\n')
    })
  })
})
