import type * as PageTree from 'fumadocs-core/page-tree'

/* The docs tree is fetched the first time the menu is wanted (/docs-tree.json,
 * app/docs-tree.json), not carried by every page: a pointer, touch or focus
 * on the menu's button starts it along with the menu's own code
 * (mobile-menu-lazy.tsx), so it's usually here by the time the sheet is up. */
let treeRequest: Promise<PageTree.Root> | undefined
export function loadTree(): Promise<PageTree.Root> {
  treeRequest ??= fetch('/docs-tree.json').then((res) => {
    if (!res.ok) throw new Error(`/docs-tree.json: ${res.status}`)
    return res.json() as Promise<PageTree.Root>
  })
  treeRequest.catch(() => (treeRequest = undefined))
  return treeRequest
}
