/* The demo's deploy, live: the storefront that lands on the terminal's
 * corner once the transcript is done. A picture: the terminal renders it
 * inert and hidden from assistive tech. Demo content — edit after adding. */

export function LiveSite() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 rounded-full bg-well" />
          ))}
        </span>
        <span className="mx-auto inline-flex min-w-0 items-center gap-1.5 rounded-full bg-band px-2 py-0.5 text-ui-xs text-fg-muted">
          <span className="size-1.5 shrink-0 rounded-full bg-success" />
          <span className="truncate">acme.shop</span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-3">
        <span className="flex items-center justify-between text-ui-xs">
          <span className="text-ui-sm font-semibold tracking-tight text-fg">acme</span>
          <span className="flex gap-2.5 text-fg-muted">
            <span>Shop</span>
            <span>Journal</span>
            <span>Bag (0)</span>
          </span>
        </span>
        <span className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-3">
          <span className="grid aspect-[4/5] place-items-center rounded-lg bg-well">
            <svg viewBox="0 0 64 72" className="w-1/2 overflow-visible" fill="none">
              <path d="M22 24c0-12 20-12 20 0" strokeWidth="2.5" strokeLinecap="round" className="stroke-fg-subtle" />
              <rect x="10" y="22" width="44" height="46" rx="5" strokeWidth="1.5" className="fill-surface stroke-line-strong" />
            </svg>
          </span>
          <span className="flex flex-col justify-center gap-1.5">
            <span className="text-ui-xs text-fg-muted">New in</span>
            <span className="text-ui-sm leading-tight font-semibold text-fg">Linen tote</span>
            <span className="text-ui-xs text-fg-muted tabular-nums">$24.00</span>
            <span className="mt-1 inline-flex h-6 items-center justify-center rounded-md bg-accent px-2 text-ui-xs font-medium text-on-accent">Add to bag</span>
          </span>
        </span>
      </div>
    </div>
  )
}
