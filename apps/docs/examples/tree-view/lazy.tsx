'use client'

import { useRef, useState } from 'react'
import { TreeView, type TreeNode } from '@youj/react'

function withChildren(nodes: TreeNode[], id: string, children: TreeNode[]): TreeNode[] {
  return nodes.map((n) => (n.id === id ? { ...n, children } : n.children ? { ...n, children: withChildren(n.children, id, children) } : n))
}

/* `packages` loads on first open. `flaky` fails the first time and leaves a
 * retry row; Enter on it tries again, and the second try succeeds. */
export default function LazyTree() {
  const [data, setData] = useState<TreeNode[]>([
    { id: 'packages', name: 'packages', hasChildren: true },
    { id: 'flaky', name: 'flaky', hasChildren: true },
  ])
  const failed = useRef(false)

  const load = (node: TreeNode) =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        if (node.id === 'flaky' && !failed.current) {
          failed.current = true
          reject(new Error('Offline'))
          return
        }
        const children = ['motion', 'ui', 'icons'].map((name) => ({ id: `${node.id}/${name}`, name, hasChildren: true }))
        setData((d) => withChildren(d, node.id, children))
        resolve(null)
      }, 1100),
    )

  return (
    <div className="w-full max-w-xs rounded-xl border border-line bg-surface p-2">
      <TreeView aria-label="Repository" data={data} loadChildren={load} />
    </div>
  )
}
