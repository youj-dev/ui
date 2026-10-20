import type { CSSProperties } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { cn } from '@youj/react/lib/utils'
import type { Product } from '../data'
import { short, signed, usd } from '../format'
import { Num } from './num'
import { scaleFor, ScaleGrid } from './scale'

/* Fig. 3, the products: each one a dumbbell, a ring at last week and a dot
 * at this week, the line between them in the ink of the change. The dots
 * slide when the week changes (transform only, so nothing reflows) and the
 * rows re-rank in place. */

// Wide: name, dumbbell, figure on one line. On a phone the dumbbell runs the full width under the name and figure.
const COLUMNS = 'md:grid-cols-[minmax(0,10fr)_minmax(0,13fr)_4.5rem] md:gap-x-4'
// Slides along the track by a share of its width; --dir flips it under RTL.
const SLIDE = 'absolute inset-0 transition-transform yj-duration-deliberate ease-emphasized'

export function Products({ products }: { products: Product[] }) {
  // Positions, not lengths, so the scale needn't start at zero: only a product with nothing last week pins it there.
  const values = products.flatMap((p) => [p.last, p.now])
  const scale = scaleFor(values, 10_000, 1_000, Math.min(...values) === 0 ? 0 : undefined)
  const sorted = [...products].sort((a, b) => b.now - a.now)
  return (
    <div className="relative flex flex-col [--dir:1] rtl:[--dir:-1]">
      <ScaleGrid scale={scale} row={cn('grid grid-cols-[0_minmax(0,1fr)_0]', COLUMNS)} />
      <PresenceList as="ul" aria-label="Revenue by product, last week and this week" className="flex flex-col">
        {sorted.map((p) => {
          const up = p.now >= p.last
          const fresh = p.last === 0
          return (
            <PresenceItem key={p.id} className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line py-2.5 last:border-b-0', COLUMNS)}>
              <span className="flex min-w-0 items-baseline gap-2 max-md:col-start-1 max-md:row-start-1">
                <span className="truncate text-ui-lg text-fg">{p.name}</span>
                {fresh && <span className="shrink-0 text-ui-xs font-medium tracking-[0.1em] text-accent-text uppercase">New</span>}
              </span>
              <span
                role="img"
                aria-label={`${p.name}: ${fresh ? 'new this week' : `${usd.format(p.last)} last week`}, ${usd.format(p.now)} this week`}
                className="relative block h-4 max-md:col-span-2 max-md:row-start-2"
                style={{ '--from': scale.at(Math.min(p.last, p.now)), '--span': Math.abs(scale.at(p.now) - scale.at(p.last)), '--last': scale.at(p.last), '--now': scale.at(p.now) } as CSSProperties}
              >
                <span
                  className={cn(SLIDE, 'inset-y-auto top-1/2 h-0.5 -translate-y-1/2 origin-left rtl:origin-right', up ? 'bg-success' : 'bg-danger')}
                  style={{ transform: 'translateX(calc(var(--from) * 100% * var(--dir))) scaleX(var(--span))' }}
                />
                <span className={SLIDE} style={{ transform: 'translateX(calc(var(--last) * 100% * var(--dir)))' }}>
                  <span className="absolute top-1/2 start-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-fg-subtle bg-canvas rtl:translate-x-1/2" />
                </span>
                <span className={SLIDE} style={{ transform: 'translateX(calc(var(--now) * 100% * var(--dir)))' }}>
                  <span className="absolute top-1/2 start-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg rtl:translate-x-1/2" />
                </span>
              </span>
              <span className="flex flex-col items-end max-md:col-start-2 max-md:row-start-1">
                <Num value={p.now} className="text-ui-lg font-semibold text-fg" />
                <span className={cn('text-ui-xs tabular-nums', fresh ? 'text-accent-text' : up ? 'text-success-text' : 'text-danger-text')}>
                  {fresh ? 'first week' : signed(p.now - p.last, short)}
                </span>
              </span>
            </PresenceItem>
          )
        })}
      </PresenceList>
    </div>
  )
}
