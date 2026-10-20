'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type ComponentType, type ReactNode } from 'react'
import { useInView } from 'motion/react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ActivityIcon, BellIcon, GaugeIcon, LogsIcon, type IconProps } from '@youj/icons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { cn } from '../../lib/utils'
import { AlertsVisual, LogsVisual, TracesVisual, VitalsVisual } from './feature-tabs/visuals'

/* A feature explorer for Northwind's observability: four features as tabs
 * (a vertical list with taglines on wide screens, a pill strip on phones)
 * beside a large panel that shows the one chosen. It tours itself: the
 * current tab's progress line fills, then the next tab opens. The tour pauses
 * while the pointer or focus is inside it, while it's off screen or the page
 * is hidden, and stops for good once someone picks a tab. Panels arrive with
 * the Tabs drift and their pictures play in: a live log stream, a trace
 * waterfall drawing, vitals rolling to their values, an alert sliding in.
 * Pass your own `features` (each with a `media`) and follow or drive the
 * open one with `value`/`onValueChange`; the heading is in `copy`.
 * Reduced motion: no tour, panels swap in place, pictures are drawn. */

const DWELL = 6000

/** A feature in the explorer: a tab and its panel. */
interface FeatureTabsFeature {
  id: string
  icon: ComponentType<IconProps>
  /** The tab's label. */
  title: string
  /** A line under the label on wide screens, and the panel's heading. */
  tagline: string
  description: string
  /** The panel's picture, decorative. */
  media?: ReactNode
}

const DEFAULT_COPY = {
  eyebrow: 'Observability',
  title: 'See what production is doing, as it happens',
  description: 'Logs, traces, real-user vitals and alerts, split by deploy and built in. Nothing to install, nothing to sample.',
  /** The tab list's accessible name. */
  listLabel: 'Observability features',
}
type FeatureTabsCopy = typeof DEFAULT_COPY

const FEATURES: FeatureTabsFeature[] = [
  {
    id: 'logs',
    icon: LogsIcon,
    title: 'Logs',
    tagline: 'Every request, streamed live',
    description: 'Tail every function in every region as one stream. Filter by deploy, path or status, and jump from a line to its trace.',
    media: <LogsVisual />,
  },
  {
    id: 'traces',
    icon: ActivityIcon,
    title: 'Traces',
    tagline: 'Find the slow span',
    description: 'Each request is traced end to end, through functions, the database and third-party APIs, so the slow 800 ms has a name.',
    media: <TracesVisual />,
  },
  {
    id: 'vitals',
    icon: GaugeIcon,
    title: 'Web Vitals',
    tagline: 'Real users, real devices',
    description: 'LCP, INP and CLS from real visits, per route and per deploy. A regression shows up next to the commit that caused it.',
    media: <VitalsVisual />,
  },
  {
    id: 'alerts',
    icon: BellIcon,
    title: 'Alerts',
    tagline: 'Paged before users notice',
    description: 'Put a threshold on any metric. When it trips, Northwind posts to Slack or pages on-call, with a one-click rollback attached.',
    media: <AlertsVisual />,
  },
]

const WIDE = '(min-width: 64rem)'
function subscribeWide(onChange: () => void) {
  const query = window.matchMedia?.(WIDE)
  query?.addEventListener?.('change', onChange)
  return () => query?.removeEventListener?.('change', onChange)
}
const isWide = () => window.matchMedia?.(WIDE).matches ?? false

interface FeatureTabsProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<FeatureTabsCopy>
  /** The features, one tab each. Default: the demo's four. */
  features?: FeatureTabsFeature[]
  /** The open feature's id, controlled. */
  value?: string
  /** The feature shown first, uncontrolled. Default: the first feature. */
  defaultValue?: string
  /** Called with the next feature's id when someone picks a tab or the tour moves on. */
  onValueChange?: (value: string) => void
  /** Tour the features on its own until someone picks one. Default true (never under reduced motion). */
  autoAdvance?: boolean
  /** The heading's level. Default 2. */
  headingLevel?: 1 | 2 | 3
}

