'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type ElementType, type MouseEvent } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { InfoIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { buttonVariants } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Switch } from '../../components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import { Cell, score } from './product-comparison/cells'
import { DEFAULT_COPY, GROUPS, PRODUCTS } from './product-comparison/data'
import type { ComparisonCell, ProductComparisonCopy, ComparisonGroup, ComparisonProduct, ComparisonRow } from './product-comparison/data'

/* Your product against the alternatives people weigh it with, in one table.
 * Yours is the first column, badged and raised on a panel of its own (paper,
 * a hairline and a soft shadow, so it reads in any accent, ink included); each product's column head
 * carries its name, its price, its call to action and how much of the list it
 * covers (a bar and "27 of 30 features", counting a partial as half). The head
 * sticks to the top while the page scrolls under it, and lifts (a darker
 * hairline) once it's pinned. Features are grouped under headings; each
 * explains itself in a tooltip, and a switch hides the rows every product
 * agrees on, leaving only what differs. Yes, partly and no are words for
 * assistive tech, not just marks. On a phone the table never scrolls sideways:
 * your column stays and a segmented control picks the one alternative shown
 * beside it. Reduced motion: bars set at once.
 *
 * Pass your `products` (yours first) and `groups` (a cell per product, in
 * order), follow or drive the phone's pick (`alternative`) and the switch
 * (`differencesOnly`), and handle a call to action with `onChoose`; every
 * string is in `copy`. */

type HeadingLevel = 1 | 2 | 3

interface ProductComparisonProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The products, yours first. Default: the demo's Northwind against Cumulus, Relay and self-hosting. */
  products?: ComparisonProduct[]
  /** The feature groups; each row holds one cell per product, in order. Default: the demo's four groups. */
  groups?: ComparisonGroup[]
  /** The alternative a phone shows beside yours (a product id), controlled. */
  alternative?: string
  /** The alternative a phone shows first, uncontrolled. Default: the first alternative. */
  defaultAlternative?: string
  /** Called when the visitor picks another alternative on a phone. */
  onAlternativeChange?: (id: string) => void
  /** Hide the rows every product agrees on, controlled. */
  differencesOnly?: boolean
  /** Hide them at first, uncontrolled. Default false. */
  defaultDifferencesOnly?: boolean
  /** Called when the switch changes. */
  onDifferencesOnlyChange?: (on: boolean) => void
  /** Called when a product's call to action is chosen. */
  onChoose?: (product: ComparisonProduct) => void
  /** Where "Spot a mistake?" goes; without it the line has no link. Default `#corrections`. */
  correctionHref?: string | null
  /** The locale numbers are written in. Default: the YoujProvider's. */
  locale?: string
  /** Renders the links: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<ProductComparisonCopy>
  /** The section heading's level. Default 2. */
  headingLevel?: HeadingLevel
}

/** True while the table's head is pinned: the sentinel above it has scrolled out of view. */
function useStuck() {
  const ref = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => entry && setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, stuck] as const
}

/** The cells that count toward coverage: rows where yours is a yes or no, not a figure. */
const counted = (row: ComparisonRow) => typeof row.values[0] !== 'object'
const agreed = (row: ComparisonRow) => row.values.every((value) => JSON.stringify(value) === JSON.stringify(row.values[0]))

