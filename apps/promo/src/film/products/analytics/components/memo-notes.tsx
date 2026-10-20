import type { Week } from '../data'
import { FigureHead } from './figure-head'
import { Products } from './products'

/** The rest of the memo, under the evidence: products last week against this (Fig. 3), and what to watch next week. */
export function MemoNotes({ week }: { week: Week }) {
  return (
    <section aria-label="Products and what to watch" className="grid gap-x-14 gap-y-12 pt-10 lg:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
        <FigureHead
          number="Fig. 3"
          title="Products, last week to this"
          note={
            <>
              A ring for last week, a dot for this week. The <span className="text-fg">{week.products.length}</span> best sellers, by this week’s revenue.
            </>
          }
        />
        <Products products={week.products} />
      </div>
      <div className="flex flex-col gap-6 lg:col-span-5">
        <FigureHead number="Next week" title="What to watch" />
        <ol className="flex flex-col">
          {week.watch.map((item, i) => (
            <li key={item.title} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 border-b border-line py-4 first:pt-0 last:border-b-0">
              <span aria-hidden className="text-xl leading-snug font-semibold text-fg-subtle tabular-nums">
                {i + 1}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-lg leading-snug font-semibold text-fg">{item.title}</span>
                <span className="text-ui-lg leading-relaxed text-pretty text-fg-muted">{item.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
