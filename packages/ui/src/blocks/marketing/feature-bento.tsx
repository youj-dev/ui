'use client'

import { useId, type ComponentProps, type ComponentType, type ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Reveal, Stagger } from '@youj/motion'
import { CommandIcon, GitPullRequestIcon, GlobeIcon, LayersIcon, MessageIcon, GaugeIcon, type IconProps } from '@youj/icons'
import { cn } from '../../lib/utils'
import { BuildsDemo, PaletteDemo } from './feature-bento/workflow'
import { InsightsDemo, RegionsDemo, ReviewDemo } from './feature-bento/demos'
import { PreviewDemo } from './feature-bento/preview'

/* A bento of Northwind's platform: six tiles of mixed sizes, each carrying a
 * small live demo built from the real components. The large tile's Switch
 * really password-protects its preview; the others play while they're on
 * screen: regions pulse on a dot map as their count rolls up, review pins
 * drop onto a page, a build ticks through cached steps, the command palette
 * finds a command as it's typed, and time to first byte draws itself down.
 * Tiles rise in a stagger as the grid scrolls in, and a tile's icon plays
 * when it's hovered. Pass your own `features` (each with a `media` and the
 * grid span in `className`); the heading is in `copy`. Reduced motion: every
 * demo holds its finished frame and the tiles are in place. */

/** A tile in the bento. */
interface FeatureBentoFeature {
  icon: ComponentType<IconProps>
  title: string
  description: string
  /** The tile's grid span, for example `lg:col-span-4 lg:row-span-2` (the grid is six columns wide on large screens, two on medium). */
  className?: string
  /** The tile's demo or picture, under its text. */
  media?: ReactNode
}

const DEFAULT_COPY = {
  eyebrow: 'Platform',
  title: 'The whole release, in one place',
  description: 'From the first push to the last byte served: previews, builds, review and the edge network, built to work as one.',
}
type FeatureBentoCopy = typeof DEFAULT_COPY

const FEATURES: FeatureBentoFeature[] = [
  {
    icon: GitPullRequestIcon,
    title: 'A preview for every push',
    description: 'Every branch gets its own URL. Share it, comment on it, or keep it behind a password.',
    className: 'md:col-span-2 lg:col-span-4 lg:row-span-2',
    media: <PreviewDemo />,
  },
  {
    icon: GlobeIcon,
    title: '38 regions, zero config',
    description: 'Pages and functions run next to whoever is asking. Nothing to pick or provision.',
    className: 'lg:col-span-2',
    media: <RegionsDemo />,
  },
  {
    icon: MessageIcon,
    title: 'Review the real thing',
    description: 'Pin comments to the pixel they’re about, right on the preview.',
    className: 'lg:col-span-2',
    media: <ReviewDemo />,
  },
  {
    icon: LayersIcon,
    title: 'Builds that remember',
    description: 'Every step that didn’t change is reused, so most deploys finish in seconds.',
    className: 'lg:col-span-2',
    media: <BuildsDemo />,
  },
  {
    icon: CommandIcon,
    title: 'A keystroke away',
    description: 'Roll back, tail logs and add domains from any page with ⌘K.',
    className: 'lg:col-span-2',
    media: <PaletteDemo />,
  },
  {
    icon: GaugeIcon,
    title: 'Speed you can see',
    description: 'Time to first byte for every deploy, so a regression has a commit.',
    className: 'md:col-span-2 lg:col-span-2',
    media: <InsightsDemo />,
  },
]

interface FeatureBentoProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<FeatureBentoCopy>
  /** The tiles, in order. Default: the demo's six, each with a live demo. */
  features?: FeatureBentoFeature[]
  /** The heading's level. Default 2. */
  headingLevel?: 1 | 2 | 3
}

/* The Stagger only sequences its direct Reveal children, so each tile is called
 * as a function: the Reveal it returns is the grid cell, span and all. */
function tile({ icon: Icon, title, description, className, media }: FeatureBentoFeature) {
  return (
    <Reveal key={title} className={cn('flex min-w-0', className)}>
      <article data-yj-trigger="" className="flex min-w-0 flex-1 flex-col gap-5 rounded-xl border border-line bg-surface p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="flex items-center gap-2 text-ui-lg font-semibold text-fg">
            <Icon size={18} className="shrink-0 text-accent" />
            {title}
          </h3>
          <p className="text-pretty text-ui text-fg-muted">{description}</p>
        </div>
        {media != null && <div className="flex-1">{media}</div>}
      </article>
    </Reveal>
  )
}

function FeatureBento({ theme, embedded = false, copy: copyProp, features = FEATURES, headingLevel = 2, className, ...rest }: FeatureBentoProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-12', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <Reveal className="flex max-w-2xl flex-col gap-3">
          {copy.eyebrow && <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>}
          <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {copy.title}
          </Title>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        </Reveal>
        <Stagger variant="rise" inView={{ amount: 0.1 }} className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          {features.map(tile)}
        </Stagger>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { FeatureBento }
export type { FeatureBentoProps, FeatureBentoCopy, FeatureBentoFeature }
