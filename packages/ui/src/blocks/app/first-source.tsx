'use client'

import { useId, useState, type HTMLAttributes } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { DotGrid, Illustration, type IllustrationSlot } from '@youj/illustrations'
import { BookOpenIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DEFAULT_COPY, demo, SOURCES, type FirstSourceCopy, type FirstSourceOption } from './first-source/data'
import { FirstSourceFloor } from './first-source/floor'
import { SourceOptions } from './first-source/source-options'
import { cn } from '../../lib/utils'

/* Where a first source lands: the empty state as a floor plan, a data warehouse
 * before its first table by default.
 * An isometric plinth on drafting dots has its bays marked out in dashes,
 * and over the front one, on a dashed drop line, hangs the first thing
 * waiting to land, in the accent: a cylinder for a database, three thin
 * slabs for an event stream, a crate for files. Below, the three ways in as
 * choice cards; choosing one reshapes what's waiting (it drops in on the
 * settle spring) and relabels the primary action, which runs through
 * Button's onAction and hands the source to `onConnect`. Reduced motion:
 * nothing bobs or drops; the shape changes in place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded, it keeps its natural width unless `fill`. */

/** Mono capitals for a status line, in any style (Bezel sets its own on the head's action and the footer's start). */
const STATUS = 'font-mono text-ui-xs uppercase tracking-[0.12em] text-fg-muted'

interface FirstSourceProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default false. */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (736px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<FirstSourceCopy>
  /** The ways in, as choice cards (two to four): each has its label, formats, primary action and the shape that waits to land. Default: database, event stream and files. */
  sources?: FirstSourceOption[]
  /** The source chosen when the card opens, by id. Default: the first. */
  defaultSource?: string
  /** Starts connecting the chosen source; resolve when it's set up. Default: a short demo wait. */
  onConnect?: (source: FirstSourceOption) => Promise<unknown> | unknown
  /** The picture over the choices: a scene from the illustrations by id, or your own node. Default: the warehouse floor, with the chosen source waiting to land. */
  illustration?: IllustrationSlot
}

function FirstSource({ theme, embedded = false, fill = false, copy: copyProp, sources = SOURCES, defaultSource, onConnect, illustration, className, ...rest }: FirstSourceProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const Heading = embedded ? 'h3' : 'h2'
  const [source, setSource] = useState(defaultSource ?? sources[0]?.id ?? '')
  const chosen = sources.find((s) => s.id === source) ?? sources[0]!

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-184')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.scope}</CardDescription>
        <CardAction className="flex min-h-7 items-center">
          <span className={STATUS}>{copy.status}</span>
        </CardAction>
      </CardHeader>

      {illustration !== null && (
        <CardContent className="relative isolate overflow-hidden p-0">
          <DotGrid gap={18} />
          {illustration === undefined ? (
            <FirstSourceFloor source={chosen.id} kind={chosen.kind ?? 'files'} />
          ) : (
            <div data-slot="first-source-illustration" className="relative px-4 py-5 sm:py-7">
              <Illustration scene={illustration} fallback="warehouse" unit={26} />
            </div>
          )}
        </CardContent>
      )}

      <CardContent className="flex flex-col gap-5 py-(--ui--panel-y)">
        <div className="mx-auto flex max-w-md flex-col gap-1.5 text-center">
          <Heading className="text-lg font-medium tracking-tight text-balance">{copy.heading}</Heading>
          <p className="text-ui text-pretty text-fg-muted">{copy.body}</p>
        </div>
        <SourceOptions copy={copy} sources={sources} value={chosen.id} onChange={setSource} />
      </CardContent>

      <CardFooter className="flex-wrap gap-y-3">
        <span className={`me-auto ${STATUS}`}>{copy.tier}</span>
        {/* On a phone the two actions share the row under the status line. */}
        <div className="flex flex-wrap justify-end gap-2 max-sm:w-full max-sm:*:flex-1">
          <Button variant="secondary">
            <BookOpenIcon size={14} />
            {copy.guide}
          </Button>
          <AsyncButton onAction={() => (onConnect ? onConnect(chosen) : demo('FirstSource: onConnect', 900))} pendingLabel={copy.connecting} successLabel={copy.connected}>
            {chosen.action}
          </AsyncButton>
        </div>
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
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
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { FirstSource, type FirstSourceProps }
