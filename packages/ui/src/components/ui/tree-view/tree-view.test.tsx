import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ContextMenuItem } from '../context-menu'
import { TreeView, type TreeNode, type TreeViewProps } from './index'

const DATA: TreeNode[] = [
  {
    id: 'src',
    name: 'src',
    children: [
      { id: 'src/app.tsx', name: 'app.tsx' },
      { id: 'src/lib', name: 'lib', children: [{ id: 'src/lib/a.ts', name: 'a.ts' }, { id: 'src/lib/b.ts', name: 'b.ts' }] },
    ],
  },
  { id: 'docs', name: 'docs', children: [{ id: 'docs/readme.md', name: 'readme.md' }] },
  { id: 'package.json', name: 'package.json' },
]

function Tree(props: Partial<TreeViewProps>) {
  return (
    <YoujProvider reducedMotion="always">
      <TreeView aria-label="Files" data={DATA} {...props} />
    </YoujProvider>
  )
}

const item = (name: string) => screen.getByRole('treeitem', { name })
const focused = () => (document.activeElement as HTMLElement).getAttribute('data-tree-id')

describe('TreeView', () => {
  test('is one Tab stop with WAI-ARIA tree semantics', async () => {
    const user = userEvent.setup()
    render(<Tree />)
    expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument()
    const src = item('src')
    expect(src).toHaveAttribute('aria-expanded', 'false')
    expect(src).toHaveAttribute('aria-selected', 'false')
    expect(item('package.json')).not.toHaveAttribute('aria-expanded')
    expect(screen.getAllByRole('treeitem').filter((t) => t.tabIndex === 0)).toEqual([src])
    await user.tab()
    expect(src).toHaveFocus()
  })

  test('arrows walk, open and close branches; Home and End jump', async () => {
    const user = userEvent.setup()
    const onExpandedChange = vi.fn()
    render(<Tree onExpandedChange={onExpandedChange} />)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(item('src')).toHaveAttribute('aria-expanded', 'true')
    expect(onExpandedChange).toHaveBeenLastCalledWith(['src'])
    // Collapse applies its (instant, reduced) open on the next frame.
    const group = await waitFor(() => within(item('src')).getByRole('group'))
    expect(within(group).getByRole('treeitem', { name: 'app.tsx' })).toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    expect(focused()).toBe('src/app.tsx')
    await user.keyboard('{ArrowDown}{ArrowRight}{ArrowRight}')
    expect(focused()).toBe('src/lib/a.ts')
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toBe('src/lib')
    await user.keyboard('{ArrowLeft}')
    expect(item('lib')).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard('{End}')
    expect(focused()).toBe('package.json')
    await user.keyboard('{Home}')
    expect(focused()).toBe('src')
  })

  test('typeahead jumps to the next matching name, and * opens every sibling', async () => {
    const user = userEvent.setup()
    render(<Tree />)
    await user.tab()
    await user.keyboard('p')
    expect(focused()).toBe('package.json')
    await user.keyboard('{Home}*')
    expect(item('src')).toHaveAttribute('aria-expanded', 'true')
    expect(item('docs')).toHaveAttribute('aria-expanded', 'true')
  })

  test('single selection: Space or click selects, Enter on a leaf activates it', async () => {
    const user = userEvent.setup()
    const onSelectedChange = vi.fn()
    const onAction = vi.fn()
    render(<Tree onSelectedChange={onSelectedChange} onAction={onAction} defaultExpanded={['src']} />)
    await user.click(screen.getByText('app.tsx'))
    expect(item('app.tsx')).toHaveAttribute('aria-selected', 'true')
    expect(onSelectedChange).toHaveBeenLastCalledWith(['src/app.tsx'])
    await user.keyboard('{End} ')
    expect(item('package.json')).toHaveAttribute('aria-selected', 'true')
    expect(item('app.tsx')).toHaveAttribute('aria-selected', 'false')
    await user.keyboard('{Enter}')
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'package.json' }))
  })

  test('multiple selection is a tri-state checkbox tree', async () => {
    const user = userEvent.setup()
    function Checked() {
      const [selected, setSelected] = useState<string[]>([])
      return <Tree selectionMode="multiple" selected={selected} onSelectedChange={setSelected} defaultExpanded={['src', 'src/lib']} />
    }
    render(<Checked />)
    await user.click(screen.getByText('a.ts'))
    expect(item('a.ts')).toHaveAttribute('aria-checked', 'true')
    expect(item('lib')).toHaveAttribute('aria-checked', 'mixed')
    expect(item('src')).toHaveAttribute('aria-checked', 'mixed')

    item('lib').focus()
    await user.keyboard(' ')
    expect(item('lib')).toHaveAttribute('aria-checked', 'true')
    expect(item('b.ts')).toHaveAttribute('aria-checked', 'true')

    item('src').focus()
    await user.keyboard(' ')
    expect(item('src')).toHaveAttribute('aria-checked', 'true')
    expect(item('app.tsx')).toHaveAttribute('aria-checked', 'true')
    await user.keyboard(' ')
    expect(item('a.ts')).toHaveAttribute('aria-checked', 'false')
  })

  test('a lazy branch loads with a spinner row, and a failure leaves a retry item', async () => {
    const user = userEvent.setup()
    let fail = true
    function Lazy() {
      const [data, setData] = useState<TreeNode[]>([{ id: 'pkgs', name: 'pkgs', hasChildren: true }])
      return (
        <Tree
          data={data}
          loadChildren={async () => {
            await new Promise((r) => setTimeout(r, 30))
            if (fail) {
              fail = false
              throw new Error('offline')
            }
            setData([{ id: 'pkgs', name: 'pkgs', children: [{ id: 'pkgs/ui', name: 'ui' }] }])
          }}
        />
      )
    }
    render(<Lazy />)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(item('pkgs')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent("Couldn't load pkgs"))
    const retry = await screen.findByRole('treeitem', { name: /Couldn't load pkgs/ })
    await user.keyboard('{ArrowDown}')
    expect(retry).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('treeitem', { name: 'ui' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('pkgs loaded'))
  })

  test('F2 renames in place: Enter commits, Escape cancels, focus returns to the item', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(<Tree onRename={onRename} />)
    await user.tab()
    await user.keyboard('{End}{F2}')
    const input = screen.getByRole('textbox', { name: 'Rename package.json' })
    expect(input).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(onRename).not.toHaveBeenCalled()
    expect(focused()).toBe('package.json')

    await user.keyboard('{F2}')
    await user.clear(screen.getByRole('textbox', { name: 'Rename package.json' }))
    await user.keyboard('pnpm.json{Enter}')
    expect(onRename).toHaveBeenCalledWith(expect.objectContaining({ id: 'package.json' }), 'pnpm.json')
    await waitFor(() => expect(focused()).toBe('package.json'))
  })

  test('the context menu opens for the row under the pointer', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<Tree contextMenu={(node) => <ContextMenuItem onClick={() => onDelete(node.id)}>Delete {node.name}</ContextMenuItem>} />)
    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('docs') })
    await user.click(await screen.findByRole('menuitem', { name: 'Delete docs' }))
    expect(onDelete).toHaveBeenCalledWith('docs')
  })

  test('reduced motion opens branches at once', async () => {
    const user = userEvent.setup()
    render(<Tree />)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(item('app.tsx')).toBeVisible())
    expect(screen.getByRole('tree')).toHaveAttribute('data-reduced-motion')
  })

  test('virtual mode renders a flat list with level, set size and position', async () => {
    const original = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = () => ({ top: 0, left: 0, bottom: 300, right: 300, width: 300, height: 300, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 300 })
    try {
      render(<Tree virtual defaultExpanded={['src']} />)
      await act(async () => {})
      const app = await screen.findByRole('treeitem', { name: 'app.tsx' })
      expect(app).toHaveAttribute('aria-level', '2')
      expect(app).toHaveAttribute('aria-posinset', '1')
      expect(app).toHaveAttribute('aria-setsize', '2')
      expect(screen.queryByRole('group')).not.toBeInTheDocument()
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original
      delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight
    }
  })
})
