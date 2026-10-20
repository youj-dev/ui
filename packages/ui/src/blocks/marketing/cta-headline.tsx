'use client'

import { useId, useRef, type ComponentProps, type ElementType, type MouseEventHandler } from 'react'
import { useInView } from 'motion/react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Magnetic, MagneticInner, Reveal, TextSplit } from '@youj/motion'
import { Illustration, type IllustrationSlot } from '@youj/illustrations'
import { ArrowRightIcon } from '@youj/icons'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'

/* The closing line, set as big as the column allows. "Ship it" and "today."
 * rise out of their own line masks as the block scrolls into view, sized in
 * container units (small enough that a monospace preset still sets each on
 * one line) so the pair spans the width at any size, embedded or not;
 * the second line is drawn in outline (the stroke painted under the fill, so
 * overlapping contours never show) and fills with the accent while the
 * call to action is hovered or focused, so the words and the button read as
 * one gesture. A rule draws across from the inline start between the type and
 * the fine print, and the one oversized button leans toward the pointer.
 * Reduced motion: the words are set, the rule is drawn, the button stays put.
 *
 * Pass your own `cta` (and `linkComponent` for your router); every string,
 * the two big lines included, is in `copy`. */

type LinkComponent = ElementType

/** The call to action, rendered as a link through `linkComponent`. */
interface CtaTypeCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

const CTA: CtaTypeCta = { label: 'Start deploying', href: '#signup' }

const DEFAULT_COPY = {
  eyebrow: 'Ready when you are',
  /** The command beside the eyebrow; empty hides it. */
  command: 'npx northwind deploy',
  /** The first big line. */
  title: 'Ship it',
  /** The second big line, drawn in outline. */
  titleOutline: 'today.',
  description: 'Import a repository and your first preview is live before this page finishes loading.',
  finePrint: 'No card required · Free forever for personal projects',
}

type CtaHeadlineCopy = typeof DEFAULT_COPY

interface CtaHeadlineProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, padding or max width). Default false. */
  embedded?: boolean
  /** The oversized button. Default: "Start deploying" to `#signup`. */
  cta?: CtaTypeCta
  /** The picture beside the big line, from a wide container up: a scene from the illustrations by id, your own node, or `null` for none. Default 'ship'. */
  illustration?: IllustrationSlot
  /** The big line's heading level. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<CtaHeadlineCopy>
  /** Renders the link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
}

function CtaHeadline({ theme, embedded = false, cta = CTA, illustration, headingLevel = 2, copy: copyProp, linkComponent: Link = 'a', className, ...rest }: CtaHeadlineProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const Heading = `h${headingLevel}` as const
  const titleId = useId()
  const rule = useRef<HTMLDivElement>(null)
  const drawn = useInView(rule, { once: true, amount: 1 })

  const view = (
    <section
      aria-labelledby={titleId}
      {...rest}
      className={cn('group/type overflow-hidden', !embedded && 'bg-canvas px-4 py-24 text-fg sm:px-6 md:py-36', className)}
    >
      <div className={cn('@container flex flex-col', !embedded && 'mx-auto max-w-6xl')}>
        <Reveal variant="fade" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-ui-sm text-fg-muted">
          <span className="inline-flex items-center gap-2 font-medium">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            {copy.eyebrow}
          </span>
          {copy.command && (
            <code className="rounded-md border border-line bg-transparent px-2 py-1 font-mono text-ui-sm text-fg">
              <span aria-hidden className="me-2 text-fg-muted select-none">
                $
              </span>
              {copy.command}
            </code>
          )}
        </Reveal>
        <div className="relative">
          {/* Set this tight, the line masks would clip the descenders of p and y, and the outline's stroke past the last glyph: their extra room is folded back with negative margins. */}
          <Heading
            id={titleId}
            className="mt-8 text-[clamp(3.25rem,22.5cqi,12rem)] leading-[0.9] font-semibold tracking-tighter text-fg @md:mt-10 [&_.overflow-hidden]:-mb-[0.32em] [&_.overflow-hidden]:pb-[0.32em] [&_.overflow-hidden]:-me-[0.08em] [&_.overflow-hidden]:pe-[0.08em]"
          >
            <TextSplit as="span" by="words" mask duration="deliberate" ease="enter" className="block">
              {copy.title}
            </TextSplit>{' '}
            <TextSplit
              as="span"
              by="words"
              mask
              delay={3}
              duration="deliberate"
              ease="enter"
              className="block text-canvas transition-colors yj-duration-slow ease-standard [-webkit-text-stroke:max(3px,0.022em)_var(--color-fg)] [paint-order:stroke_fill] group-has-[[data-cta]:focus-visible]/type:text-accent group-has-[[data-cta]:hover]/type:text-accent"
            >
              {copy.titleOutline}
            </TextSplit>
          </Heading>
          {illustration !== null && (
            <div data-slot="cta-illustration" className="absolute end-0 top-1/2 hidden -translate-y-1/2 @3xl:block">
              <Illustration scene={illustration} fallback="ship" unit={36} explode="hover" />
            </div>
          )}
        </div>
        <div
          ref={rule}
          aria-hidden
          className={cn(
            'mt-10 h-px bg-line transition-transform yj-duration-deliberate ease-emphasized ltr:origin-left rtl:origin-right @md:mt-14',
            drawn ? 'scale-x-100' : 'scale-x-0',
          )}
        />
        <Reveal variant="rise" delay={4} className="mt-8 flex flex-col gap-8 @3xl:flex-row @3xl:items-end @3xl:justify-between">
          <div className="flex max-w-md flex-col gap-3">
            <p className="text-pretty text-ui-lg text-fg">{copy.description}</p>
            <p className="text-ui text-fg-muted">{copy.finePrint}</p>
          </div>
          <Magnetic strength={0.25} className="self-start @max-sm:self-stretch @3xl:self-auto">
            <Link
              href={cta.href}
              onClick={cta.onClick}
              data-cta=""
              data-yj-trigger=""
              className={cn(buttonVariants({ size: 'lg' }), 'h-auto gap-3 px-8 py-5 text-xl @max-sm:w-full')}
            >
              <MagneticInner className="inline-flex items-center gap-3">
                {cta.label}
                <ArrowRightIcon size={22} trigger="hover" className="rtl:-scale-x-100" />
              </MagneticInner>
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { CtaHeadline }
export type { CtaHeadlineProps, CtaHeadlineCopy, CtaTypeCta }
