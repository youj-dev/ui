import type { Metadata } from 'next'
import { CreateView } from '@/components/create/create-view'

/* The bare frame behind Create's preview. The header hides itself on
 * /view, so the page is the frame alone; the frame brings its own <main>. */
export default function View() {
  return (
    <div id="main" data-frame-view="" className="flex flex-1 flex-col">
      <CreateView />
    </div>
  )
}

// A frame, not a destination: keep it out of search results.
export const metadata: Metadata = { title: 'Create preview', robots: { index: false } }
