import { Skeleton } from '../../../components/ui/skeleton'

/* What stands in for the totals and the rows while the list loads or fails:
 * the same lines, meter and rows as the content, as skeletons while loading
 * and as dashes on an empty track when the load failed. */

const dash = <span className="text-fg-subtle">—</span>

/** The totals' place: the amount, the overall meter and the rate and time left. */
function SummaryPlaceholder({ loading }: { loading: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="font-sans text-2xl leading-none font-medium tracking-tight">{loading ? <Skeleton className="h-6 w-44" /> : dash}</div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-ui-sm">{loading ? <Skeleton className="h-3.5 w-24" /> : dash}</div>
        {loading ? <Skeleton className="h-2 w-full rounded-full" /> : <div className="h-2 w-full rounded-full bg-well" />}
      </div>
      <div className="grid grid-cols-2 gap-2 text-ui">{[0, 1].map((i) => <div key={i} className="flex items-baseline gap-3">{loading ? <Skeleton className="h-4 w-24" /> : dash}</div>)}</div>
    </div>
  )
}

/** The rows' place: a disc, a name, a bar and a figure line each, parted by hairlines. */
function RowsPlaceholder({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} aria-hidden className="flex items-center gap-3 border-b border-line-subtle py-4">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Skeleton className="size-control-sm rounded-full" />
            <Skeleton className="size-control-sm rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export { RowsPlaceholder, SummaryPlaceholder }
