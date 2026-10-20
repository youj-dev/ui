import type * as PageTree from 'fumadocs-core/page-tree'
import { loader, type LoaderPlugin } from 'fumadocs-core/source'
import { statusBadgesPlugin } from 'fumadocs-core/source/plugins/status-badges'
import { docs } from '@/.source/server'

/** A page's `sidebarTitle` names it in the tree, so a section's index reads "Overview" there and keeps its own title on the page. */
const sidebarTitles: LoaderPlugin = {
  name: 'youj:sidebar-titles',
  transformPageTree: {
    file(node, filePath) {
      const file = filePath ? this.storage.read(filePath) : undefined
      if (file?.format === 'page' && 'sidebarTitle' in file.data && typeof file.data.sidebarTitle === 'string') node.name = file.data.sidebarTitle
      return node
    },
  },
}

/** Within each run between headings, standalone pages first and the sections with pages of their own after, in
 * their order: the sidebar reads tick, tick, tick, then chevron, chevron, and Previous and Next follow it. */
function pagesFirst<T extends PageTree.Node>(children: T[]): T[] {
  const out: T[] = []
  let run: T[] = []
  const flush = () => {
    out.push(...run.filter((node) => node.type !== 'folder'), ...run.filter((node) => node.type === 'folder'))
    run = []
  }
  for (const node of children) {
    if (node.type === 'separator') {
      flush()
      out.push(node)
    } else run.push(node)
  }
  flush()
  return out
}

const sectionsLast: LoaderPlugin = {
  name: 'youj:sections-last',
  transformPageTree: {
    folder: (node) => ({ ...node, children: pagesFirst(node.children) }),
    root: (node) => ({ ...node, children: pagesFirst(node.children) }),
  },
}

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [
    // Before the badges, which wrap the name they find.
    sidebarTitles,
    sectionsLast,
    statusBadgesPlugin({
      renderBadge: (status) => (
        <span data-status={status} className="sidebar-badge">
          {status}
        </span>
      ),
    }),
  ],
})
