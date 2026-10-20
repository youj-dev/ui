'use client'

import { useId, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { AsyncButton } from '../../components/ui/async-button'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, DEMO_NOW, REASONS, STATUSES, TILES, demo, type TileBoardCopy, type TileBoardReason, type TileBoardResponder, type TileBoardStatus, type TileBoardTile, type TileBoardTone } from './tile-board/data'
import { Panel } from './tile-board/panel'
import { Tiles } from './tile-board/tiles'
import { useClock } from './tile-board/use-clock'

/* A grid of things at a glance (a line's stations, checkout lanes, hospital
 * beds), and the one that needs someone in hand. A tile per thing in one of
 * your statuses, with its note or cycle time; the status marked `alert` is
 * the one the board handles: its tile runs a timer, and selecting it shows the
 * panel under the grid with the reason as one choice, who is coming and in how
 * long, and a ring counting down to the escalation. Escalate now pages at
 * once; Resolve returns the tile to the first status that isn't the alert. The
 * panel holds one height for every status, so selecting never resizes the
 * card. The timers count on their own clock only while `now` is left out, and
 * stop in a hidden tab. Reduced motion: nothing animates.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface TileBoardProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<TileBoardCopy>
  /** Formats its numbers (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The tiles, in grid order. */
  tiles?: TileBoardTile[]
  /** The statuses a tile can be in. The one marked `alert` is handled by the board. Default: running, idle, on hold, stopped. */
  statuses?: TileBoardStatus[]
  /** The reasons an alert can have. */
  reasons?: TileBoardReason[]
  /** Write the figures yourself: a tile's cycle time (seconds) and a responder's arrival (minutes). Default: the locale's number with `copy.cycle` and `copy.eta`. */
  format?: { cycle?: (seconds: number) => string; eta?: (minutes: number) => string }
  /** The moment the timers count from (a date, a date-time string or a timestamp). Leave it out and the block runs its own second-by-second clock from a demo moment; pass it and re-render as time passes. */
  now?: Date | string | number
  /** The tile selected at first. Default: the first one in the alert status. */
  defaultSelected?: string
  /** Shows a dashed "Demo data" badge while the card runs on its demo tiles (no `tiles` passed). Default true. */
  demoMarker?: boolean
  /** Called when the reason changes, with the tile and the reason's id. */
  onReasonChange?: (tile: TileBoardTile, reasonId: string) => void
  /** Called by Escalate now. */
  onEscalate?: (tile: TileBoardTile) => unknown
  /** Called by Resolve; resolve the promise when the tile is back to normal. Default: a short demo wait. */
  onResolve?: (tile: TileBoardTile) => Promise<unknown> | unknown
}

const BADGE: Partial<Record<TileBoardTone, 'danger' | 'warning' | 'default'>> = { danger: 'danger', warning: 'warning', success: 'default', neutral: 'default' }

function TileBoard({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  tiles = TILES,
  statuses = STATUSES,
  reasons = REASONS,
  format,
  now,
  defaultSelected,
  demoMarker = true,
  onReasonChange,
  onEscalate,
  onResolve,
  className,
  ...rest
}: TileBoardProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const simulated = tiles === TILES
  const clock = useClock(now === undefined)
  const moment = new Date(now ?? DEMO_NOW).getTime() + clock
  const alertStatus = statuses.find((st) => st.alert)
  const resting = statuses.find((st) => !st.alert) ?? statuses[0]
  const count = numberFormat(locale)
  const cycle = format?.cycle ?? ((seconds: number) => copy.cycle(count.format(seconds)))
  const eta = format?.eta ?? ((minutes: number) => copy.eta(count.format(minutes)))
  const [selected, setSelected] = useState(defaultSelected ?? tiles.find((t) => t.status === alertStatus?.id)?.id ?? tiles[0]?.id ?? '')
  const [chosen, setChosen] = useState<Record<string, string>>({})
  const [escalated, setEscalated] = useState<ReadonlySet<string>>(new Set())
  const [resolved, setResolved] = useState<ReadonlySet<string>>(new Set())

  const tile = tiles.find((t) => t.id === selected) ?? tiles[0]
  const statusOf = (t: TileBoardTile) => (resolved.has(t.id) ? resting : (statuses.find((st) => st.id === t.status) ?? resting))
  const alerts = tiles.filter((t) => statusOf(t)?.alert).length
  const status = tile ? statusOf(tile) : undefined
  const handled = !!status?.alert

  const resolve = async () => {
    if (!tile) return
    await (onResolve ? onResolve(tile) : demo('TileBoard: onResolve', 900))
    setResolved((prev) => new Set(prev).add(tile.id))
    announce(copy.announceResolved(tile.name))
  }

  const card = (
    <Card data-slot="tile-board" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader className="py-(--card-spacing)">
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{copy.title}</Title>
          {simulated && demoMarker && (
            // shape: the documented dashed marker draws its own edge
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="tabular-nums">{copy.subtitle(tiles.length)}</CardDescription>
        <CardAction>
          {/* A sentence, not a label: it keeps its case in a theme that sets badges in capitals. */}
          <Badge variant={alerts ? (BADGE[alertStatus?.tone ?? 'danger'] ?? 'danger') : 'success'} size="lg" className="font-sans text-ui tracking-normal normal-case">
            {alerts ? copy.alertCount(alerts) : copy.allClear}
          </Badge>
        </CardAction>
      </CardHeader>

      <div className="px-(--ui--panel-x) pb-(--ui--panel-y)">
        <Tiles tiles={tiles} statuses={statuses} selected={tile?.id ?? ''} resolved={resolved} now={moment} copy={copy} cycle={cycle} onSelect={setSelected} />
      </div>

      <div className="border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        {tile && status && (
          <Panel
            tile={tile}
            status={status}
            reasons={reasons}
            reason={chosen[tile.id] ?? tile.reason ?? ''}
            escalated={escalated.has(tile.id)}
            now={moment}
            copy={copy}
            eta={eta}
            headingLevel={embedded ? 'h3' : 'h2'}
            onReasonChange={(id) => {
              setChosen((prev) => ({ ...prev, [tile.id]: id }))
              onReasonChange?.(tile, id)
              announce(copy.announceReason(tile.name, reasons.find((r) => r.id === id)?.label ?? id))
            }}
          />
        )}
      </div>

      <footer className="flex gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={!handled || (tile ? escalated.has(tile.id) : true)}
          onClick={() => {
            if (!tile) return
            setEscalated((prev) => new Set(prev).add(tile.id))
            onEscalate?.(tile)
            announce(copy.announceEscalated(tile.name))
          }}
        >
          {copy.escalate}
        </Button>
        <AsyncButton className="flex-1" disabled={!handled} onAction={resolve} pendingLabel={copy.resolving} successLabel={copy.resolved}>
          {copy.resolve}
        </AsyncButton>
      </footer>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { TileBoard, type TileBoardProps }
export type { TileBoardCopy, TileBoardReason, TileBoardResponder, TileBoardStatus, TileBoardTile, TileBoardTone }
