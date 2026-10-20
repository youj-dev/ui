import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * The head of a site page (Changelog, FAQ, About) on the landing's
 * construction frame: where it sits (Home, then the page's name, as
 * breadcrumbs), the title at display size, a lede, and actions under it. A
 * blueprint grid fades in from the inline end, where the frame has room for it.
 */
export function PageHero({ label, title, lede, children }: { label: string; title: ReactNode; lede: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="blueprint absolute inset-0 -z-10 [mask-image:linear-gradient(to_left,black,transparent_55%)] rtl:[mask-image:linear-gradient(to_right,black,transparent_55%)]"
      />
      <div className="gutter pt-16 pb-14 md:pt-24 md:pb-20">
        <nav aria-label="Breadcrumb" className="crumbs">
          <ol className="flex items-center gap-2">
            <li>
              <Link prefetch={false} href="/" className="rounded-sm transition-colors duration-(--yj-duration-fast) ease-standard focus-ring">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-fg-subtle">
              /
            </li>
            <li aria-current="page">{label}</li>
          </ol>
        </nav>
        <h1 className="type-display-l mt-4 max-w-[18ch] text-fg">{title}</h1>
        <div className="type-lede mt-5 max-w-[40rem]">{lede}</div>
        {children && <div className="mt-8 flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </header>
  )
}
