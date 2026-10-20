'use client'

import { useId, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { cn, numberFormat } from '../../../lib/utils'
import type { StagePipelineRun } from './data'
import { TIMING_COPY, TIMING_GROUPS, TIMING_RUN, type StagePipelineTimingCopy, type StagePipelineTimingGroup, type StagePipelineTimingResult, type StagePipelineTimingStep } from './timing-data'

/* A finished run read as time: the steps grouped (Build, Deploy), each with
 * when it started, how long it took and a bar for it; a strip across the top
 * cuts the whole run into its groups by time; and the result line closes it.
 * A step that has a `previous` time is compared with it: when it got faster
 * the earlier time is a longer ghost bar behind the bar and the gain
 * is named in the success tone, and when it got slower the overshoot is drawn
 * in the danger tone past the ghost. A skipped step has no bar, only the word.
 * Every bar shares one scale, so bars compare across groups. Times are text
 * too (the bars and the strip are decorative, the strip is one named image),
 * so nothing is carried by color alone. */

interface StagePipelineRunTimingProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Take the whole width it's given instead of stopping at its natural width (1024px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<StagePipelineTimingCopy>
  /** The run these steps belong to: its name, number and target. Default: the demo run. */
  run?: Pick<StagePipelineRun, 'id' | 'name' | 'target'>
  /** The steps by group, in order, with `start` and `took` in ms and an optional `previous` to compare against. Default: the demo run's build and deploy. */
  groups?: StagePipelineTimingGroup[]
  /** Where the run ended up. Pass it and the footer says "Live on <location>" with the time; leave it out and the footer is not drawn. */
  result?: StagePipelineTimingResult
  /** Formats durations and counts. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
}

/** Changes under this share of the earlier time (or under a second) are noise, not a regression or a gain. */
const NOISE = 0.05

/** How long it ran, in the locale's short unit form. */
function span(ms: number, locale: string) {
  const s = Math.round(ms / 1000)
  const unit = (value: number, name: 'second' | 'minute') => numberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'narrow' }).format(value)
  return s < 60 ? unit(s, 'second') : s % 60 === 0 ? unit(s / 60, 'minute') : `${unit(Math.floor(s / 60), 'minute')} ${unit(s % 60, 'second')}`
}

