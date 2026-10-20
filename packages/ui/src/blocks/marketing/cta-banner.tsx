'use client'

import { useId, useRef, type ComponentProps, type ElementType, type MouseEventHandler } from 'react'
import { useInView } from 'motion/react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon, RocketIcon } from '@youj/icons'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'

/* A slim call to action that sits between sections: a full-bleed band in a
 * soft tint of the accent, one line of headline and one of reassurance beside
 * the primary button and a quiet text link. A soft band of light crosses it
 * now and then over a faint dot grid, and the rocket lifts when the band is
 * hovered. The row rises in once as it scrolls into view. Every color is a
 * role token, so it reads in any preset. Reduced motion: no sweep, the row is
 * in place, the rocket holds still.
 *
 * Pass your own `primaryCta` and `secondaryCta` (and `linkComponent` for
 * your router); the headline and line under it are in `copy`. */

type LinkComponent = ElementType

/** A call to action, rendered as a link through `linkComponent`. */
interface CtaBannerCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

const DEFAULT_COPY = {
  title: 'Your next deploy is sixty seconds away.',
  description: 'Import a repository and every pull request gets its own preview URL. Free for personal projects, no card required.',
}

type CtaBannerCopy = typeof DEFAULT_COPY

const PRIMARY: CtaBannerCta = { label: 'Import a repository', href: '#signup' }
const SECONDARY: CtaBannerCta = { label: 'Read the quickstart', href: '#quickstart' }

interface CtaBannerProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out, so the band becomes a rounded panel in its column instead of running edge to edge. Default false. */
  embedded?: boolean
  /** The primary button. Default: "Import a repository" to `#signup`. */
  primaryCta?: CtaBannerCta
  /** The quiet text link; `null` hides it. Default: "Read the quickstart" to `#quickstart`. */
  secondaryCta?: CtaBannerCta | null
  /** The headline's level. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<CtaBannerCopy>
  /** Renders every link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
}

function CtaBanner({
  theme,
  embedded = false,
  primaryCta = PRIMARY,
  secondaryCta = SECONDARY,
  headingLevel = 2,
  copy: copyProp,
  linkComponent: Link = 'a',
  className,
  ...rest
}: CtaBannerProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const Heading = `h${headingLevel}` as const
  const k = useYouj()
  const titleId = useId()
  const ref = useRef<HTMLElement>(null)
  // The sweep is a CSS loop: park it while the band is off screen.
  const inView = useInView(ref, { amount: 0.1 })

  const view = (
    <section
      ref={ref}
      aria-labelledby={titleId}
      data-yj-trigger=""
      data-reduced-motion={k.reduced || undefined}
      {...rest}
      className={cn(
        '@container relative isolate overflow-hidden border-y border-accent-line bg-accent-subtle text-fg',
        embedded && 'rounded-xl border-x',
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-accent)_1px,transparent_1px)] bg-size-[14px_14px] opacity-25 [mask-image:linear-gradient(to_left,black,transparent_65%)] rtl:[mask-image:linear-gradient(to_right,black,transparent_65%)]" />
        <div
          className={cn(
            'absolute inset-0 animate-shimmer [animation-duration:calc(var(--yj-duration-deliberate)*9)] reduced:hidden',
            !inView && '[animation-play-state:paused]',
          )}
        >
          <div className="absolute inset-y-0 start-1/4 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-surface/40 to-transparent" />
        </div>
      </div>
      <Reveal
        variant="rise"
        className={cn(
          'flex flex-col gap-5 @3xl:flex-row @3xl:items-center @3xl:gap-8',
          embedded ? 'px-5 py-5 sm:px-6' : 'mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-7',
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-4 @3xl:items-center">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface text-accent-text ring-1 ring-accent-line ring-inset">
            <RocketIcon size={20} trigger="hover" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <Heading id={titleId} className="text-balance text-ui-lg font-semibold tracking-tight @3xl:text-xl">
              {copy.title}
            </Heading>
            <p className="text-pretty text-ui text-fg-muted">{copy.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 @max-3xl:ps-14 @max-md:ps-0">
          <Link
            href={primaryCta.href}
            onClick={primaryCta.onClick}
            className={cn(buttonVariants(), '@max-md:w-full')}
          >
            {primaryCta.label}
          </Link>
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              onClick={secondaryCta.onClick}
              className="group/link inline-flex h-control items-center gap-1.5 rounded-md text-ui font-medium text-fg underline-offset-4 focus-ring hover:underline @max-md:w-full @max-md:justify-center"
            >
              {secondaryCta.label}
              <ArrowRightIcon
                size={15}
                aria-hidden
                className="transition-transform yj-duration-fast ease-standard group-hover/link:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/link:-translate-x-0.5"
              />
            </Link>
          )}
        </div>
      </Reveal>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { CtaBanner }
export type { CtaBannerProps, CtaBannerCopy, CtaBannerCta }
