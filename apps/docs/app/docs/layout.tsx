import type { ReactNode } from 'react'
import { DocsSidebar } from '@/components/docs/docs-sidebar'
import { PendingPage } from '@/components/docs/pending-page'
import { source } from '@/lib/source'
import { navTree } from '@/lib/tree'

/* The docs shell: the tree in a sticky sidebar beside the page. The header
 * lives in the root layout, so it (and the sidebar) stay put while pages
 * change; below the desktop layout the tree moves into the header's menu.
 * The frame grows to --docs-width with the sidebar on its start edge, and a
 * page's column stays centered in the room beside it (styles/site.css). */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-(--docs-width) flex-1 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside
        aria-label="Docs sidebar"
        data-yj-tone="chrome"
        className="sticky top-(--header-height) hidden h-[calc(100dvh-var(--header-height))] bg-chrome lg:block"
      >
        <DocsSidebar tree={navTree(source.getPageTree())} />
      </aside>
      {/* The skip link lands here; the sidebar stays outside the main landmark. */}
      <main id="main" tabIndex={-1} className="min-w-0 outline-none">
        <PendingPage>{children}</PendingPage>
      </main>
    </div>
  )
}
