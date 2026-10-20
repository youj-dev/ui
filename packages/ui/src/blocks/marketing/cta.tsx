'use client'

import type { ComponentProps, ElementType, MouseEventHandler } from 'react'
import { Magnetic, MagneticInner, Reveal } from '@youj/motion'
import { Illustration, type IllustrationSlot } from '@youj/illustrations'
import { ArrowRightIcon } from '@youj/icons'
import { MeshGradient } from '@youj/motion/backgrounds'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'

/* The closing call to action: a contained panel over a drifting mesh
 * gradient, one line of headline, one of reassurance, and a magnetic primary
 * button beside a quiet secondary, with an isometric scene on the end side
 * from `lg` up (a rocket over its pad, which lifts off when hovered; any
 * illustration by id, or your own picture). The panel rises in as it enters.
 * Reduced motion: the gradient and the scene hold still and the button stays
 * put.
 *
 * Pass your own `primaryCta` / `secondaryCta` and set `linkComponent` for
 * your router; every string is in `copy`. */

type LinkComponent = ElementType

/** A call to action link. */
interface CtaBandCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

const DEFAULT_COPY = {
  title: 'Your next deploy could be your first one here',
  description: 'Import a repository and get a preview URL in under a minute. Free for as long as you need.',
}

type MarketingCtaCopy = typeof DEFAULT_COPY

interface MarketingCtaProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** The headline. Overrides `copy.title`. */
  title?: string
  /** The line under the headline. Overrides `copy.description`. */
  description?: string
  /** The picture on the end side: a scene from the illustrations by id, your own node, or `null` for none. Default 'deploy'. */
  illustration?: IllustrationSlot
  /** The magnetic primary button. Default: Start deploying → `#signup`. */
  primaryCta?: CtaBandCta
  /** The quiet link beside it; `null` hides it. Default: Talk to sales → `#sales`. */
  secondaryCta?: CtaBandCta | null
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MarketingCtaCopy>
  /** The headline's level. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** The element every internal link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
}

function MarketingCta({
  title,
  description,
  illustration,
  primaryCta = { label: 'Start deploying', href: '#signup' },
  secondaryCta = { label: 'Talk to sales', href: '#sales' },
  copy: copyProp,
  headingLevel = 2,
  linkComponent: Link = 'a',
  className,
  ...rest
}: MarketingCtaProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  return (
    <section aria-labelledby="cta-title" className={cn('bg-canvas px-4 py-16 sm:px-6 md:py-24', className)} {...rest}>
      <Reveal variant="rise" className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-2xl border border-line bg-surface">
        {/* A faint drift of the theme's chart colours, so the band stays a quiet spectrum in any preset (a monochrome accent included). */}
        <div aria-hidden className="absolute inset-0 -z-10 opacity-45">
          <MeshGradient colors={['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-5)', 'var(--color-chart-4)']} intensity={0.7} className="absolute inset-0" />
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-surface rtl:bg-linear-to-l via-surface/80 to-transparent" />
        <div className="flex items-center justify-between gap-10 px-6 py-14 sm:px-12 md:py-20">
          <div className="flex flex-col items-start gap-6">
            <Title id="cta-title" className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
              {title ?? copy.title}
            </Title>
            <p className="max-w-lg text-pretty text-ui-lg text-fg-muted">{description ?? copy.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Magnetic strength={0.3}>
                <Link href={primaryCta.href} onClick={primaryCta.onClick} data-yj-trigger="" className={buttonVariants({ size: 'lg', className: 'px-5' })}>
                  <MagneticInner className="inline-flex items-center gap-2">
                    {primaryCta.label} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
                  </MagneticInner>
                </Link>
              </Magnetic>
              {secondaryCta && (
                <Link href={secondaryCta.href} onClick={secondaryCta.onClick} className={buttonVariants({ size: 'lg', variant: 'ghost' })}>
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
          {illustration !== null && (
            <div data-slot="cta-illustration" className="-my-8 hidden shrink-0 lg:block">
              <Illustration scene={illustration} fallback="deploy" unit={24} explode="hover" />
            </div>
          )}
        </div>
      </Reveal>
    </section>
  )
}

export { MarketingCta }
export type { MarketingCtaProps, MarketingCtaCopy, CtaBandCta }
