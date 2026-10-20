import type { Metadata } from 'next'
import { loaderCategories, loaderEntries } from '@/components/loaders/entries'
import { LOADER_LINK_SCRIPT } from '@/components/loaders/query'
import { LoaderShowroom } from '@/components/loaders/showroom'
import { componentDoc } from '@/lib/props'
import { InlineScript } from '@/components/inline-script'

export const metadata: Metadata = {
  title: 'Loaders',
  description:
    'Every Youj loader, live in the interface it belongs in: a deploy card, an upload panel, an assistant’s reply, a dashboard, a splash screen. Set its size, loop, colors and label, then copy the install command or the code.',
}

export default function LoadersPage() {
  return (
    <main id="main" tabIndex={-1} className="min-h-0 flex-1 outline-none">
      <InlineScript code={LOADER_LINK_SCRIPT} />
      <LoaderShowroom loaders={loaderEntries()} categories={loaderCategories()} props={componentDoc('LoaderProps')} />
    </main>
  )
}
