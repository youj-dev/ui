'use client'

import { useId, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { Certifications } from './security/certifications'
import {
  CERTIFICATIONS,
  DEFAULT_COPY,
  NOW,
  POLICIES,
  PRACTICES,
  REGIONS,
  STATUS,
  type SecurityCertification,
  type MarketingSecurityCopy,
  type SecurityPolicy,
  type SecurityPractice,
  type SecurityRegion,
  type SecurityStatus,
} from './security/data'
import { Policies } from './security/policies'
import { Residency } from './security/residency'
import { StatusCard } from './security/status'

/* A trust center on one page. The live status (a headline in the state's tone,
 * the uptime and a strip of daily uptime whose days you can focus), the
 * certifications as cards (held or in progress, who audited, when it renews,
 * and a button to request the report), data residency (pick a region: the dot
 * map lights it and a list says what stays there and what is processed
 * outside it), six practices as tiles and the policy documents as a list of
 * links with their dates. Reduced motion: the map and the strip are drawn
 * in place.
 *
 * Pass your own `certifications`, `regions`, `policies`, `practices` and
 * `status` (leave any out of the page with `[]` or `null`), follow or drive the
 * region with `region`, wire `onRequestReport`, give the clock as `now` and
 * the `locale`; every string is in `copy`. */

type HeadingLevel = 1 | 2 | 3

interface MarketingSecurityProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The live status; `null` hides it. Default: the demo's operational status. */
  status?: SecurityStatus | null
  /** The certification cards; `[]` hides the section. Default: the demo's six. */
  certifications?: SecurityCertification[]
  /** The regions data can live in; `[]` hides the section. Default: the demo's United States, European Union and Asia Pacific. */
  regions?: SecurityRegion[]
  /** The practices; `[]` hides them. Default: the demo's six. */
  practices?: SecurityPractice[]
  /** The documents; `[]` hides them. Default: the demo's five. */
  policies?: SecurityPolicy[]
  /** The region shown, as its id, controlled. */
  region?: string
  /** The region shown first, uncontrolled. Default: the first. */
  defaultRegion?: string
  /** Called with the region the visitor picked. */
  onRegionChange?: (region: string) => void
  /** Request a certification's report. Resolve for success, reject (an Error's message is shown) to fail. Default: a short demo wait. */
  onRequestReport?: (certification: SecurityCertification) => Promise<unknown> | unknown
  /** The time relative times are measured from. Default: the demo's clock. */
  now?: Date | number
  /** The locale dates and numbers are written in. Default: the YoujProvider's. */
  locale?: string
  /** Renders the links: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MarketingSecurityCopy>
  /** The section heading's level; the sub-sections' headings sit one below. Default 2. */
  headingLevel?: HeadingLevel
}

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  // lint-blocks-allow: this is demo()'s own wait, behind the warning
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function MarketingSecurity({
  theme,
  embedded = false,
  status = STATUS,
  certifications = CERTIFICATIONS,
  regions = REGIONS,
  practices = PRACTICES,
  policies = POLICIES,
  region: regionProp,
  defaultRegion = regions[0]?.id ?? '',
  onRegionChange,
  onRequestReport,
  now: nowProp = NOW,
  locale: localeProp,
  linkComponent: Link = 'a',
  copy: copyProp,
  headingLevel = 2,
  className,
  ...rest
}: MarketingSecurityProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const now = +nowProp
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const Sub = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const [regionId, setRegionId] = useControllableState(regionProp, defaultRegion)
  const block = (heading: string, children: React.ReactNode, lead?: string) => (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-2xl flex-col gap-2">
        <Sub className="text-2xl font-semibold tracking-tight">{heading}</Sub>
        {lead && <p className="text-pretty text-ui-lg text-fg-muted">{lead}</p>}
      </div>
      {children}
    </div>
  )
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-16', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <Reveal className="flex max-w-2xl flex-col gap-3">
            <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          </Reveal>
          {status && <StatusCard status={status} now={now} locale={locale} copy={copy} Link={Link} />}
        </div>
        {certifications.length > 0 &&
          block(
            copy.certifications,
            <Certifications
              certifications={certifications}
              locale={locale}
              copy={copy}
              headingLevel={headingLevel + 2}
              onRequest={(cert) => (onRequestReport ? onRequestReport(cert) : demo('Security: onRequestReport', 900))}
            />,
          )}
        {regions.length > 0 &&
          block(
            copy.residency,
            <Residency
              regions={regions}
              value={regionId}
              onValueChange={(id) => {
                setRegionId(id)
                onRegionChange?.(id)
              }}
              copy={copy}
            />,
            copy.residencyDescription,
          )}
        {practices.length > 0 &&
          block(
            copy.practices,
            <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {practices.map((practice) => (
                <li key={practice.title} className="flex gap-3.5">
                  {practice.icon && (
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-band text-fg">
                      {practice.icon}
                    </span>
                  )}
                  <span className="flex flex-col gap-1">
                    <span className="text-ui font-semibold text-fg">{practice.title}</span>
                    <span className="text-pretty text-ui text-fg-muted">{practice.description}</span>
                  </span>
                </li>
              ))}
            </ul>,
          )}
        {policies.length > 0 && block(copy.policies, <Policies policies={policies} locale={locale} copy={copy} Link={Link} />)}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { MarketingSecurity }
export type { MarketingSecurityProps, MarketingSecurityCopy, SecurityCertification, SecurityRegion, SecurityPolicy, SecurityPractice, SecurityStatus }
