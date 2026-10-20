'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type ElementType, type MouseEvent } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Collapse, Reveal } from '@youj/motion'
import { CheckIcon, ChevronDownIcon, InfoIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { buttonVariants } from '../../components/ui/button'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import {
  DEFAULT_COPY,
  GROUPS,
  PLANS,
  RECOMMENDED,
  type PricingCompareCell,
  type PricingCompareCopy,
  type PricingCompareCta,
  type PricingCompareGroup,
  type PricingComparePlan,
  type PricingCompareRow,
} from './pricing-compare/data'

/* Comparison first: every feature of every plan in one matrix. The plans'
 * names, prices and calls to action ride in a sticky header that lifts off
 * the page (a hairline and a shadow) once it's pinned, so a buyer deep in
 * Security still knows which column is which and can act on it. Each group
 * folds away (Collapse, the chevron turning with it), each feature explains
 * itself in a tooltip, and the recommended plan's column carries its marks
 * filled and its values in full weight under an accent cap (never a tinted
 * band, which turns to a grey stripe in a monochrome theme). On phones the matrix never scrolls sideways: a segmented control
 * in the sticky header picks the one plan shown beside the features.
 * Included and missing are announced, not just drawn. Reduced motion:
 * groups open and close in place.
 *
 * Pass your own `plans` and `groups` and handle a pick with `onSelectPlan`;
 * every string is in `copy`. */

type LinkComponent = ElementType
type HeadingLevel = 1 | 2 | 3

/** Shared by the sticky header and every group's table, so the columns line up. */
const FEATURE_COL = 'w-1/2 md:w-[28%]'
/** Every plan column shows from md up; below it, only the chosen one. */
const planCol = (id: string, shown: string) => cn(id !== shown && 'max-md:hidden')

/** A cell's mark: in the recommended column, the check is filled and a value is set in full weight. */
function Value({ value, featured, copy }: { value: PricingCompareCell | undefined; featured: boolean; copy: PricingCompareCopy }) {
  if (value === true)
    return featured ? (
      <span className="inline-grid size-5 place-items-center rounded-full bg-accent text-on-accent">
        <CheckIcon size={12} strokeWidth={3} aria-hidden />
        <span className="sr-only">{copy.included}</span>
      </span>
    ) : (
      <span className="inline-flex text-fg">
        <CheckIcon size={16} strokeWidth={2.25} aria-hidden />
        <span className="sr-only">{copy.included}</span>
      </span>
    )
  if (value === false || value === undefined)
    return (
      <span className="text-fg-muted">
        <span aria-hidden>–</span>
        <span className="sr-only">{copy.notIncluded}</span>
      </span>
    )
  return <span className={featured ? 'font-medium text-fg' : 'text-fg'}>{value}</span>
}

interface GroupProps {
  group: PricingCompareGroup
  plans: PricingComparePlan[]
  shown: string
  recommended: string
  copy: PricingCompareCopy
  headingLevel: HeadingLevel
}

function Group({ group, plans, shown, recommended, copy, headingLevel }: GroupProps) {
  const id = useId()
  const [open, setOpen] = useState(true)
  const Heading = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  return (
    <div className="border-b border-line">
      <Heading>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="group/row flex w-full items-center gap-3 rounded-sm py-4 text-start text-ui-lg font-semibold text-fg focus-ring"
        >
          {group.name}
          <span className="text-ui-sm font-normal text-fg-muted tabular-nums">{group.rows.length}</span>
          <ChevronDownIcon
            size={18}
            aria-hidden
            className={cn('ms-auto text-fg-muted transition-transform yj-duration-base ease-standard group-hover/row:text-fg', open && 'rotate-180')}
          />
        </button>
      </Heading>
      <Collapse id={id} open={open}>
        <table className="mb-3 w-full table-fixed border-separate border-spacing-0 text-ui">
          <caption className="sr-only">{group.name}</caption>
          <thead>
            <tr>
              <th scope="col" className={cn('h-0 p-0', FEATURE_COL)}>
                <span className="sr-only">{copy.featureColumn}</span>
              </th>
              {plans.map((plan) => (
                <th key={plan.id} scope="col" className={cn('h-0 p-0', planCol(plan.id, shown))}>
                  <span className="sr-only">{plan.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row) => (
              <tr key={row.feature} className="group/tr">
                <th scope="row" className="border-t border-line py-3 pe-3 text-start font-normal text-fg group-first/tr:border-t-0">
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
                {plans.map((plan, i) => (
                  <td key={plan.id} className={cn('border-t border-line px-3 py-3 text-center group-first/tr:border-t-0', planCol(plan.id, shown))}>
                    <Value value={row.values[i]} featured={plan.id === recommended} copy={copy} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Collapse>
    </div>
  )
}

/** True while the element after `ref` is pinned: the sentinel above it has scrolled out of view. */
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

interface PricingCompareProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, no section padding or max width). Default false. */
  embedded?: boolean
  /** The plan a phone shows beside the features at first, when uncontrolled. Default: the recommended one. */
  defaultPlan?: string
  /** The plan a phone shows beside the features, to control it. */
  plan?: string
  /** Called when the visitor picks another plan to compare on a phone. */
  onPlanChange?: (plan: string) => void
  /** The plan columns, in order. Default: the demo's Hobby, Pro, Scale and Enterprise. */
  plans?: PricingComparePlan[]
  /** The feature groups; each row holds one value per plan. Default: the demo's five groups. */
  groups?: PricingCompareGroup[]
  /** The id of the plan whose column is tinted and badged. Default `pro`. */
  recommended?: string
  /** Called when a plan's call to action is chosen. */
  onSelectPlan?: (plan: PricingComparePlan) => void
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<PricingCompareCopy>
  /** The component for every link, e.g. Next.js `Link`; it gets `href`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** The section heading's level; group headings sit one below it. Default 2. */
  headingLevel?: HeadingLevel
  /** Classes for the root section. */
  className?: string
}

function PricingCompare({
  theme,
  embedded = false,
  recommended = RECOMMENDED,
  defaultPlan = recommended,
  plan: planProp,
  onPlanChange,
  plans = PLANS,
  groups = GROUPS,
  onSelectPlan,
  copy: copyProp,
  linkComponent: Link = 'a',
  headingLevel = 2,
  className,
  ...rest
}: PricingCompareProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const [shown, setShown] = useControllableState(planProp, defaultPlan)
  const [sentinel, stuck] = useStuck()
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas px-4 py-20 sm:px-6 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10', !embedded && 'mx-auto max-w-6xl')}>
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
          <Heading id={titleId} className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
            {copy.title}
          </Heading>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        </Reveal>
        <TooltipProvider>
          <div className="relative">
            <div ref={sentinel} aria-hidden className="h-px" />
            <div
              data-yj-stuck={stuck || undefined}
              className={cn(
                // The page's own background until it's pinned over scrolled rows; then it paints the page and lifts off.
                'sticky top-0 z-10 border-b border-line transition-[box-shadow,border-color] yj-duration-base ease-standard',
                'data-yj-stuck:border-line-subtle data-yj-stuck:bg-canvas data-yj-stuck:shadow-md',
              )}
            >
              <SegmentedControl
                value={shown}
                onValueChange={(value) => {
                  setShown(value as string)
                  onPlanChange?.(value as string)
                }}
                aria-label={copy.planPicker}
                className="mt-3 w-full md:hidden"
              >
                {plans.map((plan) => (
                  <SegmentedControlItem key={plan.id} value={plan.id} className="flex-1">
                    {plan.name}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
              <div className="flex items-stretch">
                <div className={cn('flex flex-col justify-end py-4 pe-3 max-md:hidden', FEATURE_COL)}>
                  {copy.priceNote && <p className="text-ui-sm text-fg-muted">{copy.priceNote}</p>}
                </div>
                {plans.map((plan) => {
                  const cta = plan.cta
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        'flex min-w-0 flex-1 flex-col gap-3 px-3 py-4 max-md:flex-row max-md:items-center max-md:justify-between max-md:px-0',
                        planCol(plan.id, shown),
                        plan.id === recommended && 'md:border-t-2 md:border-accent',
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <p className="flex flex-wrap items-center gap-2 text-ui-lg font-semibold text-fg">
                          {plan.name}
                          {plan.id === recommended && <Badge variant="solid">{copy.recommended}</Badge>}
                        </p>
                        <p className="flex items-baseline gap-1">
                          <span className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{plan.price}</span>
                          {plan.per && <span className="text-ui-sm text-fg-muted">{plan.per}</span>}
                        </p>
                      </div>
                      {cta && (
                        <Link
                          href={cta.href}
                          aria-label={copy.ctaLabel(cta.label, plan.name)}
                          className={buttonVariants({ size: 'sm', variant: plan.id === recommended ? 'default' : 'outline', className: 'md:w-full' })}
                          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                            cta.onClick?.(event)
                            onSelectPlan?.(plan)
                          }}
                        >
                          {cta.label}
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Every group open at 100% (the page scrolls under the sticky plans, so no scroller of its own): folding groups never shrinks the section. */}
            <div className="min-h-287">
              {groups.map((group) => (
                <Group key={group.name} group={group} plans={plans} shown={shown} recommended={recommended} copy={copy} headingLevel={headingLevel} />
              ))}
            </div>
          </div>
        </TooltipProvider>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { PricingCompare }
export type { PricingCompareProps, PricingCompareCopy, PricingCompareCta, PricingComparePlan, PricingCompareCell, PricingCompareRow, PricingCompareGroup }
