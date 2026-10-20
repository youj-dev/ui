'use client'

import { useMemo } from 'react'
import { Counter } from '@youj/motion'
import { FolderIcon } from '@youj/icons'
import { TreeView, type TreeNode } from '../../../components/ui/tree-view'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import { useFileManager } from './context'
import { formatSize, MB, type FileManagerFolder, type FileManagerStorage } from './data'

/** Cells in the storage meter: each is 2.5 GB of the quota. */
const CELLS = 40

function Storage({ storage, quota }: { storage: FileManagerStorage[]; quota: number }) {
  const { copy } = useFileManager()
  const used = storage.reduce((s, x) => s + x.bytes, 0)
  // Each kind takes the cells its running total reaches, so the row reads as one meter cut by kind.
  const cells: FileManagerStorage['tone'][] = []
  let edge = 0
  for (const s of storage) {
    const from = Math.round((edge / quota) * CELLS)
    edge += s.bytes
    for (let cell = from; cell < Math.round((edge / quota) * CELLS); cell++) cells.push(s.tone)
  }
  return (
    <section aria-label={copy.storage} className="flex flex-col gap-2.5 border-t border-line p-4">
      <div className="flex items-baseline justify-between gap-2">
        <Eyebrow className="text-ui-sm font-medium text-fg">{copy.storage}</Eyebrow>
        <span className="font-mono text-ui-sm text-fg-muted tabular-nums">
          <Counter value={used / 1024 / MB} locale={copy.locale} format={{ maximumFractionDigits: 1 }} className="text-fg" />{' '}
          {copy.storageOf((quota / 1024 / MB).toLocaleString(copy.locale, { maximumFractionDigits: 1 }))}
        </span>
      </div>
      <div role="img" aria-label={storage.map((s) => `${s.label} ${formatSize(s.bytes, copy.locale)}`).join(', ')} className="flex h-2.5 gap-0.75">
        {Array.from({ length: CELLS }, (_, i) => (
          <span key={i} className={cn('h-full min-w-0 flex-1 rounded-[2px]', cells[i] ?? 'bg-well')} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-ui-xs text-fg-muted">
        {storage.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span aria-hidden className={cn('size-1.5 rounded-full', s.tone)} />
            {s.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

// Leaf folders would otherwise take the tree's file icon.
const folderIcon = <FolderIcon size={16} className="shrink-0 text-fg-muted" />
const toNodes = (folders: FileManagerFolder[]): TreeNode[] =>
  folders.map((f) => (f.children?.length ? { id: f.id, name: f.name, children: toNodes(f.children) } : { id: f.id, name: f.name, icon: folderIcon }))

export function FolderPane({
  folder,
  onFolder,
  folders,
  storage,
  quota,
}: {
  folder: string
  onFolder: (id: string) => void
  folders: FileManagerFolder[]
  storage: FileManagerStorage[]
  quota: number
}) {
  const { copy, path } = useFileManager()
  const nodes = useMemo(() => toNodes(folders), [folders])
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <TreeView
          aria-label={copy.folders}
          data={nodes}
          defaultExpanded={path(folder).slice(0, -1)}
          selected={[folder]}
          onSelectedChange={(ids) => ids[0] && onFolder(ids[0])}
        />
      </div>
      <Storage storage={storage} quota={quota} />
    </div>
  )
}
