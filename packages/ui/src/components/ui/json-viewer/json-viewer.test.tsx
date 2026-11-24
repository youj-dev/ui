import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { JsonViewer, type JsonViewerProps } from './index'

const VALUE = {
  user: { name: 'Noor', roles: ['admin', 'owner'] },
  plan: { name: 'Pro', seats: 3 },
  active: true,
  note: null,
}

function Viewer(props: Partial<JsonViewerProps>) {
  return (
    <YoujProvider reducedMotion="always">
      <JsonViewer value={VALUE} {...props} />
    </YoujProvider>
  )
}

const item = (name: string) => screen.getByRole('treeitem', { name })
const focused = () => (document.activeElement as HTMLElement).getAttribute('data-yj-path')

describe('JsonViewer', () => {
  test('a tree named by its label, objects and arrays counted aloud, the top level open', () => {
    render(<Viewer />)
    expect(screen.getByRole('tree', { name: 'JSON' })).toHaveAttribute('dir', 'ltr')
    expect(item('user: 2 keys')).toHaveAttribute('aria-expanded', 'true')
    expect(item('roles: 2 items')).toHaveAttribute('aria-expanded', 'false')
    expect(item('name: "Noor"')).not.toHaveAttribute('aria-expanded')
    expect(item('active: true')).toBeInTheDocument()
    expect(item('note: null')).toBeInTheDocument()
    expect(item('user: 2 keys')).toHaveAttribute('data-yj-kind', 'object')
    expect(item('roles: 2 items')).toHaveAttribute('data-yj-path', 'user.roles')
    // The counts are drawn for the eye; the words are read.
    expect(within(item('plan: 2 keys')).getByText('{2}')).toHaveAttribute('aria-hidden', 'true')
  })

  test('label names it, in the header too', () => {
    render(<Viewer label="Payload" />)
    expect(screen.getByRole('tree', { name: 'Payload' })).toBeInTheDocument()
    expect(screen.getByText('Payload')).toHaveAttribute('data-slot', 'json-viewer-label')
  })

  test('defaultExpandDepth sets what starts open; the header button opens and closes everything', async () => {
    const user = userEvent.setup()
    render(<Viewer defaultExpandDepth={0} />)
    expect(item('user: 2 keys')).toHaveAttribute('aria-expanded', 'false')
    await user.click(screen.getByRole('button', { name: 'Expand all' }))
    expect(item('user: 2 keys')).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('treeitem', { name: 'roles: 2 items' })).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('button', { name: 'Collapse all' }))
    expect(item('user: 2 keys')).toHaveAttribute('aria-expanded', 'false')
    expect(item('plan: 2 keys')).toHaveAttribute('aria-expanded', 'false')
  })

  test('is one Tab stop after the header, and the focused row’s copy buttons come next', async () => {
    const user = userEvent.setup()
    render(<Viewer />)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Expand all' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Copy JSON' })).toHaveFocus()
    await user.tab()
    expect(item('user: 2 keys')).toHaveFocus()
    expect(screen.getAllByRole('treeitem').filter((row) => row.tabIndex === 0)).toEqual([item('user: 2 keys')])
    // Only the focused row carries buttons.
    expect(screen.getAllByRole('button', { name: 'Copy value' })).toHaveLength(1)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Copy value' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Copy path' })).toHaveFocus()
  })

  test('arrows walk, open and close; Home, End and Enter', async () => {
    const user = userEvent.setup()
    render(<Viewer />)
    act(() => item('user: 2 keys').focus())
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(focused()).toBe('user.roles')
    await user.keyboard('{ArrowRight}')
    expect(item('roles: 2 items')).toHaveAttribute('aria-expanded', 'true')
    await screen.findByRole('treeitem', { name: '0: "admin"' })
    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe('user.roles[0]')
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toBe('user.roles')
    await user.keyboard('{ArrowLeft}')
    expect(item('roles: 2 items')).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard('{End}')
    expect(focused()).toBe('note')
    await user.keyboard('{Home}{Enter}')
    expect(item('user: 2 keys')).toHaveAttribute('aria-expanded', 'false')
    expect(focused()).toBe('user')
  })

  test('* opens every sibling, and typing jumps to a key', async () => {
    // Keys typed within half a second spell one word: the clock moves on between words.
    vi.useFakeTimers({ toFake: ['Date'] })
    const pause = () => vi.setSystemTime(Date.now() + 1000)
    try {
      const user = userEvent.setup()
      render(<Viewer defaultExpandDepth={0} />)
      act(() => item('user: 2 keys').focus())
      await user.keyboard('n')
      expect(focused()).toBe('note')
      pause()
      await user.keyboard('a')
      expect(focused()).toBe('active')
      pause()
      await user.keyboard('pl')
      expect(focused()).toBe('plan')
      await user.keyboard('*')
      expect(item('user: 2 keys')).toHaveAttribute('aria-expanded', 'true')
      expect(item('plan: 2 keys')).toHaveAttribute('aria-expanded', 'true')
    } finally {
      vi.useRealTimers()
    }
  })

  test('a click on a row opens it; a click on its copy button doesn’t', async () => {
    const user = userEvent.setup()
    render(<Viewer defaultExpandDepth={0} />)
    const plan = item('plan: 2 keys')
    await user.click(within(plan).getByText('plan'))
    expect(plan).toHaveAttribute('aria-expanded', 'true')
    await user.click(within(plan).getByRole('button', { name: 'Copy value' }))
    expect(plan).toHaveAttribute('aria-expanded', 'true')
    expect(await navigator.clipboard.readText()).toBe('{\n  "name": "Pro",\n  "seats": 3\n}')
  })

  test('copies a row’s value with Ctrl+C or its button, and its path with the other; onCopyText hears each', async () => {
    const user = userEvent.setup()
    const onCopyText = vi.fn()
    render(<Viewer onCopyText={onCopyText} />)
    act(() => item('name: "Noor"').focus())
    await user.keyboard('{Control>}c{/Control}')
    expect(await navigator.clipboard.readText()).toBe('Noor')
    await waitFor(() => expect(onCopyText).toHaveBeenCalledWith('Noor', { part: 'value', path: ['user', 'name'] }))
    expect(await screen.findByText('Copied', { selector: '[role=status]' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Copy path' }))
    expect(await navigator.clipboard.readText()).toBe('user.name')
    await waitFor(() => expect(onCopyText).toHaveBeenLastCalledWith('user.name', { part: 'path', path: ['user', 'name'] }))
  })

  test('the header copies the whole value as JSON', async () => {
    const user = userEvent.setup()
    const onCopyText = vi.fn()
    render(<Viewer onCopyText={onCopyText} />)
    await user.click(screen.getByRole('button', { name: 'Copy JSON' }))
    expect(await navigator.clipboard.readText()).toBe(JSON.stringify(VALUE, null, 2))
    await waitFor(() => expect(onCopyText).toHaveBeenCalledWith(JSON.stringify(VALUE, null, 2), { part: 'value', path: [] }))
  })

  test('a refused copy is said, not faked', async () => {
    const user = userEvent.setup()
    const onCopyText = vi.fn()
    const spy = vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'))
    render(<Viewer onCopyText={onCopyText} />)
    await user.click(screen.getByRole('button', { name: 'Copy JSON' }))
    expect(await screen.findByText('Couldn’t copy', { selector: '[role=alert]' })).toBeInTheDocument()
    expect(onCopyText).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  test('a big array opens onto ranges of a hundred, a long string onto its whole text', async () => {
    const user = userEvent.setup()
    render(<Viewer value={{ list: Array.from({ length: 150 }, (_, i) => i), token: 'abcdefghijklmnop' }} collapseStringsAfter={5} />)
    const first = item('Items 0 to 99')
    expect(first).toHaveAttribute('data-yj-kind', 'range')
    expect(first).toHaveAttribute('aria-expanded', 'false')
    await user.click(within(item('Items 100 to 149')).getByText('[100 … 149]'))
    const group = await waitFor(() => within(item('Items 100 to 149')).getByRole('group'))
    expect(within(group).getAllByRole('treeitem')).toHaveLength(50)
    expect(within(group).getAllByRole('treeitem')[0]).toHaveAccessibleName('100: 100')

    const token = item('token: "abcde…"')
    expect(token).toHaveAttribute('aria-expanded', 'false')
    await user.click(within(token).getByText('token'))
    expect(token).toHaveAccessibleName('token: 16 characters')
    expect(await screen.findByRole('treeitem', { name: 'abcdefghijklmnop' })).toHaveAttribute('data-yj-kind', 'text')
  })

  test('a value that holds itself reads as circular and doesn’t open', () => {
    const loop: Record<string, unknown> = { name: 'loop' }
    loop.self = loop
    render(<Viewer value={loop} />)
    expect(item('self: Circular reference')).not.toHaveAttribute('aria-expanded')
  })

  test('a value with nothing in it is the only row; the header has no expand button', () => {
    render(<Viewer value="Just one value" />)
    expect(screen.getAllByRole('treeitem')).toHaveLength(1)
    expect(item('"Just one value"')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Expand all' })).not.toBeInTheDocument()
  })

  test('rows opened by hand stay open when the value changes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Viewer defaultExpandDepth={0} />)
    await user.click(within(item('plan: 2 keys')).getByText('plan'))
    rerender(<Viewer defaultExpandDepth={0} value={{ ...VALUE, plan: { name: 'Team', seats: 10 } }} />)
    expect(item('plan: 2 keys')).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('treeitem', { name: 'name: "Team"' })).toBeInTheDocument()
  })

  test('speaks the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" labels={de} locale="de">
        <JsonViewer value={VALUE} />
      </YoujProvider>,
    )
    expect(screen.getByRole('tree', { name: 'JSON' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alle aufklappen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'JSON kopieren' })).toBeInTheDocument()
    expect(item('user: 2 Schlüssel')).toBeInTheDocument()
    act(() => item('user: 2 Schlüssel').focus())
    expect(screen.getByRole('button', { name: 'Wert kopieren' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pfad kopieren' })).toBeInTheDocument()
  })
})
