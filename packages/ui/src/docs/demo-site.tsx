import { useRef, type ReactNode, type RefObject } from 'react'
import { cn } from '../lib/utils'

/* The site a navigation block's story is shown on: a quiet, wordless sketch
 * of a product's landing page (a headline, a product shot, a few bands), so
 * the eye goes to the navigation. It is its own scrolling page of a fixed
 * height, so a sticky bar sticks, condenses and hides inside a docs preview
 * as it would on a real page, and each band carries an id and a small label
 * for a scrollspy to follow. Stories and the docs only; it never ships with
 * a block. */

interface DemoSection {
  id: string
  label: string
}

interface DemoSiteProps {
  /** The navigation, given the page's scroll container. */
  children: (scroller: RefObject<HTMLDivElement | null>) => ReactNode
  /** The page's height in px. Default 760. */
  height?: number
  /** The bands under the hero, each with an id for in-page links. Default: Features, Pricing, Customers and Changelog. */
  sections?: DemoSection[]
  /** Leave room above the hero for a bar that floats over it. */
  overlap?: boolean
  /** What the page is: a product's landing page, a page of its documentation, or a shop's front page. Default `landing`. */
  page?: 'landing' | 'docs' | 'store'
  className?: string
}

const DEFAULT_SECTIONS: DemoSection[] = [
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'customers', label: 'Customers' },
  { id: 'changelog', label: 'Changelog' },
]

const ink = (n: number) => ({ backgroundColor: `color-mix(in oklab, var(--color-fg) ${n}%, transparent)` })
const Bar = ({ className, strength = 9, width }: { className?: string; strength?: number; width?: string }) => (
  <span aria-hidden className={cn('block rounded-full', className)} style={{ ...ink(strength), width }} />
)

