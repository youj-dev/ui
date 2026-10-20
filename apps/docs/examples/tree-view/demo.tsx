'use client'

import { useState } from 'react'
import { Copy, FilePlus, Pencil, Trash2 } from 'lucide-react'
import { ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, TreeFileIcon, TreeView, type TreeNode } from '@youj/react'

const dir = (id: string, children: TreeNode[]): TreeNode => ({ id, name: id.split('/').pop()!, children })
const file = (id: string, extra: Partial<TreeNode> = {}): TreeNode => ({ id, name: id.split('/').pop()!, ...extra })
const modified = { meta: 'M', description: 'modified' }

const PROJECT: TreeNode[] = [
  dir('src', [
    dir('src/components', [
      dir('src/components/board', [file('src/components/board/board.tsx', modified), file('src/components/board/column.tsx'), file('src/components/board/card.tsx')]),
      file('src/components/sidebar.tsx'),
    ]),
    dir('src/hooks', [file('src/hooks/use-sprint.ts'), file('src/hooks/use-keyboard.ts')]),
    file('src/app.tsx', modified),
    file('src/main.tsx'),
  ]),
  dir('public', [file('public/logo.svg'), file('public/og.png')]),
  // A lazy branch: its children load on first open.
  { id: 'node_modules', name: 'node_modules', hasChildren: true },
  file('package.json'),
  file('README.md'),
]

function update(nodes: TreeNode[], id: string, change: (node: TreeNode) => TreeNode | null): TreeNode[] {
  return nodes.flatMap((node) => {
    if (node.id === id) {
      const next = change(node)
      return next ? [next] : []
    }
    return node.children ? [{ ...node, children: update(node.children, id, change) }] : [node]
  })
}

export default function FileExplorer() {
  const [data, setData] = useState(PROJECT)
  const [opened, setOpened] = useState<TreeNode | null>(null)

  return (
    <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-line bg-surface sm:flex-row">
      <TreeView
        aria-label="Files"
        data={data}
        defaultExpanded={['src', 'src/components', 'src/components/board']}
        defaultSelected={['src/app.tsx']}
        onAction={setOpened}
        loadChildren={(node) =>
          new Promise((resolve) =>
            setTimeout(() => {
              const packages = ['react', 'motion', '@base-ui'].map((pkg) => dir(`${node.id}/${pkg}`, [file(`${node.id}/${pkg}/package.json`)]))
              setData((d) => update(d, node.id, (n) => ({ ...n, children: packages })))
              resolve(null)
            }, 900),
          )
        }
        onRename={(node, name) => setData((d) => update(d, node.id, (n) => ({ ...n, name })))}
        contextMenu={(node, { rename }) => (
          <>
            <ContextMenuItem onClick={() => setOpened(node)} disabled={node.children !== undefined || node.hasChildren}>
              <FilePlus /> Open
            </ContextMenuItem>
            <ContextMenuItem onClick={rename}>
              <Pencil /> Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigator.clipboard?.writeText(node.id)}>
              <Copy /> Copy path
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="danger" onClick={() => setData((d) => update(d, node.id, () => null))}>
              <Trash2 /> Delete
            </ContextMenuItem>
          </>
        )}
        className="shrink-0 border-b border-line p-1.5 sm:w-56 sm:border-e sm:border-b-0"
      />
      <div className="grid min-w-0 flex-1 place-items-center p-4 text-center text-ui-sm text-fg-muted">
        {opened ? (
          <span className="flex items-center gap-2 text-fg">
            <TreeFileIcon name={opened.name} />
            {opened.id}
          </span>
        ) : (
          'Double-click a file, or press Enter, to open it.'
        )}
      </div>
    </div>
  )
}
