'use client'

import { useId, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { cn } from '../../lib/utils'
import { AnalyticsDemo, PreviewDemo, RollbackDemo } from './feature-spotlight/demos'

/* Feature rows that alternate sides, each beside a live demo built from the
 * real components: push a commit and watch the Timeline take the commit and
 * its deploy; promote an older deploy and the Production badge moves once
 * the Button's onAction lands; switch the metric and the bar chart regrows.
 * Rows reveal as they scroll in. Pass your own `features` (each with a
 * `media`: a demo, a screenshot); the heading and link text are in `copy`,
 * and `linkComponent` renders the links. Reduced motion: same demos,
 * instant. */

/** A feature row: its text on one side and its demo on the other. */
interface FeatureSpotlightFeature {
  id: string
  /** The small label over the title; it also names the row's link. */
  eyebrow: string
  title: string
  description: string
  /** Where the row's link goes. Default `#<id>`. */
  href?: string
  /** The demo or picture beside the text. Give an image its `alt`. */
  media?: ReactNode
}

const DEFAULT_COPY = {
  eyebrow: 'How it works',
  title: 'From branch to production, without the ceremony',
  /** The row's link text, from its eyebrow. */
  learnMore: (eyebrow: string) => `Learn about ${eyebrow.toLowerCase()}`,
}
type FeatureSpotlightCopy = typeof DEFAULT_COPY

const FEATURES: FeatureSpotlightFeature[] = [
  {
    id: 'previews',
    eyebrow: 'Previews',
    title: 'A live URL for every push',
    description: 'Each commit on a pull request builds its own preview, and the history reads like a conversation: what changed, who changed it, and when it went live.',
    media: <PreviewDemo />,
  },
  {
    id: 'rollback',
    eyebrow: 'Rollback',
    title: 'Undo production in one click',
    description: 'Every deploy stays warm, so promoting an older one is a pointer change, not a rebuild. Try it: promote yesterday’s deploy.',
    media: <RollbackDemo />,
  },
  {
    id: 'analytics',
    eyebrow: 'Analytics',
    title: 'See what a deploy did to your numbers',
    description: 'Traffic and errors are split at every deploy, so a regression points at its cause. No cookies, no sampling, no banner.',
    media: <AnalyticsDemo />,
  },
]

interface FeatureSpotlightProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<FeatureSpotlightCopy>
  /** The rows, alternating sides. Default: the demo's three, each with a live demo. */
  features?: FeatureSpotlightFeature[]
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The heading's level; the rows' titles sit one level below. Default 2. */
  headingLevel?: 1 | 2 | 3
}

function FeatureSpotlight({ copy: copyProp, features = FEATURES, linkComponent: Link = 'a', headingLevel = 2, className, ...rest }: FeatureSpotlightProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const RowTitle = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  return (
    <section aria-labelledby={titleId} {...rest} className={cn('bg-canvas py-20 md:py-28', className)}>
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 sm:px-6 md:gap-28">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          {copy.eyebrow && <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>}
          <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
            {copy.title}
          </Title>
        </Reveal>
        {features.map((row, i) => (
          <div key={row.id} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
            <Reveal variant="rise" className={i % 2 ? 'md:order-last' : undefined}>
              <div className="flex max-w-md flex-col gap-4">
                <p className="text-ui-sm font-medium text-accent">{row.eyebrow}</p>
                <RowTitle className="text-balance text-2xl font-semibold tracking-tight text-fg md:text-3xl">{row.title}</RowTitle>
                <p className="text-pretty text-ui-lg text-fg-muted">{row.description}</p>
                <Link
                  href={row.href ?? `#${row.id}`}
                  data-yj-trigger=""
                  className="inline-flex w-fit items-center gap-1.5 rounded-sm text-ui font-medium text-fg underline-offset-4 focus-ring hover:underline"
                >
                  {copy.learnMore(row.eyebrow)} <ArrowRightIcon size={14} className="rtl:-scale-x-100" />
                </Link>
              </div>
            </Reveal>
            {row.media != null && (
              <Reveal variant="rise" delay={2} className="min-w-0">
                {row.media}
              </Reveal>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export { FeatureSpotlight }
export type { FeatureSpotlightProps, FeatureSpotlightCopy, FeatureSpotlightFeature }
