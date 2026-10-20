import Link from 'next/link'
import { Badge } from '@youj/react'
import { cn } from '@/lib/cn'

/* The explorer's two views, as links (each is a page of its own): the
 * gallery of shipped scenes, and the builder for new ones, experimental. Drawn as
 * the kit's pill tabs, a key in a well, and in sans, as
 * everything pressable on the site is. */

export type ExplorerView = 'gallery' | 'build'

const VIEWS: { id: ExplorerView; label: string; href: string; experimental?: boolean }[] = [
  { id: 'gallery', label: 'Gallery', href: '/illustrations' },
  { id: 'build', label: 'Build', href: '/illustrations/build', experimental: true },
]

export function ExplorerViews({ current, className }: { current: ExplorerView; className?: string }) {
  return (
    <nav aria-label="Views" className={cn('shrink-0', className)}>
      <ul className="flex h-control w-fit items-stretch gap-0.5 rounded-(--radius-control) bg-well p-[3px]">
        {VIEWS.map((view) => {
          const active = view.id === current
          return (
            <li key={view.id} className="flex">
              <Link
                prefetch={false}
                href={view.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[max(0px,calc(var(--radius-control)-3px))] px-3 text-[13px] font-medium whitespace-nowrap text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring',
                  active && 'bg-key text-fg shadow-[0_0_0_1px_var(--color-line-control),var(--shadow-xs-soft)] hover:text-fg',
                )}
              >
                {view.label}
                {view.experimental && (
                  <Badge variant="outline" size="sm" className="text-current">
                    Experimental
                  </Badge>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
