'use client'

import type { ElementType } from 'react'
import { Counter } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { cn, initials } from '../../../lib/utils'
import type { SocialProofCopy, SocialProofLogo, SocialProofStory } from './data'

/* The featured customer story, set as an editorial panel: the customer's
 * mark and the headline on the inline start with the way into the full
 * story, the quote large on the end with who said it, and the results
 * across the foot, each a number that rolls up when the story opens. A tab
 * per story sits over it (so every story is reachable without the logo
 * wall); switching drifts the new story in while the panel's height follows. */

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

interface StoryCardProps {
  stories: SocialProofStory[]
  logos: SocialProofLogo[]
  value: string
  onValueChange: (id: string) => void
  locale: string
  copy: SocialProofCopy
  Link: ElementType
  headingLevel: number
}

export function StoryCard({ stories, logos, value, onValueChange, locale, copy, Link, headingLevel }: StoryCardProps) {
  const Heading = `h${headingLevel}` as 'h3'
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as string)} className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn('text-ui-sm font-medium text-fg-muted', VOICE)}>{copy.storyEyebrow}</p>
        {stories.length > 1 && (
          <TabsList variant="pill" aria-label={copy.storyEyebrow}>
            {stories.map((story) => (
              <TabsTrigger key={story.id} value={story.id}>
                {story.customer}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
      </div>
      {stories.map((story) => {
        const mark = logos.find((logo) => logo.name === story.customer)?.mark
        return (
          <TabsContent key={story.id} value={story.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
              <div className="flex flex-col items-start gap-5">
                <p className="flex items-center gap-2 text-ui font-semibold text-fg">
                  {mark && (
                    <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
                      {mark}
                    </svg>
                  )}
                  {story.customer}
                </p>
                <Heading className="text-balance text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{story.headline}</Heading>
                <Link
                  href={story.href}
                  onClick={story.onClick}
                  className="group/story mt-auto inline-flex items-center gap-1.5 rounded-sm text-ui font-medium text-fg underline-offset-4 hover:underline focus-ring"
                >
                  {copy.readStory}
                  <ArrowRightIcon size={15} className="transition-transform yj-duration-fast ease-standard group-hover/story:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/story:-translate-x-0.5" />
                </Link>
              </div>
              <figure className="flex flex-col gap-5 lg:border-s lg:border-line lg:ps-12">
                <blockquote className="text-pretty text-ui-lg leading-relaxed text-fg sm:text-xl">
                  <p>“{story.quote}”</p>
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <Avatar>
                    {story.author.avatar && <AvatarImage src={story.author.avatar} alt="" />}
                    <AvatarFallback>{initials(story.author.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex flex-col">
                    <span className="text-ui font-medium text-fg">{story.author.name}</span>
                    <span className="text-ui-sm text-fg-muted">{story.author.role}</span>
                  </span>
                </figcaption>
              </figure>
            </div>
            <dl aria-label={copy.results} className="grid grid-cols-3 border-t border-line">
              {story.metrics.map((metric, i) => (
                <div key={metric.label} className={cn('flex flex-col-reverse gap-1 px-4 py-5 sm:px-8', i > 0 && 'border-s border-line')}>
                  <dt className="text-ui-sm text-fg-muted">{metric.label}</dt>
                  <dd className="flex items-baseline text-2xl font-semibold tracking-tight text-fg tabular-nums sm:text-4xl">
                    <Counter value={metric.value} mode="roll" format={metric.format} locale={locale} duration="deliberate" />
                    {metric.suffix && <span className="ms-0.5 text-lg text-fg-muted sm:text-xl">{metric.suffix}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
