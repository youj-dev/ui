'use client'

import { useId, type ComponentProps } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { Reveal, Stagger } from '@youj/motion'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, METRICS, MILESTONES, VALUES, type AboutCopy, type AboutMetric, type AboutMilestone, type AboutValue } from './about/data'
import { Timeline } from './about/timeline'

/* Who is behind the product, told as a story you can scrub. The mission set large over a line; then the story as an
 * instrument: a rail of years under a growth line the block draws, where picking a year rolls the figures to how
 * they stood, draws the line up to it and swaps the chapter in. In view it plays through the years once, holding
 * under the pointer or keyboard focus, off screen and in a hidden tab, and stops for good when someone picks a year;
 * a button pauses, plays or plays it again. Then the values, a numbered row whose rule inks under the pointer. The
 * people and the open roles are sections of their own (Team, Careers). Reduced motion: no tour, the story rests on
 * its last chapter, and a pick swaps at once.
 *
 * Pass your own `milestones` (each with the `figures` of your `metrics`) and `values`, follow or drive the year
 * shown (`value`), and set `locale`; every string is in `copy`. */

type HeadingLevel = 1 | 2 | 3

interface AboutProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The story's chapters, oldest first; `[]` hides the timeline. Default: the demo's seven years. */
  milestones?: AboutMilestone[]
  /** The numbers the story is told in, each milestone giving its figure. Default: people, teams and regions. */
  metrics?: AboutMetric[]
  /** The values; `[]` hides the part. Default: the demo's four. */
  values?: AboutValue[]
  /** The milestone shown (its `id`, or its label), controlled. */
  value?: string
  /** The milestone shown first, uncontrolled. Default: the first while the story plays, else the last. */
  defaultValue?: string
  /** Called with the milestone's id when someone picks one or the story moves on. */
  onValueChange?: (value: string) => void
  /** Play through the years once, in view. Default true (never under reduced motion). */
  autoAdvance?: boolean
  /** The locale the figures are written in. Default: the YoujProvider's. */
  locale?: string
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<AboutCopy>
  /** The section heading's level; the parts' headings sit one below. Default 2. */
  headingLevel?: HeadingLevel
}

function About({
  theme,
  embedded = false,
  milestones = MILESTONES,
  metrics = METRICS,
  values = VALUES,
  value: valueProp,
  defaultValue,
  onValueChange,
  autoAdvance = true,
  locale: localeProp,
  copy: copyProp,
  headingLevel = 2,
  className,
  ...rest
}: AboutProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const k = useYouj()
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const Part = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const Item = `h${headingLevel + 2}` as 'h3' | 'h4' | 'h5'
  const ids = milestones.map((ms) => ms.id ?? ms.label)
  // The story starts at its beginning when it's going to play, else at today.
  const plays = autoAdvance && !k.reduced && milestones.length > 1
  const [value, setValue] = useControllableState(valueProp, defaultValue ?? (plays ? ids[0] : ids.at(-1)) ?? '')
  const index = Math.max(0, ids.indexOf(value))
  const go = (next: number) => {
    const id = ids[next]
    if (id === undefined) return
    setValue(id)
    onValueChange?.(id)
  }

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-14 md:gap-16', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <Reveal className="flex flex-col gap-5">
          {copy.eyebrow && <p className="text-ui-sm font-medium text-fg-muted">{copy.eyebrow}</p>}
          <Title id={titleId} className="max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl md:leading-[1.05]">
            {copy.mission}
          </Title>
          {copy.description && <p className="max-w-2xl text-pretty text-ui-lg text-fg-muted">{copy.description}</p>}
        </Reveal>

        {milestones.length > 0 && (
          <Timeline
            milestones={milestones}
            metrics={metrics}
            index={index}
            onChange={go}
            autoAdvance={autoAdvance}
            copy={copy}
            locale={locale}
            headingLevel={headingLevel + 1}
          />
        )}

        {values.length > 0 && (
          <div className="flex flex-col gap-6">
            <Part className="text-ui-lg font-semibold">{copy.valuesTitle}</Part>
            <Stagger as="ol" itemAs="li" variant="rise" className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4" itemClassName="flex">
              {values.map((v, i) => (
                <div key={v.title} className="group/value relative flex flex-1 flex-col gap-2.5 pt-5">
                  {/* The rule inks from its start under the pointer. */}
                  <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-line">
                    <span className="absolute inset-0 origin-left scale-x-0 bg-fg transition-transform yj-duration-slow ease-emphasized group-hover/value:scale-x-100 rtl:origin-right" />
                  </span>
                  <span className="flex items-center justify-between text-fg-muted">
                    <span aria-hidden className="font-mono text-ui-sm tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {v.icon && <span aria-hidden>{v.icon}</span>}
                  </span>
                  <Item className="text-ui-lg font-semibold">{v.title}</Item>
                  <p className="text-pretty text-ui text-fg-muted">{v.description}</p>
                </div>
              ))}
            </Stagger>
          </div>
        )}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { About }
export type { AboutProps, AboutCopy, AboutMetric, AboutMilestone, AboutValue }
