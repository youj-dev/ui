import { useMemo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CopyIcon, FilePlusIcon, PencilIcon, TrashIcon, XIcon } from '@youj/icons'
import { ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut } from '../context-menu'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../resizable'
import { ScrollArea } from '../scroll-area'
import { TreeFileIcon, TreeView, type TreeNode } from './index'

const meta: Meta<typeof TreeView> = {
  title: 'UI/Display/Tree view',
  component: TreeView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A WAI-ARIA tree with one Tab stop: ↑ ↓ move, → opens or steps in, ← closes or steps out, Home / End, * opens every sibling, typing jumps to a matching name, Enter activates, Space selects or checks, F2 renames, Shift+F10 opens the context menu. Branches open with motion\'s Collapse while the chevron turns and the folder tips open; reduced motion is instant. `selectionMode="multiple"` is a checkbox tree with tri-state branches. Lazy branches load on first open with a spinner row and leave a retry row on failure, and loads are announced. `virtual` windows the rows with TanStack Virtual for trees of thousands of items.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TreeView>

const dir = (id: string, children: TreeNode[], extra: Partial<TreeNode> = {}): TreeNode => ({ id, name: id.split('/').pop()!, children, ...extra })
const file = (id: string, extra: Partial<TreeNode> = {}): TreeNode => ({ id, name: id.split('/').pop()!, ...extra })
const modified = { meta: 'M', description: 'modified' }
const untracked = { meta: 'U', description: 'untracked' }

const PROJECT: TreeNode[] = [
  dir('src', [
    dir('src/components', [
      dir('src/components/board', [file('src/components/board/board.tsx', modified), file('src/components/board/column.tsx'), file('src/components/board/card.tsx', untracked)]),
      file('src/components/sidebar.tsx'),
      file('src/components/editor.tsx'),
    ]),
    dir('src/hooks', [file('src/hooks/use-sprint.ts'), file('src/hooks/use-keyboard.ts')]),
    dir('src/styles', [file('src/styles/app.css')]),
    file('src/app.tsx', modified),
    file('src/main.tsx'),
  ]),
  dir('public', [file('public/logo.svg'), file('public/og.png')]),
  dir('scripts', [file('scripts/deploy.sh')]),
  { id: 'node_modules', name: 'node_modules', hasChildren: true },
  file('package.json'),
  file('tsconfig.json'),
  file('README.md'),
]

const SOURCE: Record<string, string> = {
  'src/app.tsx': `import { Board } from './components/board/board'\nimport { useSprint } from './hooks/use-sprint'\n\nexport function App() {\n  const sprint = useSprint('SPR-24')\n  return <Board sprint={sprint} />\n}`,
  'src/components/board/board.tsx': `export function Board({ sprint }: BoardProps) {\n  return (\n    <Kanban\n      columns={sprint.columns}\n      cards={sprint.cards}\n      onMove={(move) => sprint.move(move)}\n    />\n  )\n}`,
  'package.json': `{\n  "name": "sprint-board",\n  "private": true,\n  "scripts": { "dev": "vite", "build": "vite build" }\n}`,
}

function rename(nodes: TreeNode[], id: string, name: string): TreeNode[] {
  return nodes.map((n) => (n.id === id ? { ...n, name } : n.children ? { ...n, children: rename(n.children, id, name) } : n))
}
function remove(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes.filter((n) => n.id !== id).map((n) => (n.children ? { ...n, children: remove(n.children, id) } : n))
}
function setChildren(nodes: TreeNode[], id: string, children: TreeNode[]): TreeNode[] {
  return nodes.map((n) => (n.id === id ? { ...n, children } : n.children ? { ...n, children: setChildren(n.children, id, children) } : n))
}
const findNode = (nodes: TreeNode[], id: string): TreeNode | undefined => {
  for (const n of nodes) {
    if (n.id === id) return n
    const hit = n.children && findNode(n.children, id)
    if (hit) return hit
  }
}

function Explorer() {
  const [data, setData] = useState(PROJECT)
  const [open, setOpen] = useState<string[]>(['src/app.tsx', 'src/components/board/board.tsx'])
  const [active, setActive] = useState('src/app.tsx')
  const openFile = (node: TreeNode) => {
    setOpen((o) => (o.includes(node.id) ? o : [...o, node.id]))
    setActive(node.id)
  }
  const code = SOURCE[active] ?? `// ${findNode(data, active)?.name ?? active}\n`
  return (
    <div className="h-[600px] w-full bg-canvas p-4 sm:p-6">
      <div className="h-full overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="explorer" defaultSize="28%" minSize="12rem" maxSize="45%" className="flex flex-col bg-transparent">
            <div className="flex h-9 shrink-0 items-center px-3 text-ui-xs font-medium tracking-wide text-fg-muted uppercase">sprint-board</div>
            <ScrollArea className="min-h-0 flex-1">
              <TreeView
                aria-label="Files"
                data={data}
                defaultExpanded={['src', 'src/components', 'src/components/board']}
                selected={[active]}
                onSelectedChange={([id]) => id && findNode(data, id)?.children === undefined && !findNode(data, id)?.hasChildren && openFile(findNode(data, id)!)}
                onAction={openFile}
                loadChildren={(node) =>
                  new Promise((resolve) =>
                    setTimeout(() => {
                      setData((d) => setChildren(d, node.id, ['react', 'motion', 'vite', '@base-ui'].map((pkg) => ({ id: `${node.id}/${pkg}`, name: pkg, children: [file(`${node.id}/${pkg}/package.json`)] }))))
                      resolve(null)
                    }, 900),
                  )
                }
                onRename={(node, name) => setData((d) => rename(d, node.id, name))}
                contextMenu={(node, { rename: startRename }) => (
                  <>
                    <ContextMenuItem onClick={() => openFile(node)} disabled={node.children !== undefined || node.hasChildren}>
                      <FilePlusIcon /> Open
                    </ContextMenuItem>
                    <ContextMenuItem onClick={startRename}>
                      <PencilIcon /> Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => navigator.clipboard?.writeText(node.id)}>
                      <CopyIcon /> Copy path
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem variant="danger" onClick={() => setData((d) => remove(d, node.id))}>
                      <TrashIcon /> Delete
                    </ContextMenuItem>
                  </>
                )}
                className="px-1.5 pb-2"
              />
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle aria-label="Resize explorer" />
          <ResizablePanel id="editor" minSize="30%">
            <div className="flex h-full min-w-0 flex-col">
              <div role="tablist" aria-label="Open files" className="flex h-9 shrink-0 items-end gap-px overflow-x-auto border-b border-line bg-transparent ps-2">
                {open.map((id) => {
                  const name = findNode(data, id)?.name ?? id
                  const current = id === active
                  const close = () => setOpen((o) => o.filter((x) => x !== id))
                  // The close button sits beside the tab, not inside it (no nested controls), as a
                  // pointer shortcut; from the keyboard, Delete closes the focused tab.
                  return (
                    <div
                      key={id}
                      role="presentation"
                      className={
                        current
                          ? 'flex h-8 shrink-0 items-center gap-1.5 rounded-t-md border border-b-0 border-line bg-canvas px-2.5 text-ui-sm text-fg focus-ring-within'
                          : 'flex h-8 shrink-0 cursor-default items-center gap-1.5 px-2.5 text-ui-sm text-fg-muted hover:text-fg focus-ring-within'
                      }
                    >
                      <div
                        role="tab"
                        tabIndex={current ? 0 : -1}
                        aria-selected={current}
                        aria-keyshortcuts="Delete"
                        onClick={() => setActive(id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Delete' || e.key === 'Backspace') close()
                        }}
                        className="flex h-full items-center gap-1.5 outline-none"
                      >
                        <TreeFileIcon name={name} className="size-3.5" />
                        {name}
                      </div>
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-hidden
                        className="grid place-items-center text-fg-muted outline-none hover:text-fg"
                        onClick={close}
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
              <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-ui-sm leading-6 text-fg">
                {code.split('\n').map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="w-5 shrink-0 text-end text-fg-subtle tabular-nums select-none">{i + 1}</span>
                    <span className="whitespace-pre">{line || ' '}</span>
                  </div>
                ))}
              </pre>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

/** A file explorer beside an editor, in Resizable panels. Click or Enter opens a file; right-click or Shift+F10 for the menu; F2 renames; `node_modules` loads lazily. */
export const Hero: Story = { render: () => <Explorer /> }

const SYNC: TreeNode[] = [
  dir('Workspace', [
    dir('Workspace/Design', [file('Workspace/Design/Brand.fig'), file('Workspace/Design/Icons.fig'), file('Workspace/Design/Motion.fig')]),
    dir('Workspace/Docs', [file('Workspace/Docs/Roadmap.md'), file('Workspace/Docs/Handbook.md')]),
    dir('Workspace/Media', [file('Workspace/Media/launch.png'), file('Workspace/Media/teaser.webp')]),
  ]),
  dir('Archive', [file('Archive/2024.txt'), file('Archive/2025.txt', { disabled: true, description: 'locked' })]),
]

/** A checkbox tree: checking a folder checks everything loaded inside it, and folders show mixed when only some of their contents are chosen. */
export const MultipleSelection: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(['Workspace/Design/Brand.fig', 'Workspace/Docs', 'Workspace/Docs/Roadmap.md', 'Workspace/Docs/Handbook.md'])
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6">
        <div className="w-80 rounded-xl border border-line bg-surface p-2 shadow-sm">
          <p className="px-2 pt-1 pb-2 text-ui font-medium text-fg">Choose folders to sync</p>
          <TreeView aria-label="Folders to sync" data={SYNC} selectionMode="multiple" selected={selected} onSelectedChange={setSelected} defaultExpanded={['Workspace', 'Workspace/Design']} />
          <p className="px-2 pt-2 text-ui-sm text-fg-muted">{selected.filter((id) => !findNode(SYNC, id)?.children).length} files selected</p>
        </div>
      </div>
    )
  },
}

/** Lazy branches: `packages` loads on first open with a spinner row; `broken` fails and leaves a retry row (Enter retries, and it succeeds the second time). */
export const LazyLoading: Story = {
  render: function Render() {
    const [data, setData] = useState<TreeNode[]>([
      { id: 'packages', name: 'packages', hasChildren: true },
      { id: 'broken', name: 'broken', hasChildren: true },
    ])
    const [tries, setTries] = useState(0)
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6">
        <div className="w-72 rounded-xl border border-line bg-surface p-2 shadow-sm">
          <TreeView
            aria-label="Repository"
            data={data}
            loadChildren={(node) =>
              new Promise((resolve, reject) =>
                setTimeout(() => {
                  if (node.id === 'broken' && tries === 0) {
                    setTries(1)
                    reject(new Error('offline'))
                    return
                  }
                  setData((d) => setChildren(d, node.id, ['motion', 'ui', 'icons'].map((n) => ({ id: `${node.id}/${n}`, name: n, hasChildren: true }))))
                  resolve(null)
                }, 1100),
              )
            }
          />
        </div>
      </div>
    )
  },
}

/** Ten thousand items, windowed: only the rows in view are in the DOM, and keyboard focus scrolls the one it lands on into view. */
export const Virtualized: Story = {
  render: function Render() {
    const data = useMemo(
      () =>
        Array.from({ length: 100 }, (_, i) =>
          dir(
            `dir-${i}`,
            Array.from({ length: 100 }, (_, j) => file(`dir-${i}/file-${String(j).padStart(3, '0')}.ts`)),
          ),
        ),
      [],
    )
    const expanded = useMemo(() => data.map((d) => d.id), [data])
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-6">
        <div className="w-80 rounded-xl border border-line bg-surface p-1.5 shadow-sm">
          <TreeView aria-label="Generated files" data={data} defaultExpanded={expanded} virtual className="h-[420px]" />
        </div>
      </div>
    )
  },
}
