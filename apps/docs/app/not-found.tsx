import type { Metadata } from 'next'
import { NotFoundCode } from '@/components/not-found-code'
import { NotFoundSearch } from '@/components/site/not-found-search'
import { ButtonLink } from '@/components/ui/button-link'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <main id="main" className="relative isolate flex flex-1 items-center justify-center px-6 py-24">
      <div aria-hidden className="blueprint absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_45%_45%_at_50%_50%,black,transparent)]" />
      <div className="w-full max-w-md text-center">
        <NotFoundCode />
        <h1 className="type-display-l mt-4 text-fg">Page not found</h1>
        <p className="type-lede mt-4">There’s nothing at this address. Search for it, or start from the docs.</p>
        <div className="mt-8">
          <NotFoundSearch />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/docs" size="lg">
            Browse the docs
          </ButtonLink>
          <ButtonLink href="/" size="lg" variant="outline">
            Home
          </ButtonLink>
        </div>
      </div>
    </main>
  )
}
