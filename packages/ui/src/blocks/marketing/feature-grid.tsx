'use client'

import { useId, useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { cn } from '../../lib/utils'
import {
  CronInstrument,
  EdgeInstrument,
  ImagesInstrument,
  QueueInstrument,
  RolloutInstrument,
  SecretsInstrument,
} from './feature-grid/instruments'

/* Six features of the platform in one ruled panel, each read off a live
 * instrument from the kit: a rollout ruler, a day of cron runs, a latency
 * swarm, a queue's lanes, an image's weight and a list of secrets. Every
 * instrument draws itself in as its cell rises into view. Pointing at a cell
 * (or tabbing to its link) makes it take a second reading that shows the
 * feature at work, and the component glides there from wherever it is, so
 * crossing the grid never jumps; the cell's arrow slides out beside its
 * title. Pass your own `features` (each with a `media`, or a function of
 * whether the cell is live); the heading is in `copy`, and `linkComponent`
 * renders the links. Reduced motion: the cells are in place, every
 * instrument is drawn at its reading and holds it. */

/** A feature in the grid. */
interface FeatureGridFeature {
  id: string
  title: string
  description: string
  /** Where the cell links. Default `#<id>`. */
  href?: string
  /** The picture above the text, decorative. A function gets `live`: true while the cell is pointed at or focused (never under reduced motion). */
  media?: ReactNode | ((live: boolean) => ReactNode)
}

const DEFAULT_COPY = {
  eyebrow: 'Platform',
  title: 'Built in, not bolted on',
  description: 'The parts every app ends up needing come with every project, and each one reports what it’s doing.',
}
type FeatureGridCopy = typeof DEFAULT_COPY

const FEATURES: FeatureGridFeature[] = [
  {
    id: 'rollouts',
    title: 'Roll out by percentage',
    description: 'Ship behind a flag, open it to a tenth of your traffic, then to everyone. One switch takes it back.',
    media: (live) => <RolloutInstrument live={live} />,
  },
  {
    id: 'cron',
    title: 'Cron without a server',
    description: 'One line of config schedules a function. Every run is logged, retried on failure and never overlaps.',
    media: (live) => <CronInstrument live={live} />,
  },
  {
    id: 'edge',
    title: 'Functions at the edge',
    description: 'Code runs in the region nearest each request, so a visitor in Sydney waits as little as one in Virginia.',
    media: (live) => <EdgeInstrument live={live} />,
  },
  {
    id: 'queues',
    title: 'Queues that absorb a spike',
    description: 'Hand slow work to a queue. Workers scale with the backlog, from zero to thirty-two, and back.',
    media: (live) => <QueueInstrument live={live} />,
  },
  {
    id: 'secrets',
    title: 'Secrets that stay secret',
    description: 'Environment variables are encrypted at rest and shown only to people allowed to change them.',
    media: (live) => <SecretsInstrument live={live} />,
  },
  {
    id: 'images',
    title: 'Images for every screen',
    description: 'Each image is resized, compressed and served in the lightest format the browser can read.',
    media: (live) => <ImagesInstrument live={live} />,
  },
]

function Cell({ feature, index, link: Link }: { feature: FeatureGridFeature; index: number; link: ElementType }) {
  const k = useYouj()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const live = !k.reduced && (hovered || focused)
  const media = typeof feature.media === 'function' ? feature.media(live) : feature.media
  return (
    <Reveal variant="rise" inView={{ amount: 0.25 }} delay={index % 3} className="flex">
      <article
        data-live={live || undefined}
        data-yj-trigger=""
        onPointerEnter={(e) => e.pointerType !== 'touch' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="group/cell relative flex min-w-0 flex-1 flex-col border-e border-b border-line bg-surface"
      >
        {media != null && (
          <div
            aria-hidden
            inert
            className={cn(
              'm-2 mb-0 grid h-52 place-items-center overflow-hidden rounded-lg bg-transparent px-5 py-4',
              'transition-colors yj-duration-base ease-standard group-data-live/cell:bg-band',
            )}
          >
            {media}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-1.5 px-6 pt-5 pb-6">
          <span aria-hidden className="font-mono text-ui-xs text-fg-muted tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="text-ui-lg font-semibold text-fg">
            <Link
              href={feature.href ?? `#${feature.id}`}
              className="inline-flex items-center gap-1.5 outline-none after:absolute after:inset-0 after:z-10 after:ring-focus after:ring-inset focus-visible:after:ring-2"
            >
              {feature.title}
              <ArrowRightIcon
                size={15}
                aria-hidden
                className={cn(
                  'shrink-0 text-fg-muted transition-[opacity,translate] yj-duration-fast ease-standard rtl:-scale-x-100',
                  '-translate-x-1 opacity-0 rtl:translate-x-1 group-data-live/cell:translate-x-0 group-data-live/cell:opacity-100',
                )}
              />
            </Link>
          </h3>
          <p className="text-pretty text-ui text-fg-muted">{feature.description}</p>
        </div>
      </article>
    </Reveal>
  )
}

interface FeatureGridProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<FeatureGridCopy>
  /** The features, in order; three fill a wide row. Default: the demo's six, each with a live instrument. */
  features?: FeatureGridFeature[]
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The heading's level. Default 2. */
  headingLevel?: 1 | 2 | 3
}

function FeatureGrid({
  theme,
  embedded = false,
  copy: copyProp,
  features = FEATURES,
  linkComponent = 'a',
  headingLevel = 2,
  className,
  ...rest
}: FeatureGridProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-12', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <Reveal className="grid gap-x-16 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
          <div className="flex flex-col gap-3">
            {copy.eyebrow && <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>}
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
          </div>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        </Reveal>
        {/* The grid runs a pixel past the panel on its end and bottom edges, so the last column's and row's rules tuck under its border. */}
        <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
          <div className="-me-px -mb-px grid sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Cell key={feature.id} feature={feature} index={i} link={linkComponent} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { FeatureGrid }
export type { FeatureGridProps, FeatureGridCopy, FeatureGridFeature }
