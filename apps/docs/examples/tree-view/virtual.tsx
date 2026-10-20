'use client'

import { useMemo } from 'react'
import { TreeView, type TreeNode } from '@youj/react'

export default function VirtualTree() {
  // 100 folders of 100 files: ten thousand rows, only the ones in view rendered.
  const data = useMemo<TreeNode[]>(
    () =>
      Array.from({ length: 100 }, (_, i) => ({
        id: `dir-${i}`,
        name: `dir-${i}`,
        children: Array.from({ length: 100 }, (_, j) => {
          const name = `file-${String(j).padStart(3, '0')}.ts`
          return { id: `dir-${i}/${name}`, name }
        }),
      })),
    [],
  )
  const expanded = useMemo(() => data.map((d) => d.id), [data])

  return (
    <div className="w-full max-w-xs rounded-xl border border-line bg-surface p-1.5">
      <TreeView aria-label="Generated files" data={data} defaultExpanded={expanded} virtual className="h-80" />
    </div>
  )
}