function FeatureTabs({
  theme,
  embedded = false,
  copy: copyProp,
  features = FEATURES,
  value: valueProp,
  defaultValue = features[0]?.id ?? '',
  onValueChange,
  autoAdvance = true,
  headingLevel = 2,
  className,
  ...rest
}: FeatureTabsProps) {
  const k = useYouj()
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const Title = `h${headingLevel}` as const
  const titleId = useId()
  const root = useRef<HTMLDivElement>(null)
  const wide = useSyncExternalStore(subscribeWide, isWide, () => false)
  const [inner, setInner] = useState(defaultValue)
  const value = valueProp ?? inner
  const change = (next: string) => {
    if (valueProp === undefined) setInner(next)
    onValueChange?.(next)
  }
  const [picked, setPicked] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(false)
  const inView = useInView(root, { amount: 0.35 })
  const touring = autoAdvance && !picked && !k.reduced
  const paused = hovered || focused || hidden || !inView

  useEffect(() => {
    const sync = () => setHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  // The current tab's progress line is the tour's clock: when it fills, the next tab opens.
  const tour = useRef<Animation[]>([])
  useEffect(() => {
    if (!touring) return
    const lines = [...(root.current?.querySelectorAll<HTMLElement>(`[data-progress="${value}"]`) ?? [])].filter((el) => typeof el.animate === 'function')
    const animations = lines.map((el) =>
      el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DWELL * k.timeScale, easing: 'linear', fill: 'forwards' }),
    )
    tour.current = animations
    animations[0]?.finished.then(
      () => change(features[(features.findIndex((f) => f.id === value) + 1) % features.length]!.id),
      () => {},
    )
    return () => {
      animations.forEach((a) => a.cancel())
      tour.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the tour restarts on these; what it steps through is read as it runs
  }, [touring, value, k.timeScale, wide])
  useEffect(() => {
    tour.current.forEach((a) => (paused ? a.pause() : a.play()))
  }, [paused, value, touring])

  const line = (id: string, className?: string) => (
    <span aria-hidden className={cn('relative block h-0.5 overflow-hidden rounded-full bg-line', !touring && 'invisible', className)}>
      <span data-progress={id} className="absolute inset-0 origin-left rounded-full bg-accent rtl:origin-right" style={{ transform: 'scaleX(0)' }} />
    </span>
  )

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10 md:gap-12', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <Reveal className="flex max-w-2xl flex-col gap-3">
          {copy.eyebrow && <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>}
          <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {copy.title}
          </Title>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        </Reveal>
        <Reveal>
          <div
            ref={root}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocused(false)}
          >
            <Tabs
              value={value}
              onValueChange={(next) => {
                change(next as string)
                setPicked(true)
              }}
              orientation={wide ? 'vertical' : 'horizontal'}
              className="gap-6 lg:grid lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-start lg:gap-10"
            >
              <div className="flex min-w-0 flex-col gap-3">
                <TabsList variant={wide ? 'underline' : 'pill'} aria-label={copy.listLabel} className={cn(wide && 'w-full')}>
                  {features.map((f) => (
                    <TabsTrigger
                      key={f.id}
                      value={f.id}
                      className={cn(wide && 'h-auto w-full flex-col items-stretch gap-1.5 py-3 ps-4 pe-3 text-start whitespace-normal')}
                    >
                      <span className="flex items-center gap-2">
                        <f.icon size={16} className={cn('shrink-0 max-sm:hidden', f.id === value ? 'text-accent' : 'text-fg-muted')} />
                        {f.title}
                      </span>
                      {wide && (
                        <>
                          <span className="text-ui-sm font-normal text-fg-muted">{f.tagline}</span>
                          {line(f.id, 'mt-1.5')}
                        </>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {!wide && line(value)}
              </div>
              {features.map((f) => (
                <TabsContent key={f.id} value={f.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
                  <div className="flex flex-col gap-1.5 p-5 sm:p-6">
                    <h3 className="text-ui-lg font-semibold text-fg">{f.tagline}</h3>
                    <p className="max-w-xl text-pretty text-ui text-fg-muted">{f.description}</p>
                  </div>
                  {f.media != null && (
                    <div aria-hidden inert className="h-[21rem] border-t border-line bg-transparent p-3 sm:p-5">
                      {f.media}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </Reveal>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { FeatureTabs }
export type { FeatureTabsProps, FeatureTabsCopy, FeatureTabsFeature }
