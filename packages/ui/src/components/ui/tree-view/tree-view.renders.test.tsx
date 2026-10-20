import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TreeView, type TreeNode } from './index'

const files = vi.hoisted(() => ({ renders: 0 }))
vi.mock('./tree-view-icons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./tree-view-icons')>()
  return {
    ...actual,
    TreeFileIcon: (props: { name: string }) => {
      files.renders++
      return createElement(actual.TreeFileIcon, props)
    },
  }
})

const DATA: TreeNode[] = Array.from({ length: 4 }, (_, f) => ({
  id: `f${f}`,
  name: `Folder ${f}`,
  children: Array.from({ length: 20 }, (_, i) => ({ id: `f${f}-${i}`, name: `File ${f}-${i}.ts` })),
}))

describe('TreeView renders', () => {
  test('moving focus between rows re-renders only the two rows whose tab stop changes', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <TreeView aria-label="Files" data={DATA} defaultExpanded={DATA.map((d) => d.id)} />
      </YoujProvider>,
    )
    screen.getByRole('treeitem', { name: 'Folder 0' }).focus()
    files.renders = 0
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('treeitem', { name: 'File 0-2.ts' })).toHaveFocus()
    expect(screen.getByRole('treeitem', { name: 'File 0-2.ts' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('treeitem', { name: 'Folder 0' })).toHaveAttribute('tabindex', '-1')
    // The folder is not a file; only the file rows entering and leaving the stop render their icon.
    expect(files.renders).toBeLessThanOrEqual(3 * 2)
  })
})