/** Where a step started on the run's clock: "+0:04". */
const offset = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `+${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const verdict = (step: StagePipelineTimingStep) => {
  if (step.skipped || step.previous === undefined) return 'same' as const
  const change = step.took - step.previous
  return Math.abs(change) < 1000 || Math.abs(change) / step.previous < NOISE ? 'same' : change > 0 ? ('slower' as const) : ('faster' as const)
}

const GROUP_TONE = ['bg-accent', 'bg-success', 'bg-warning', 'bg-fg-muted']

function StagePipelineRunTiming({ theme, fill = false, copy: copyProp, run = TIMING_RUN, groups = TIMING_GROUPS, result, locale, className, ...rest }: StagePipelineRunTimingProps) {
  const copy = { ...TIMING_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const fmt = (ms: number) => span(ms, copy.locale)

  const steps = groups.flatMap((g) => g.steps)
  const ran = steps.filter((s) => !s.skipped)
  const total = Math.max(0, ...ran.map((s) => s.start + s.took))
  // One scale for every bar: the longest of any step's time and its earlier time.
  const scale = Math.max(1, ...ran.map((s) => Math.max(s.took, s.previous ?? 0)))
  const pct = (ms: number) => `${(ms / scale) * 100}%`
  const lengths = groups.map((g) => g.steps.filter((s) => !s.skipped).reduce((sum, s) => sum + s.took, 0))
  const strip = copy.stripLabel(groups.map((g, i) => `${g.name} ${fmt(lengths[i]!)}`).join(', '))

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-5xl', className)}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <h2 id={titleId}>{copy.title(run.name)}</h2>
          </CardTitle>
          <CardDescription>{copy.subtitle(run.id, run.target)}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <div role="img" aria-label={strip} data-slot="timing-strip" className="flex h-3 gap-0.75">
            {groups.map((g, i) => (
              <span key={g.id} className={cn('min-w-1 rounded-[2px]', GROUP_TONE[i % GROUP_TONE.length])} style={{ flexGrow: Math.max(lengths[i]!, 1), flexBasis: 0 }} />
            ))}
          </div>
          <div aria-hidden className="flex gap-0.75 text-ui text-fg-muted tabular-nums">
            {groups.map((g, i) => (
              <span key={g.id} className="flex min-w-0 items-baseline gap-1.5 truncate" style={{ flexGrow: Math.max(lengths[i]!, 1), flexBasis: 0 }}>
                <span className="truncate">{g.name}</span>
                <span className="text-fg">{fmt(lengths[i]!)}</span>
              </span>
            ))}
          </div>
        </CardContent>

        {groups.map((group) => (
          <CardContent key={group.id} className="flex flex-col gap-1">
            <h3 className="text-ui font-medium text-fg-muted">{group.name}</h3>
            <ul className="flex flex-col">
              {group.steps.map((step) => {
                const change = verdict(step)
                const delta = Math.abs(step.took - (step.previous ?? 0))
                const kept = change === 'slower' ? step.previous! : step.took
                return (
                  <li
                    key={step.id}
                    data-slot="timing-step"
                    data-state={step.skipped ? 'skipped' : change}
                    className="grid min-h-12 grid-cols-[minmax(0,--spacing(52))_--spacing(14)_minmax(0,1fr)_--spacing(16)] items-center gap-x-4 gap-y-1 border-b border-line-subtle py-2.5 last:border-b-0"
                  >
                    <span className={cn('min-w-0 truncate text-ui-lg text-fg', step.skipped && 'text-fg-muted')}>{step.name}</span>
                    <span className="font-mono text-ui text-fg-muted tabular-nums">{offset(step.start)}</span>
                    {step.skipped ? (
                      <span className="col-span-2 flex items-center gap-3 text-ui-sm text-fg-muted">
                        <span aria-hidden className="h-px flex-1 border-t border-dashed border-line-strong" />
                        {copy.skipped}
                      </span>
                    ) : (
                      <>
                        <div aria-hidden className="relative h-2.5">
                          {step.previous !== undefined && change !== 'same' && (
                            <span className="absolute inset-y-0 start-0 rounded-[2px] bg-line-strong" style={{ width: pct(step.previous) }} />
                          )}
                          <span className="absolute inset-y-0 start-0 rounded-[2px] bg-fg" style={{ width: pct(kept) }} />
                          {change === 'slower' && (
                            <span className="absolute inset-y-0 rounded-e-[2px] bg-danger" style={{ insetInlineStart: pct(step.previous!), width: pct(delta) }} />
                          )}
                        </div>
                        <span className="text-end text-ui-lg font-medium text-fg tabular-nums">{fmt(step.took)}</span>
                      </>
                    )}
                    {!step.skipped && change !== 'same' && (
                      <span className={cn('col-span-2 col-start-3 flex flex-wrap justify-between gap-x-2 text-ui tabular-nums', change === 'slower' ? 'text-danger-text' : 'text-success-text')}>
                        <span>{change === 'slower' ? copy.slower(fmt(delta)) : copy.faster(fmt(delta))}</span>
                        <span className="text-fg-muted">{copy.was(fmt(step.previous!))}</span>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </CardContent>
        ))}

        {result && (
          <CardFooter className="font-sans text-ui font-medium tracking-normal text-fg normal-case">
            <p className="me-auto inline-flex items-center gap-2 text-start font-sans tracking-normal normal-case">
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-success" />
              {copy.live(result.location, fmt(result.took ?? total))}
            </p>
          </CardFooter>
        )}
      </Card>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { StagePipelineRunTiming, type StagePipelineRunTimingProps }
