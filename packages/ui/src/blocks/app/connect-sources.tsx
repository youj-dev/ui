'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { ShareBar } from '../../components/ui/share-bar'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, SOURCES, demo, type ConnectSourcesCopy, type DataSource, type SourceStatus } from './connect-sources/data'
import { Strip } from './connect-sources/strip'
import { Tile } from './connect-sources/tile'

/* A setup step for a product that takes in data: plug in your sources. Over the tiles
 * an isometric power strip (the illustrations kit) has a plug in each
 * connected source's color, the backfilling one hovering over its socket,
 * and empty sockets for the rest. Each tile says where its source stands
 * with a small histogram of its day: events a day once connected, how far a
 * backfill has come, or the coverage it would add, with a Connect button.
 * The foot sums the coverage on a segmented meter, one color per source,
 * beside Skip for now and Continue. Connect awaits `onConnect`, then plugs
 * the source in; pass `illustration={null}` to drop the drawing.
 * Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the strip is drawn in place and the meter lands at once. */

interface ConnectSourcesProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<ConnectSourcesCopy>
  /** Formats counts and shares (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The sources, in the order of the strip's sockets. */
  sources?: DataSource[]
  /** Formats a connected source's volume per day, before `copy.perDay` adds the unit. Default: the locale's compact number format ("4.1K"). */
  format?: (perDay: number) => string
  /** The drawing over the tiles. Default: the power strip; `null` for none. */
  illustration?: ReactNode
  /** Connects a source; the card awaits it, then shows it connected. */
  onConnect?: (source: DataSource) => Promise<unknown> | unknown
  onSkip?: () => void
  onContinue?: () => void
}

function ConnectSources({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  sources: sourcesProp = SOURCES,
  format,
  illustration,
  onConnect,
  onSkip,
  onContinue,
  ...rest
}: ConnectSourcesProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [plugged, setPlugged] = useState<ReadonlySet<string>>(new Set())
  const [pending, setPending] = useState<string | null>(null)
  const sources = sourcesProp.map((s) => (plugged.has(s.id) && s.status === 'available' ? { ...s, status: 'connected' as SourceStatus } : s))
  const live = sources.filter((s) => s.status !== 'available')
  const coverage = live.reduce((sum, s) => sum + s.coverage, 0)
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })

  const connect = async (source: DataSource) => {
    setPending(source.id)
    try {
      await (onConnect ? onConnect(source) : demo('ConnectSources: onConnect', 800))
      setPlugged((prev) => new Set(prev).add(source.id))
      announce(copy.announceConnected(source.label))
    } catch {
      announce(copy.failed(source.label))
    } finally {
      setPending(null)
    }
  }

  const card = (
    <Card data-slot="connect-sources" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-md')}>
      <header className="flex items-start justify-between gap-3 px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-(--ui--panel-y)">
        <div className="flex min-w-0 flex-col gap-1">
          <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
            {copy.title}
          </Title>
          <p className="text-ui text-fg-muted">{copy.subtitle}</p>
        </div>
        {/* A sentence, not a label: it keeps its case in a theme that sets badges in capitals. */}
        <Badge variant="secondary" size="lg" className="font-sans text-ui tracking-normal normal-case tabular-nums">
          {copy.connectedCount(live.length, sources.length)}
        </Badge>
      </header>

      {illustration !== null && (
        <div
          aria-hidden
          data-slot="connect-sources-illustration"
          className="flex justify-center overflow-hidden border-t border-line px-(--ui--panel-x) pt-2"
        >
          {illustration ?? <Strip sources={sources} />}
        </div>
      )}

      <div className="@container border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <ul aria-label={copy.sourcesLabel} className="grid grid-cols-2 gap-2 @sm:grid-cols-3">
          {sources.map((source) => (
            <Tile key={source.id} source={source} copy={copy} locale={locale} format={format} pending={pending === source.id} onConnect={() => connect(source)} />
          ))}
        </ul>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <div className="flex min-w-0 flex-1 basis-44 items-center gap-2.5">
          <span className="text-ui text-fg-muted">{copy.coverage}</span>
          <ShareBar
            parts={live.map((s) => ({ value: s.coverage, tone: s.tone, label: s.label }))}
            max={1}
            segments={12}
            label={copy.coverage}
            valueText={percent.format(coverage)}
            className="w-24 min-w-0 flex-1"
          />
          <span className="font-mono text-ui text-fg tabular-nums">{percent.format(coverage)}</span>
        </div>
        <div className="ms-auto flex gap-2">
          <Button variant="secondary" onClick={onSkip}>
            {copy.skip}
          </Button>
          <Button onClick={onContinue}>{copy.continue}</Button>
        </div>
      </footer>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { ConnectSources, type ConnectSourcesProps }
export type { ConnectSourcesCopy, DataSource, SourceStatus }
