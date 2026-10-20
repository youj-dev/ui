'use client'

import { useId, useState } from 'react'
import { ChartSplineIcon, LayersIcon, ShieldIcon, SparklesIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Progress, ProgressLabel, ProgressValue } from '../../../components/ui/progress'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Switch } from '../../../components/ui/switch'
import { SITE } from './data'

/* The page being re-themed: Lumen's landing page in miniature, built only
 * from the kit (nav, badge, headline, an email form, a product card with a
 * segmented range, meters and a switch, three feature cards), so every
 * choice lands on real components. It works: the range and the switch
 * respond, the form doesn't send. The links are inert (it's a picture of a
 * site) and hidden from the tab order. */

const FEATURE_ICONS = [ChartSplineIcon, LayersIcon, ShieldIcon]

export function SitePreview({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const Headline = headingLevel === 2 ? 'h2' : 'h3'
  const emailId = useId()
  const switchId = useId()
  const [range, setRange] = useState(SITE.ranges[0]!)
  const [emailMe, setEmailMe] = useState(true)
  const scale = range === SITE.ranges[0] ? 1 : 0.92

  return (
    <div className="@container flex flex-col bg-surface text-fg">
      <nav aria-label={`${SITE.name} (preview)`} className="flex items-center gap-4 border-b border-line px-4 py-3 @xl:px-6">
        <span className="flex items-center gap-2 text-ui font-semibold tracking-tight">
          <span aria-hidden className="grid size-6 place-items-center rounded-sm bg-accent text-on-accent">
            <SparklesIcon size={13} strokeWidth={2} />
          </span>
          {SITE.name}
        </span>
        <ul className="flex items-center gap-4 text-ui-sm text-fg-muted @max-lg:hidden">
          {SITE.links.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <span className="ms-auto flex items-center gap-1.5">
          <Button variant="ghost" size="sm" tabIndex={-1} className="@max-md:hidden">
            {SITE.signIn}
          </Button>
          <Button size="sm" tabIndex={-1}>
            {SITE.start}
          </Button>
        </span>
      </nav>

      <div className="grid gap-8 px-4 pt-8 pb-6 @xl:px-6 @3xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] @3xl:items-center @3xl:pt-10">
        <div className="flex flex-col items-start gap-4">
          <Badge variant="outline" className="gap-1.5">
            <span className="text-accent-text">{SITE.badge}</span>
            {SITE.badgeText}
          </Badge>
          <Headline className="text-[length:clamp(1.75rem,5cqi,2.5rem)] leading-[1.08] font-semibold tracking-tight text-balance">{SITE.headline}</Headline>
          <p className="max-w-md text-ui-lg text-fg-muted text-pretty">{SITE.lede}</p>
          <form className="flex w-full max-w-md flex-col gap-2 @md:flex-row" onSubmit={(e) => e.preventDefault()}>
            <Label htmlFor={emailId} className="sr-only">
              {SITE.email}
            </Label>
            <Input id={emailId} type="email" placeholder={SITE.emailPlaceholder} className="flex-1" />
            <Button type="submit">{SITE.cta}</Button>
          </form>
          <p className="text-ui-sm text-fg-muted">{SITE.note}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{SITE.digest}</CardTitle>
            <CardDescription>{SITE.digestNote}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SegmentedControl aria-label={SITE.range} value={range} onValueChange={setRange} className="w-full">
              {SITE.ranges.map((r) => (
                <SegmentedControlItem key={r} value={r} className="flex-1">
                  {r}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
            {SITE.metrics.map((m) => (
              <Progress key={m.label} value={Math.round(m.share * scale)}>
                <ProgressLabel>{m.label}</ProgressLabel>
                <ProgressValue />
              </Progress>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <Label htmlFor={switchId}>{SITE.emailMe}</Label>
              <Switch id={switchId} checked={emailMe} onCheckedChange={setEmailMe} />
            </div>
          </CardContent>
        </Card>
      </div>

      <ul className="grid gap-3 px-4 pb-8 @max-xl:hidden @xl:grid-cols-3 @xl:px-6">
        {SITE.features.map((f, i) => {
          const Icon = FEATURE_ICONS[i]!
          return (
            <li key={f.title}>
              <Card size="sm" className="h-full">
                <CardContent className="flex flex-col gap-1.5">
                  <span aria-hidden className="mb-1.5 grid size-8 place-items-center rounded-md bg-accent-subtle text-accent-text">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.text}</CardDescription>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
