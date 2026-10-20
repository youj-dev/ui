'use client'

import { useId, useMemo, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useIsPhone } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, LOGOS, RATING, STORIES } from './social-proof/data'
import type { SocialProofCopy, SocialProofLogo, SocialProofMetric, SocialProofRating, SocialProofSource, SocialProofStory } from './social-proof/data'
import { LogoWall } from './social-proof/logo-wall'
import { RatingSummary } from './social-proof/ratings'
import { StoryCard } from './social-proof/story-card'

/* Who else uses it, in one section. The rating summary (an average that
 * rolls up, the 5-to-1-star split, the review sites), the customers' wordmarks
 * on a hairline grid lit by the kit Spotlight, with an industry filter (the
 * grid re-flows as you filter), and the featured customer story as an
 * editorial panel whose results roll up: open one from its tab or by
 * choosing its wordmark (a dot marks the customers with a story, and
 * pointing at one says so). Quotes live on the Testimonial wall.
 * Reduced motion: no light, lift, re-flow glide or count-up.
 * Pass your own `logos`, `stories` and `rating`, follow or drive the filter
 * and the open story (`industry` and `story`), and set `locale`; every
 * string is in `copy`. */

type HeadingLevel = 1 | 2 | 3

interface SocialProofProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The customer wall; each logo names its industry. Default: the demo's sixteen. */
  logos?: SocialProofLogo[]
  /** The featured stories, one tab each; a logo whose name is a story's `customer` opens it. Default: the demo's three. */
  stories?: SocialProofStory[]
  /** The rating summary; `null` hides it. Default: the demo's 4.8 from 2,314 reviews. */
  rating?: SocialProofRating | null
  /** The industry filter's value (`''` is all), controlled. */
  industry?: string
  /** The industry shown first, uncontrolled. Default all. */
  defaultIndustry?: string
  /** Called with the industry the visitor picked (`''` for all). */
  onIndustryChange?: (industry: string) => void
  /** The open story's id, controlled. */
  story?: string
  /** The story shown first, uncontrolled. Default: the first. */
  defaultStory?: string
  /** Called with the id of the story the visitor opened. */
  onStoryChange?: (id: string) => void
  /** Show skeletons in place of the wall, while the data loads. Default false. */
  loading?: boolean
  /** The locale numbers are written in. Default: the YoujProvider's. */
  locale?: string
  /** Renders the story's link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The section heading's level; the open story's heading sits one below. Default 2. */
  headingLevel?: HeadingLevel
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SocialProofCopy>
}

function SocialProof({
  theme,
  embedded = false,
  logos = LOGOS,
  stories = STORIES,
  rating = RATING,
  industry: industryProp,
  defaultIndustry = '',
  onIndustryChange,
  story: storyProp,
  defaultStory = stories[0]?.id ?? '',
  onStoryChange,
  loading = false,
  locale: localeProp,
  linkComponent: Link = 'a',
  headingLevel = 2,
  copy: copyProp,
  className,
  ...rest
}: SocialProofProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const [industry, setIndustry] = useControllableState(industryProp, defaultIndustry)
  const [storyId, setStoryId] = useControllableState(storyProp, defaultStory)
  // Phones get a select: the row of segments would run off the screen.
  const phone = useIsPhone()
  const pickIndustry = (next: string) => {
    const value = next === 'all' ? '' : next
    setIndustry(value)
    onIndustryChange?.(value)
  }
  const industries = useMemo(() => [...new Set(logos.map((logo) => logo.industry))], [logos])
  const shown = industry ? logos.filter((logo) => logo.industry === industry) : logos
  const withStory = useMemo(() => new Set(stories.map((s) => s.customer)), [stories])
  const open = stories.find((s) => s.id === storyId) ?? stories[0]
  const pickStory = (id: string) => {
    setStoryId(id)
    onStoryChange?.(id)
  }
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-12', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <Reveal className="flex max-w-2xl flex-col gap-4">
            <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          </Reveal>
          {rating && <RatingSummary rating={rating} locale={locale} copy={copy} />}
        </div>

        <div className="flex flex-col gap-5">
          {industries.length > 1 && (
            phone ? (
              <Select items={{ all: copy.all, ...Object.fromEntries(industries.map((name) => [name, name])) }} value={industry || 'all'} onValueChange={(next) => next && pickIndustry(next)}>
                <SelectTrigger aria-label={copy.filterLabel} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.all}</SelectItem>
                  {industries.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <SegmentedControl value={industry || 'all'} onValueChange={pickIndustry} aria-label={copy.filterLabel} className="self-start">
                <SegmentedControlItem value="all">{copy.all}</SegmentedControlItem>
                {industries.map((name) => (
                  <SegmentedControlItem key={name} value={name}>
                    {name}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            )
          )}
          {/* Every logo's height at 100%: an industry's fewer logos never move the story under it. */}
          <div className="h-97.5 overflow-y-auto yj-scrollbar">
            <LogoWall
              logos={shown}
              stories={withStory}
              openCustomer={open?.customer}
              onOpen={(customer) => pickStory(stories.find((s) => s.customer === customer)!.id)}
              loading={loading}
              copy={copy}
              label={copy.wall(industry || copy.all)}
            />
          </div>
        </div>

        {open && <StoryCard stories={stories} logos={logos} value={open.id} onValueChange={pickStory} locale={locale} copy={copy} Link={Link} headingLevel={headingLevel + 1} />}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { SocialProof }
export type { SocialProofProps, SocialProofCopy, SocialProofLogo, SocialProofStory, SocialProofMetric, SocialProofRating, SocialProofSource }
