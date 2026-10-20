'use client'

import { useId, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, INDUSTRIES, ROLES } from './solutions/data'
import type { SolutionsCopy, SolutionsIndustry, SolutionsRole, SolutionsStat } from './solutions/data'
import { SolutionsPanel } from './solutions/panel'

/* One page for several buyers. Two switches: who you are (Engineers,
 * Designers, Product managers, as tabs) and what you build (Commerce,
 * Fintech, Media, as a segmented control). Together they choose what is
 * shown: the role's pitch and points, a customer quote in the industry's
 * voice, a call to action that names both, and a live panel whose three
 * numbers count up to that industry's values while its feed of recent
 * activity glides to the new lines. Changing either replays it; the choice is
 * announced politely. The role tabs take arrow keys; Reduced motion: content
 * swaps in place and the numbers are simply there.
 *
 * Pass your own `roles` (each with `stats` and a `feed` keyed by industry id)
 * and `industries`, follow or drive both switches (`value`, `industry`), and
 * set `locale`; every string is in `copy`. */

interface SolutionsProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The roles, one tab each. Default: the demo's engineers, designers and product managers. */
  roles?: SolutionsRole[]
  /** The industries, one segment each. Default: the demo's commerce, fintech and media. */
  industries?: SolutionsIndustry[]
  /** The role shown, as its id, controlled. */
  value?: string
  /** The role shown first, uncontrolled. Default: the first. */
  defaultValue?: string
  /** Called with the role the visitor picked. */
  onValueChange?: (role: string) => void
  /** The industry shown, as its id, controlled. */
  industry?: string
  /** The industry shown first, uncontrolled. Default: the first. */
  defaultIndustry?: string
  /** Called with the industry the visitor picked. */
  onIndustryChange?: (industry: string) => void
  /** The locale numbers are written in. Default: the YoujProvider's. */
  locale?: string
  /** Renders the call to action: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SolutionsCopy>
  /** The section heading's level; the open role's headline sits one below. Default 2. */
  headingLevel?: 1 | 2 | 3
}

function Solutions({
  theme,
  embedded = false,
  roles = ROLES,
  industries = INDUSTRIES,
  value: valueProp,
  defaultValue = roles[0]?.id ?? '',
  onValueChange,
  industry: industryProp,
  defaultIndustry = industries[0]?.id ?? '',
  onIndustryChange,
  locale: localeProp,
  linkComponent: Link = 'a',
  copy: copyProp,
  headingLevel = 2,
  className,
  ...rest
}: SolutionsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const labelId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const [roleId, setRoleId] = useControllableState(valueProp, defaultValue)
  const [industryId, setIndustryId] = useControllableState(industryProp, defaultIndustry)
  const role = roles.find((r) => r.id === roleId) ?? roles[0]
  const industry = industries.find((i) => i.id === industryId) ?? industries[0]
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <Reveal className="flex max-w-2xl flex-col gap-3">
          <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
          <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {copy.title}
          </Title>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        </Reveal>

        {role && industry && (
          <Tabs
            value={role.id}
            onValueChange={(next) => {
              setRoleId(next as string)
              onValueChange?.(next as string)
            }}
            className="gap-8"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <TabsList
                variant="pill"
                aria-label={copy.roleLabel}
                className="max-lg:h-auto max-lg:w-full"
              >
                {roles.map((r) => (
                  <TabsTrigger key={r.id} value={r.id} className="px-3 hover:text-fg max-lg:h-auto max-lg:min-h-control max-lg:flex-1 max-lg:py-1.5 max-lg:whitespace-normal max-sm:[&>svg]:hidden">
                    {r.icon}
                    {r.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex max-w-full items-center">
                {/* Named for screen readers only: the switch speaks for itself on screen. */}
                <span id={labelId} className="sr-only">
                  {copy.industryLabel}
                </span>
                <SegmentedControl
                  value={industry.id}
                  onValueChange={(next) => {
                    setIndustryId(next)
                    onIndustryChange?.(next)
                  }}
                  aria-labelledby={labelId}
                >
                  {industries.map((i) => (
                    <SegmentedControlItem key={i.id} value={i.id}>
                      {i.label}
                    </SegmentedControlItem>
                  ))}
                </SegmentedControl>
              </div>
            </div>
            <p role="status" className="sr-only">
              {copy.showing(role.label, industry.label)}
            </p>
            {roles.map((r) => (
              // The fullest role and industry's height at 100%: switching either never resizes the section.
              <TabsContent key={r.id} value={r.id} className="h-92.5 flex-none overflow-y-auto yj-scrollbar">
                <SolutionsPanel role={r} industry={industry} locale={locale} copy={copy} Link={Link} headingLevel={headingLevel + 1} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { Solutions }
export type { SolutionsProps, SolutionsCopy, SolutionsRole, SolutionsIndustry, SolutionsStat }
