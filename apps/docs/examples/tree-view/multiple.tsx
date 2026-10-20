'use client'

import { useState } from 'react'
import { TreeView, type TreeNode } from '@youj/react'

const dir = (id: string, children: TreeNode[]): TreeNode => ({ id, name: id.split('/').pop()!, children })
const file = (id: string, extra: Partial<TreeNode> = {}): TreeNode => ({ id, name: id.split('/').pop()!, ...extra })

const FOLDERS: TreeNode[] = [
  dir('Workspace', [
    dir('Workspace/Design', [file('Workspace/Design/Brand.fig'), file('Workspace/Design/Icons.fig'), file('Workspace/Design/Motion.fig')]),
    dir('Workspace/Docs', [file('Workspace/Docs/Roadmap.md'), file('Workspace/Docs/Handbook.md')]),
  ]),
  dir('Archive', [file('Archive/2024.txt'), file('Archive/2025.txt', { disabled: true, description: 'locked' })]),
]

const isFile = (id: string) => /\.\w+$/.test(id)

export default function SyncPicker() {
  const [selected, setSelected] = useState<string[]>(['Workspace/Design/Brand.fig', 'Workspace/Docs', 'Workspace/Docs/Roadmap.md', 'Workspace/Docs/Handbook.md'])
  const files = selected.filter(isFile).length
  return (
    <div className="w-full max-w-xs rounded-xl border border-line bg-surface p-2">
      <p className="px-2 pt-1 pb-2 text-ui font-medium text-fg">Choose folders to sync</p>
      <TreeView
        aria-label="Folders to sync"
        data={FOLDERS}
        selectionMode="multiple"
        selected={selected}
        onSelectedChange={setSelected}
        defaultExpanded={['Workspace', 'Workspace/Design']}
      />
      <p className="px-2 pt-2 text-ui-sm text-fg-muted tabular-nums">
        {files} {files === 1 ? 'file' : 'files'} selected
      </p>
    </div>
  )
}
