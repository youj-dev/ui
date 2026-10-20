'use client'

import type { ReactNode } from 'react'
import { Stagger } from '@youj/motion'
import { HeartIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Timeline, type TimelineEvent, type TimelineEventType } from '../../../components/ui/timeline'
import { cn } from '../../../lib/utils'
import type { ProfileContribution, ProfileCopy, ProfileWork } from './data'
import { Heatmap } from './heatmap'

interface ProfileTabsProps {
  work: ProfileWork[]
  activity: TimelineEvent[]
  activityTypes: Record<string, TimelineEventType>
  contributions?: ProfileContribution[]
  about?: ReactNode
  skills: string[]
  now: number
  locale: string
  copy: ProfileCopy
}

function ProfileTabs({ work, activity, activityTypes, contributions, about, skills, now, locale, copy }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="work" className="min-w-0">
      <TabsList aria-label={copy.tabsLabel}>
        <TabsTrigger value="work">{copy.workTab}</TabsTrigger>
        <TabsTrigger value="activity">{copy.activityTab}</TabsTrigger>
        <TabsTrigger value="about">{copy.aboutTab}</TabsTrigger>
      </TabsList>
      {/* Each tab holds the fullest one's height (Activity, at an app's size): switching never resizes the page. */}
      <TabsContent value="work" className="min-h-131.25">
        {work.length === 0 && <p className="py-10 text-center text-ui text-fg-muted">{copy.emptyWork}</p>}
        <Stagger inView={false} step="base" className="grid gap-4 sm:grid-cols-2">
          {work.map((w) => (
            <Card key={w.id} lift className="gap-0 overflow-hidden py-0">
              {w.media ?? (
                <div aria-hidden className={cn('grid h-36 place-items-center text-4xl', w.tone ?? 'bg-band text-fg', w.face)}>
                  {w.glyph}
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{w.name}</span>
                  <span className="text-ui-sm text-fg-muted">{w.meta}</span>
                </div>
                <span className="flex items-center gap-1 text-ui-sm text-fg-muted tabular-nums">
                  <HeartIcon size={14} />
                  <span className="sr-only">{copy.likes}</span>
                  {w.likes.toLocaleString(locale)}
                </span>
              </div>
            </Card>
          ))}
        </Stagger>
      </TabsContent>
      <TabsContent value="activity" className="flex min-h-131.25 flex-col gap-4">
        <Heatmap now={now} contributions={contributions} locale={locale} copy={copy} />
        <Timeline events={activity} types={activityTypes} />
      </TabsContent>
      <TabsContent value="about" className="min-h-131.25">
        <div className="flex max-w-prose flex-col gap-4 text-ui leading-relaxed">
          {about ?? (
            <>
              <p>
                I grew up reading the hand-painted tiles on Lisbon’s shopfronts, and I’ve been redrawing them ever since. After a decade at a
                foundry in Porto I opened Fundição, a two-person studio for custom and retail type.
              </p>
              <p className="text-fg-muted">Open to commissions for wayfinding, editorial and brand families from spring.</p>
            </>
          )}
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

export { ProfileTabs }
