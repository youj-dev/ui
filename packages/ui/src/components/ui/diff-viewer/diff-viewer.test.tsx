import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiffViewer } from './diff-viewer'

const BEFORE = `import { load } from './load'

export const config = {
  retries: 3,
  timeout: 30,
  region: 'eu-west-1',
  cache: true,
  logLevel: 'info',
  tracing: false,
  metrics: true,
  queue: 'default',
}
`
const AFTER = `import { load } from './load'

export const config = {
  retries: 5,
  timeout: 30,
  region: 'eu-west-1',
  cache: true,
  logLevel: 'info',
  tracing: false,
  metrics: true,
  queue: 'priority',
  batch: 50,
}
`

const body = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-slot="diff-viewer-body"]')!
const rowsOf = (container: HTMLElement, type: string) => container.querySelectorAll(`td[data-yj-line="${type}"]`)

describe('DiffViewer', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  test('names the file, counts the change and reads changed lines out by number', () => {
    const { container } = render(<DiffViewer before={BEFORE} after={AFTER} filename="src/config.ts" language="ts" />)
    expect(screen.getByRole('figure', { name: 'src/config.ts' })).toBeInTheDocument()
    expect(screen.getByText('+3')).toBeInTheDocument()
    expect(screen.getByText('−2')).toBeInTheDocument()
    expect(screen.getAllByText('3 additions, 2 deletions').length).toBeGreaterThan(0)
    expect(rowsOf(container, 'add')).toHaveLength(3)
    expect(rowsOf(container, 'del')).toHaveLength(2)
    expect(rowsOf(container, 'add')[0]).toHaveTextContent('Added line 4: retries: 5,')
    expect(rowsOf(container, 'del')[0]).toHaveTextContent('Removed line 4: retries: 3,')
    // The digit that changed is marked inside its line.
    expect(rowsOf(container, 'add')[0]!.querySelector('[data-slot="diff-viewer-mark"]')).toHaveTextContent('5')
  })

  test('folds a long unchanged run beyond the context, and opens it in place', async () => {
    const user = userEvent.setup()
    const { container } = render(<DiffViewer before={BEFORE} after={AFTER} context={1} />)
    const fold = screen.getByRole('button', { name: '4 unchanged lines' })
    expect(fold).toHaveAttribute('aria-expanded', 'false')
    expect(rowsOf(container, 'context')).toHaveLength(6)
    await user.click(fold)
    expect(screen.queryByRole('button', { name: /unchanged lines/ })).not.toBeInTheDocument()
    expect(rowsOf(container, 'context')).toHaveLength(10)
    expect(body(container)).toHaveFocus()
  })

  test('identical files say so and fold to one row', () => {
    render(<DiffViewer before={BEFORE} after={BEFORE} />)
    expect(screen.getByText('No changes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '12 unchanged lines' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next change' })).toBeDisabled()
  })

  test('J and K step through the changes, and the header says where you are', async () => {
    const user = userEvent.setup()
    const { container } = render(<DiffViewer before={BEFORE} after={AFTER} />)
    expect(screen.getByText('2 changes')).toBeInTheDocument()
    body(container).focus()
    await user.keyboard('j')
    expect(screen.getByText('Change 1 of 2')).toBeInTheDocument()
    expect(container.querySelector('[data-yj-current]')).toHaveTextContent('retries: 3')
    await user.keyboard('j')
    expect(screen.getByText('Change 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next change' })).toBeDisabled()
    fireEvent.keyDown(body(container), { key: 'ArrowUp', altKey: true })
    expect(screen.getByText('Change 1 of 2')).toBeInTheDocument()
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  test('the split view pairs each removal with its addition, side by side', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    const { container } = render(<DiffViewer before={BEFORE} after={AFTER} onViewChange={onViewChange} />)
    await user.click(screen.getByRole('button', { name: 'Split' }))
    expect(onViewChange).toHaveBeenCalledWith('split')
    expect(container.querySelector('[data-slot="diff-viewer"]')).toHaveAttribute('data-yj-view', 'split')
    const pair = rowsOf(container, 'del')[0]!.closest('tr')!
    expect(within(pair).getByText(/Added line 4/)).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Before' })).toBeInTheDocument()
  })

  test('wrap is a toggle the app can hold', async () => {
    const user = userEvent.setup()
    const onWrapChange = vi.fn()
    const { container } = render(<DiffViewer before="a" after="b" onWrapChange={onWrapChange} />)
    await user.click(screen.getByRole('button', { name: 'Wrap lines' }))
    expect(onWrapChange).toHaveBeenCalledWith(true)
    expect(container.querySelector('[data-slot="diff-viewer"]')).toHaveAttribute('data-yj-wrap')
  })

  test('a patch shows its hunks and names its file', () => {
    const patch = `--- a/README.md\n+++ b/README.md\n@@ -1,2 +1,2 @@\n # Youj\n-Old line\n+New line\n`
    const { container } = render(<DiffViewer patch={patch} />)
    expect(screen.getByRole('figure', { name: 'README.md' })).toBeInTheDocument()
    expect(container.querySelector('[data-slot="diff-viewer-hunk"]')).toHaveTextContent('@@ -1,2 +1,2 @@')
    expect(rowsOf(container, 'add')[0]).toHaveTextContent('Added line 2: New line')
  })

  test('copies the new version', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    render(<DiffViewer before={BEFORE} after={AFTER} />)
    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(writeText).toHaveBeenCalledWith(AFTER)
  })

  test('keeps code left to right on a right-to-left page', () => {
    const { container } = render(
      <div dir="rtl">
        <DiffViewer before="a" after="b" />
      </div>,
    )
    expect(body(container)).toHaveAttribute('dir', 'ltr')
  })
})