function ProductComparison({
  theme,
  embedded = false,
  products = PRODUCTS,
  groups = GROUPS,
  alternative: alternativeProp,
  defaultAlternative = products[1]?.id ?? '',
  onAlternativeChange,
  differencesOnly: differencesProp,
  defaultDifferencesOnly = false,
  onDifferencesOnlyChange,
  onChoose,
  correctionHref = '#corrections',
  locale: localeProp,
  linkComponent: Link = 'a',
  headingLevel = 2,
  copy: copyProp,
  className,
  ...rest
}: ProductComparisonProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const [shown, setShown] = useControllableState(alternativeProp, defaultAlternative)
  const [diffs, setDiffs] = useControllableState(differencesProp, defaultDifferencesOnly)
  const [sentinel, stuck] = useStuck()
  const number = useMemo(() => numberFormat(locale, { maximumFractionDigits: 1 }), [locale])
  const alternatives = products.slice(1)
  const rowsOf = (group: ComparisonGroup) => (diffs ? group.rows.filter((row) => !agreed(row)) : group.rows)
  const visible = groups.map((group) => ({ group, rows: rowsOf(group) })).filter((entry) => entry.rows.length > 0)
  const all = groups.flatMap((group) => group.rows).filter(counted)
  const coverage = products.map((_, i) => all.reduce((sum, row) => sum + score(row.values[i]), 0))
  const colClass = (index: number, id: string) => cn(index > 0 && id !== shown && 'max-md:hidden')
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas px-4 py-20 sm:px-6 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10', !embedded && 'mx-auto max-w-6xl')}>
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
          <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {copy.title}
          </Title>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          <p className="text-ui-sm text-fg-muted">
            {copy.verified}{' '}
            {copy.correct && correctionHref && (
              <Link href={correctionHref} className="rounded-sm underline underline-offset-3 hover:text-fg focus-ring">
                {copy.correct}
              </Link>
            )}
          </p>
        </Reveal>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2.5 text-ui font-medium">
            <Switch
              checked={diffs}
              onCheckedChange={(next) => {
                setDiffs(next)
                onDifferencesOnlyChange?.(next)
              }}
            />
            {copy.differencesOnly}
          </label>
          <SegmentedControl
            value={shown}
            onValueChange={(id) => {
              setShown(id)
              onAlternativeChange?.(id)
            }}
            aria-label={copy.picker}
            className="md:hidden"
          >
            {alternatives.map((product) => (
              <SegmentedControlItem key={product.id} value={product.id}>
                {product.name}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>

        <TooltipProvider>
          <div className="relative isolate">
            <div ref={sentinel} aria-hidden className="h-px" />
            {/* Ours stands on a raised panel behind its column, set from the table's own widths (the feature column, then equal shares), so it's there on first paint and needs no measuring. */}
            {visible.length > 0 && (
              <div
                aria-hidden
                data-slot="comparison-ours"
                className="pointer-events-none absolute top-px bottom-0 start-(--ui--feature) -z-10 w-[calc((100%-var(--ui--feature))/var(--ui--columns))] rounded-2xl border border-line bg-surface shadow-lg [--ui--columns:2] [--ui--feature:calc(100%/3)] md:[--ui--columns:var(--ui--products)] md:[--ui--feature:28%]"
                style={{ '--ui--products': products.length } as CSSProperties}
              />
            )}
            <table className="w-full table-fixed border-separate border-spacing-0 text-ui">
              <thead>
                <tr data-stuck={stuck || undefined} className="group/head">
                  {/* The header paints the page only once it's stuck over scrolled rows; until then it's the page's own background. */}
                  <th scope="col" className="sticky top-0 z-10 w-1/3 border-b border-line p-0 py-4 pe-3 text-start align-bottom font-normal group-data-stuck/head:border-line-subtle group-data-stuck/head:bg-canvas md:w-[28%]">
                    <span className="sr-only">{copy.featureColumn}</span>
                  </th>
                  {products.map((product, i) => {
                    const total = all.length
                    const have = coverage[i] ?? 0
                    return (
                      <th
                        key={product.id}
                        scope="col"
                        className={cn(
                          'sticky top-0 z-10 border-b border-line px-2 py-4 text-start align-top font-normal md:px-3 transition-colors yj-duration-base ease-standard group-data-stuck/head:border-line-subtle group-data-stuck/head:bg-canvas',
                          colClass(i, product.id),
                          // Pinned, ours keeps its panel's paper under the rows scrolling by.
                          i === 0 && 'group-data-stuck/head:bg-surface',
                        )}
                      >
                        <span className="flex flex-col gap-1.5">
                          <span className="flex flex-wrap items-center gap-2 text-ui-lg font-semibold text-fg">
                            {product.name}
                            {i === 0 && <Badge variant="solid">{copy.ours}</Badge>}
                          </span>
                          {product.tagline && <span className="text-ui-sm font-normal text-fg-muted max-md:hidden">{product.tagline}</span>}
                          {product.price && <span className="text-ui-sm font-medium text-fg">{product.price}</span>}
                          {total > 0 && (
                            <span className="flex flex-col gap-1">
                              <Progress value={(have / total) * 100} aria-label={`${copy.coverageLabel}, ${product.name}`} className="h-1.5" />
                              <span className="text-ui-xs font-normal text-fg-muted tabular-nums">{copy.coverage(Number(number.format(have)), total)}</span>
                            </span>
                          )}
                          {product.cta && (
                            <Link
                              href={product.cta.href}
                              aria-label={copy.ctaLabel(product.cta.label, product.name)}
                              className={buttonVariants({ size: 'sm', variant: i === 0 ? 'default' : 'outline', className: 'mt-1 w-full' })}
                              onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                                product.cta?.onClick?.(event)
                                onChoose?.(product)
                              }}
                            >
                              {product.cta.label}
                            </Link>
                          )}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              {visible.map(({ group, rows }) => (
                <tbody key={group.name}>
                  <tr>
                    <th scope="rowgroup" className="border-b border-line bg-transparent px-3 py-2.5 text-start text-ui-sm font-semibold tracking-wide text-fg-muted uppercase">
                      {group.name}
                    </th>
                    {/* One empty cell per product, hidden as its column is, so the heading never spans a column that isn't there. */}
                    {products.map((product, i) => (
                      <td key={product.id} aria-hidden className={cn('border-b border-line bg-transparent', i > 0 && product.id !== shown && 'max-md:hidden')} />
                    ))}
                  </tr>
                  {rows.map((row) => (
                    <tr key={row.feature}>
                      <th scope="row" className="border-b border-line py-3 pe-3 text-start font-normal text-fg">
                        <span className="inline-flex items-center gap-1.5">
                          {row.feature}
                          {row.tip && (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <button
                                    type="button"
                                    aria-label={copy.about(row.feature)}
                                    className="relative grid size-5 shrink-0 place-items-center rounded-sm text-fg-muted transition-colors yj-duration-fast ease-standard focus-ring after:absolute after:-inset-2 hover:text-fg"
                                  />
                                }
                              >
                                <InfoIcon size={14} aria-hidden />
                              </TooltipTrigger>
                              <TooltipContent>{row.tip}</TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                      </th>
                      {products.map((product, i) => (
                        <td key={product.id} className={cn('border-b border-line px-2 py-3 md:px-3', colClass(i, product.id))}>
                          <Cell value={row.values[i] as ComparisonCell | undefined} copy={copy} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
            {diffs && visible.length === 0 && <p className="py-10 text-center text-ui text-fg-muted">{copy.noDifferences}</p>}
          </div>
        </TooltipProvider>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { ProductComparison }
export type { ProductComparisonProps, ProductComparisonCopy, ComparisonProduct, ComparisonGroup, ComparisonRow, ComparisonCell }
