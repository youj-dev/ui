import { Suspense } from 'react'
import type { Metadata } from 'next'
import { CreateStudio, StudioFallback } from '@/components/create/create-studio'

export const metadata: Metadata = {
  title: 'Create',
  description: 'Build an app frame from Youj blocks (sidebar, top bar, account and search), add screens from the Screens catalog, give it your theme, and take it home as code.',
}

/* The studio reads its state from the URL, so it renders in the browser; the
 * server sends its header and an empty frame in the same places. */
export default function CreatePage() {
  return (
    // Named: the preview's frame holds a <main> of its own.
    <main id="main" tabIndex={-1} aria-label="Create" className="flex flex-1 flex-col outline-none">
      <Suspense fallback={<StudioFallback />}>
        <CreateStudio />
      </Suspense>
    </main>
  )
}
