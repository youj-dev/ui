import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CodeBlock } from './code-block'

const CODE = `import { Button } from '@youj/react'

export function Save() {
  return <Button>Save</Button>
}`

describe('CodeBlock', () => {
  test('a figure with its language in the header, highlighted as tokens (never HTML)', () => {
    const { container } = render(<CodeBlock code={CODE} language="tsx" />)
    const figure = container.querySelector('figure[data-slot=code-block]')!
    expect(within(figure as HTMLElement).getByText('tsx')).toBeInTheDocument()
    expect(within(figure as HTMLElement).getByText('import')).toHaveClass('own:text-accent-text')
    expect(figure.querySelector('pre code')).toHaveTextContent('export function Save()')
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
  })

  test('markup in the code is shown as text', () => {
    const { container } = render(<CodeBlock code={'<img src=x onerror="alert(1)">'} language="html" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('code')).toHaveTextContent('<img src=x onerror="alert(1)">')
  })

  test('a filename leads the header, with the language beside it, and names the scroll region', () => {
    render(<CodeBlock code="pnpm dlx youj init" language="sh" filename="terminal" />)
    expect(screen.getByText('terminal')).toHaveAttribute('data-slot', 'code-block-filename')
    expect(screen.getByText('sh')).toBeInTheDocument()
    expect(screen.getByLabelText('terminal')).toBeInTheDocument()
  })

  test('without a language it is plain text', () => {
    render(<CodeBlock code="just words" />)
    expect(screen.getByText('text')).toBeInTheDocument()
    expect(screen.getByLabelText('Code code')).toBeInTheDocument()
  })

  test('line numbers are a decorative gutter, one per line', () => {
    const { container } = render(<CodeBlock code={`${CODE}\n`} language="tsx" lineNumbers />)
    const gutter = container.querySelector('[data-slot=code-block-gutter]')!
    expect(gutter).toHaveAttribute('aria-hidden', 'true')
    expect(gutter.children).toHaveLength(5)
    expect(gutter.lastElementChild).toHaveTextContent('5')
  })

  test('copies the code from the keyboard and announces it', async () => {
    const user = userEvent.setup()
    render(<CodeBlock code="pnpm add @youj/react" language="sh" />)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Copy code' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await navigator.clipboard.readText()).toBe('pnpm add @youj/react')
    expect(await screen.findByText('Copied', { selector: '[role=status]' })).toBeInTheDocument()
  })

  test('a refused copy is said, not faked', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'))
    render(<CodeBlock code="x" />)
    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(await screen.findByText('Couldn’t copy', { selector: '[role=alert]' })).toBeInTheDocument()
    spy.mockRestore()
  })

  test('actions replace the copy button; tail is drawn inside the code', () => {
    render(<CodeBlock code="const a = 1" language="ts" copyLabel="Copy snippet" actions={<button type="button">Run</button>} tail={<span data-testid="caret" />} />)
    expect(screen.queryByRole('button', { name: 'Copy snippet' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument()
    expect(screen.getByTestId('caret').closest('code')).not.toBeNull()
  })

  test('under reduced motion the copy still lands and nothing is left running on unmount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <YoujProvider reducedMotion="always">
        <CodeBlock code="echo hi" language="sh" />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => expect(document.querySelector('[data-icon=copy]')).toHaveAttribute('data-state', 'active'))
    unmount()
    expect(document.querySelector('[data-slot=code-block]')).toBeNull()
  })
})
