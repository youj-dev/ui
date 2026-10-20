'use client'

import type { ElementType } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { Counter, PresenceItem, PresenceList } from '@youj/motion'
import { ArrowRightIcon, CheckIcon, QuoteIcon } from '@youj/icons'
import { buttonVariants } from '../../../components/ui/button'
import type { SolutionsCopy, SolutionsIndustry, SolutionsRole } from './data'

/* What one role sees in one industry: the pitch (headline, description, the
 * points, a customer quote in the industry's voice and a call to action that
 * names both) beside a live panel of three numbers that count up to the
 * industry's values and a feed of what just happened, which glides as lines
 * come and go. */

interface PanelProps {
  role: SolutionsRole
  industry: SolutionsIndustry
  locale: string
  copy: SolutionsCopy
  Link: ElementType
  headingLevel: number
}

export function SolutionsPanel({ role, industry, locale, copy, Link, headingLevel }: PanelProps) {
  const k = useYouj()
  const Heading = `h${headingLevel}` as 'h3'
  const lines = role.feed[industry.id] ?? []
  const fade = { initial: k.reduced ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: k.tween('base', 'enter') } as const
  return (
    <MotionFeatures>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,--spacing(120))] lg:items-start lg:gap-12">
        <m.div key={`${role.id}-${industry.id}`} {...fade} className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Heading className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{role.headline}</Heading>
            <p className="text-pretty text-ui-lg text-fg-muted">{role.description}</p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {role.points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-ui text-fg">
                <CheckIcon size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                {point}
              </li>
            ))}
          </ul>
          <figure className="flex gap-3 rounded-xl border border-line bg-transparent p-4">
            <QuoteIcon size={18} aria-hidden className="mt-0.5 shrink-0 text-accent-line" />
            <div className="flex flex-col gap-2">
              <blockquote className="text-pretty text-ui text-fg">
                <p>“{industry.quote.text}”</p>
              </blockquote>
              <figcaption className="text-ui-sm text-fg-muted">
                {industry.quote.name}, {industry.quote.role}
              </figcaption>
            </div>
          </figure>
          {role.cta && (
            <Link href={role.cta.href} onClick={role.cta.onClick} className={buttonVariants({ variant: 'outline', className: 'self-start' })}>
              {copy.cta(role.label, industry.label)}
              <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
            </Link>
          )}
        </m.div>

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <p className="text-ui-sm font-medium text-fg-muted">{copy.panel(role.label, industry.label)}</p>
          <dl aria-label={copy.statsLabel} className="grid grid-cols-3 gap-3">
            {role.stats.map((stat) => {
              const value = stat.values[industry.id]
              return (
                <div key={stat.label} className="flex flex-col-reverse gap-1 rounded-xl bg-transparent p-3">
                  <dt className="text-ui-xs text-fg-muted">{stat.label}</dt>
                  <dd className="flex items-baseline text-2xl font-semibold tracking-tight tabular-nums">
                    {value ? (
                      <>
                        <Counter key={`${role.id}-${industry.id}`} value={value.value} mode="roll" format={value.format} locale={locale} duration="deliberate" />
                        {value.suffix && <span className="text-ui text-fg-muted">{value.suffix}</span>}
                      </>
                    ) : (
                      copy.noValue
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
          <div className="flex flex-col gap-2">
            <p className="text-ui-sm font-medium text-fg-muted">{copy.feedLabel}</p>
            <PresenceList aria-label={copy.feedLabel} className="flex min-h-40 flex-col">
              {lines.map((line) => (
                <PresenceItem key={line} className="flex items-start gap-2.5 border-b border-line py-2.5 text-ui text-fg last:border-b-0">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  {line}
                </PresenceItem>
              ))}
            </PresenceList>
          </div>
        </div>
      </div>
    </MotionFeatures>
  )
}
