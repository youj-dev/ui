'use client'

import { useId, useState, type ComponentProps } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { LineGrid } from '@youj/illustrations'
import { FileTextIcon, MoreHorizontalIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, demo, PARTS, partOf, SPECS, type ExplodedViewCopy, type ExplodedViewPart, type ExplodedViewSpec, type PartId } from './exploded-view/data'
import { Drawing } from './exploded-view/drawing'
import { Stats } from './exploded-view/stats'

/* A device's spec card built around an exploded technical drawing. Relay R4,
 * an edge gateway, is drawn taken apart into its five layers (chassis,
 * mainboard, compute module, heat spreader and a wireframe lid), each named
 * on a rail beside the drawing; Assembled / Exploded puts it back together
 * on one spring, so switching mid-way never jumps. The figures under it are
 * the spec sheet, and each points at its part: hover or focus NPU and the
 * compute module lights in the accent, and its name shows over the drawing.
 * Ordering runs through Button's onAction. On a phone the rail keeps the
 * parts' names and drops their details. Reduced motion: the drawing is still
 * and the view switches at once. The device, its parts and figures are the
 * demo's; `copy`, `parts`, `specs`, `focusPart` and `onOrder` are props. The drawing is a fixed illustration of five layers; what they are called and the spec sheet are data.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`.
 * Demo content — edit after adding. */

interface ExplodedViewProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (736px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate: the parts' names and details and the figures included. */
  copy?: Partial<ExplodedViewCopy>
  /** The five layers of the drawing, bottom to top, with the name each shows on the rail and the detail under it. The drawing itself is the same. Default: Relay R4's. */
  parts?: ExplodedViewPart[]
  /** The spec sheet: a label and figures each, and the layer it lights when pointed at. Default: Relay R4's six. */
  specs?: ExplodedViewSpec[]
  /** Start assembled rather than taken apart. Default false. */
  defaultAssembled?: boolean
  /** The part lit when nothing's pointed at. Default 'compute'. */
  focusPart?: PartId
  /** Orders the module; resolve when it's placed. Default: a short demo wait. */
  onOrder?: () => Promise<unknown> | unknown
}

function ExplodedView({ theme, embedded = true, fill = false, copy: copyProp, parts = PARTS, specs = SPECS, defaultAssembled = false, focusPart = 'compute', onOrder, className, ...rest }: ExplodedViewProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const SectionTitle = embedded ? 'h3' : 'h2'
  const { announce, announcer } = useAnnouncer()
  const [view, setView] = useState<'assembled' | 'exploded'>(defaultAssembled ? 'assembled' : 'exploded')
  const [preview, setPreview] = useState<PartId | null>(null)
  const lit = preview ?? focusPart

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-184')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <span className="hidden sm:inline">{copy.status}</span>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="relative isolate flex flex-col gap-2 overflow-hidden">
        <LineGrid gap={20} major={4} fade="edges" />
        <div className="flex min-h-control-sm flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {/* The part that's lit, named over the drawing it's lit in. */}
          <Eyebrow className="flex min-w-0 items-center gap-1.5" aria-hidden>
            <span className="size-1.5 shrink-0 rounded-full bg-accent" />
            <span>{copy.showing(partOf(parts, lit).name)}</span>
          </Eyebrow>
          <SegmentedControl size="sm" aria-label={copy.view} value={view} onValueChange={(v) => setView(v as typeof view)} className="ms-auto">
            <SegmentedControlItem value="assembled">{copy.assembled}</SegmentedControlItem>
            <SegmentedControlItem value="exploded">{copy.exploded}</SegmentedControlItem>
          </SegmentedControl>
        </div>
        <Drawing title={copy.drawing} parts={parts} lit={lit} exploded={view === 'exploded'} />
      </CardContent>

      <CardContent className="flex flex-col gap-2">
        <SectionTitle className="text-ui-lg font-medium tracking-tight text-balance">{copy.headline}</SectionTitle>
        <p className="max-w-[60ch] text-ui text-pretty text-fg-muted">{copy.body}</p>
      </CardContent>

      <CardContent aria-label={copy.specs} role="group" className="px-3 sm:px-[calc(var(--card-spacing)-var(--spacing)*3)]">
        <Stats copy={copy} specs={specs} parts={parts} lit={lit} onPreview={setPreview} />
      </CardContent>

      <CardFooter className="flex-wrap">
        <span>{copy.statusLine}</span>
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          <Button variant="secondary">
            <FileTextIcon size={14} />
            {copy.datasheet}
          </Button>
          <AsyncButton
            onAction={async () => {
              await (onOrder ? onOrder() : demo('ExplodedView: onOrder', 900))
              announce(copy.orderedAnnounce)
            }}
            pendingLabel={copy.ordering}
            successLabel={copy.ordered}
          >
            {copy.order}
          </AsyncButton>
        </div>
      </CardFooter>
      {announcer}
    </Card>
  )

  const page = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-184', className)}>
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
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { ExplodedView, type ExplodedViewProps }
