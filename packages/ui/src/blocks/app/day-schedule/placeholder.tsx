import type { ReactNode } from 'react'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'

/* What stands in for the day while there are no jobs to draw: the ring's own
 * guides, the readout's rows and the list's room, at the size the real ones
 * take, so the card doesn't change height. Loading fills the figures with
 * skeletons; an error or an empty list leaves dashes and puts its message in
 * the list's room. */

/** The dial's face: the 24-hour ring and the middle circle, dashed, with the hand's hub while loading. */
export function RingPlaceholder({ loading, label }: { loading: boolean; label: string }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-68">
      {loading && <span className="sr-only">{label}</span>}
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
        {[46, 30].map((r) => (
          <circle key={r} cx={50} cy={50} r={r} fill="none" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" className="stroke-line-strong" />
        ))}
      </svg>
      {loading && <Skeleton className="absolute top-1/2 left-1/2 size-[8%] -translate-1/2 rounded-full" />}
    </div>
  )
}

/** The readout's rows: their labels, with a skeleton or a dash for the value. */
export function ReadoutPlaceholder({ labels, loading }: { labels: string[]; loading: boolean }) {
  return (
    <dl className="flex min-w-0 flex-col">
      {labels.map((label) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
          <Eyebrow render={<dt />}>{label}</Eyebrow>
          <dd className="font-mono text-ui-lg">{loading ? <Skeleton className="h-5 w-14" /> : <span className="text-fg-subtle">—</span>}</dd>
        </div>
      ))}
    </dl>
  )
}

/** The list's room (the real one scrolls at 18rem): job rows as skeletons while loading, otherwise the message. */
export function ListPlaceholder({ loading, children }: { loading: boolean; children?: ReactNode }) {
  return (
    <div className="-my-1 grid h-72 overflow-hidden">
      {loading ? (
        <ul aria-hidden className="flex flex-col">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-x-3 border-b border-line py-3 last:border-b-0 sm:gap-x-4">
              <Skeleton className="mt-2 size-2.5 rounded-xs" />
              <div className="flex min-w-0 flex-col gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48 max-w-full" />
              </div>
              <Skeleton className="h-6 w-12" />
              <Skeleton className="mt-0.5 h-5 w-9 rounded-full" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid place-items-center">{children}</div>
      )}
    </div>
  )
}