function Hero({ overlap }: { overlap: boolean }) {
  return (
    <div aria-hidden className={cn('relative isolate overflow-hidden px-6 pb-16', overlap ? 'pt-32' : 'pt-20')}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <span className="inline-flex h-6 w-44 items-center rounded-full border border-line bg-surface" />
        <Bar className="mt-2 h-9 w-full max-w-xl" strength={16} />
        <Bar className="h-9 w-2/3 max-w-md" strength={16} />
        <Bar className="mt-3 h-3 w-full max-w-lg" />
        <Bar className="h-3 w-3/4 max-w-sm" />
        <div className="mt-5 flex gap-3">
          <span className="h-10 w-32 rounded-lg bg-fg" />
          <span className="h-10 w-28 rounded-lg border border-line bg-surface" />
        </div>
      </div>
      <div className="mx-auto mt-14 max-w-5xl rounded-2xl border border-line bg-surface p-2 shadow-lg">
        <div className="flex h-96 overflow-hidden rounded-xl border border-line bg-canvas">
          <div className="flex w-48 shrink-0 flex-col gap-3 border-e border-line p-4 max-md:hidden">
            {[70, 52, 64, 46, 58].map((w, i) => (
              <Bar key={i} className="h-2.5" width={`${w}%`} strength={i === 1 ? 18 : 9} />
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-4 p-6">
            <Bar className="h-4 w-40" strength={14} />
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex h-24 flex-col justify-end gap-2 rounded-lg border border-line bg-surface p-3">
                  <Bar className="h-4 w-14" strength={14} />
                  <Bar className="h-2 w-20" />
                </div>
              ))}
            </div>
            <div className="flex flex-1 items-end gap-2 rounded-lg border border-line bg-surface p-4">
              {[38, 52, 44, 66, 58, 74, 62, 84, 70, 92, 80, 96].map((h, i) => (
                <span key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, ...ink(i === 11 ? 22 : 10) }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Band({ section, index }: { section: DemoSection; index: number }) {
  return (
    <section id={section.id} aria-label={section.label} className="scroll-mt-24 border-t border-line px-6 py-20">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-ui-xs tracking-wide text-fg-subtle uppercase">{section.label}</span>
          <Bar className="h-6 w-80 max-w-full" strength={14} />
          <Bar className="h-3 w-96 max-w-full" />
        </div>
        <div className={cn('grid gap-4', index % 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
          {Array.from({ length: index % 2 ? 2 : 3 }, (_, i) => (
            <div key={i} aria-hidden className="flex h-40 flex-col justify-end gap-2 rounded-xl border border-line bg-surface p-5">
              <Bar className="h-4 w-24" strength={14} />
              <Bar className="h-2.5 w-40 max-w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** A documentation page: the section's tree, an article with a code sample and its contents. */
function DocsPage() {
  return (
    <div aria-hidden className="mx-auto flex max-w-7xl gap-10 px-6 py-10 md:px-8">
      <div className="flex w-52 shrink-0 flex-col gap-6 max-md:hidden">
        {[5, 4, 3].map((count, g) => (
          <div key={g} className="flex flex-col gap-3">
            <Bar className="h-2 w-16" strength={14} />
            {Array.from({ length: count }, (_, i) => (
              <Bar key={i} className={cn('h-2.5', g === 0 && i === 1 && 'ring-4 ring-hover')} width={`${[72, 56, 64, 48, 60][i]}%`} strength={g === 0 && i === 1 ? 22 : 9} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex gap-2">
          <Bar className="h-2 w-14" />
          <Bar className="h-2 w-20" />
        </div>
        <Bar className="h-8 w-3/5" strength={16} />
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-11/12" />
        <Bar className="h-3 w-4/5" />
        <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-5">
          {[44, 70, 58, 36, 64].map((w, i) => (
            <Bar key={i} className="h-2.5" width={`${w}%`} strength={i === 1 ? 18 : 10} />
          ))}
        </div>
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-2/3" />
        <Bar className="mt-4 h-5 w-2/5" strength={14} />
        <Bar className="h-3 w-full" />
        <Bar className="h-3 w-5/6" />
        <div className="h-28 rounded-xl border border-line bg-surface" />
      </div>
      <div className="flex w-44 shrink-0 flex-col gap-3 max-xl:hidden">
        <Bar className="h-2 w-20" strength={14} />
        {[80, 64, 72, 56].map((w) => (
          <Bar key={w} className="h-2" width={`${w}%`} />
        ))}
      </div>
    </div>
  )
}

/** A shop's front page: a campaign banner, then a grid of products. */
function StorePage() {
  return (
    <div aria-hidden className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-8 md:px-8">
      <div className="flex h-96 items-end overflow-hidden rounded-2xl border border-line bg-well p-8">
        <div className="flex flex-col gap-3">
          <Bar className="h-8 w-72" strength={18} />
          <Bar className="h-3 w-56" />
          <span className="mt-2 h-10 w-36 rounded-full bg-fg" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <Bar className="h-5 w-44" strength={14} />
        <Bar className="h-3 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-4/5 rounded-xl border border-line bg-surface" />
            <Bar className="h-3 w-3/4" strength={14} />
            <Bar className="h-2.5 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DemoSite({ children, height = 760, sections = DEFAULT_SECTIONS, overlap = false, page = 'landing', className }: DemoSiteProps) {
  const scroller = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={scroller}
      data-yj-demo=""
      className={cn('relative w-full overflow-y-auto overscroll-contain bg-canvas text-fg [scrollbar-width:none]', className)}
      style={{ height }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-120 bg-linear-to-b from-band to-transparent" />
      {children(scroller)}
      <main id="content" tabIndex={-1} className="relative outline-none">
        {page === 'docs' && <DocsPage />}
        {page === 'store' && <StorePage />}
        {page === 'landing' && <Hero overlap={overlap} />}
        {page === 'landing' && sections.map((section, i) => <Band key={section.id} section={section} index={i} />)}
        <footer aria-hidden className="border-t border-line px-6 py-12">
          <div className="mx-auto flex max-w-5xl justify-between gap-6">
            <Bar className="h-3 w-24" strength={14} />
            <div className="flex gap-6">
              {[48, 40, 56].map((w) => (
                <Bar key={w} className="h-2.5" width={`${w}px`} />
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export { DemoSite, type DemoSiteProps, type DemoSection }
