'use client'

import { useId, type ComponentProps, type ElementType, type MouseEventHandler } from 'react'
import { Stagger } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { Aurora } from '@youj/motion/backgrounds'
import { Badge } from '../../components/ui/badge'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'

/* A centered hero over a slow aurora: an announcement pill, the headline, one
 * sentence of proof and two calls to action, rising into place in sequence.
 * The aurora fades into the canvas so the next section starts on a clean
 * edge. Pass your own `primaryCta`, `secondaryCta` and `announcement`; every
 * other string is in `copy`, and `linkComponent` renders the links (your
 * router's Link). Reduced motion: the aurora holds one frame and everything
 * is already in place. */

/** A call to action: a link styled as a button. */
interface HeroCenteredCta {
  label: string
  href: string
  /** Runs on click; the link still follows `href` unless you call `event.preventDefault()`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

const DEFAULT_COPY = {
  /** The badge at the start of the announcement pill. */
  badge: 'New',
  headline: 'Ship the web at the speed of thought',
  description:
    'Northwind turns every push into a live preview, every merge into a global deploy, and every incident into a one-click rollback.',
  /** The small print under the calls to action; empty hides it. */
  note: 'Free for personal projects · No card required',
}
type HeroCenteredCopy = typeof DEFAULT_COPY

interface HeroCenteredProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** The headline. Same as `copy.headline`, which wins. */
  headline?: string
  /** The sentence under the headline. Same as `copy.description`, which wins. */
  description?: string
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<HeroCenteredCopy>
  /** The announcement pill above the headline; `null` hides it. Default: the demo's launch note. */
  announcement?: HeroCenteredCta | null
  /** The main call to action. Default: "Start deploying" to `#signup`. */
  primaryCta?: HeroCenteredCta
  /** The second call to action; `null` hides it. Default: "Talk to sales" to `#sales`. */
  secondaryCta?: HeroCenteredCta | null
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The headline's level. Default 1. */
  headingLevel?: 1 | 2 | 3
}

function HeroCentered({
  headline,
  description,
  copy: copyProp,
  announcement = { label: 'Northwind 2.0: instant rollbacks', href: '#launch' },
  primaryCta = { label: 'Start deploying', href: '#signup' },
  secondaryCta = { label: 'Talk to sales', href: '#sales' },
  linkComponent: Link = 'a',
  headingLevel = 1,
  className,
  ...rest
}: HeroCenteredProps) {
  const copy = { ...DEFAULT_COPY, ...(headline && { headline }), ...(description && { description }), ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  return (
    <section aria-labelledby={titleId} {...rest} className={cn('relative isolate overflow-hidden bg-canvas', className)}>
      <div aria-hidden className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_30%,transparent)]">
        <Aurora intensity={0.9} className="absolute inset-0" />
      </div>
      <Stagger
        inView={false}
        variant="rise"
        className="mx-auto flex min-h-[min(88dvh,760px)] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:px-6"
      >
        {announcement && (
          <Link
            href={announcement.href}
            onClick={announcement.onClick}
            data-yj-trigger=""
            className="group inline-flex items-center gap-2 rounded-full border border-line bg-canvas/70 youj-allow-glass py-1 ps-1 pe-3 text-ui-sm text-fg-muted backdrop-blur transition-colors yj-duration-fast ease-standard focus-ring hover:text-fg"
          >
            <Badge variant="solid">
              {copy.badge}
            </Badge>
            {announcement.label}
            <ArrowRightIcon size={14} className="rtl:-scale-x-100" />
          </Link>
        )}
        <Title id={titleId} className="text-balance text-4xl font-semibold tracking-tight text-fg sm:text-6xl sm:leading-[1.05]">
          {copy.headline}
        </Title>
        <p className="max-w-xl text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={primaryCta.href} onClick={primaryCta.onClick} className={buttonVariants({ size: 'lg' })}>
            {primaryCta.label}
          </Link>
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              onClick={secondaryCta.onClick}
              className={buttonVariants({ size: 'lg', variant: 'outline', className: 'bg-canvas/60 youj-allow-glass backdrop-blur' })}
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
        {copy.note && <p className="text-ui-sm text-fg-muted">{copy.note}</p>}
      </Stagger>
    </section>
  )
}

export { HeroCentered }
export type { HeroCenteredProps, HeroCenteredCopy, HeroCenteredCta }
