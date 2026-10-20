'use client'

import { useId, useState, type ComponentProps } from 'react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Marquee, Reveal } from '@youj/motion'
import { PlayIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, LOGOS, type LogoCloudCopy, type LogoCloudLogo } from './logo-cloud/data'
import { Cycle, Wordmark } from './logo-cloud/cycle'

/* The customers' logos under one quiet line, done properly. `cycle` (the
 * default) is a grid that trades its logos in place, one cell at a time:
 * the logo leaving drifts up and blurs away as the next customer not on
 * show rises in and comes into focus, so twice as many customers fit in the
 * same room and nothing repeats at once. `marquee` is a row that drifts
 * with no seam, faded at both ends. Either rests while pointed at, off
 * screen and in a hidden tab, and a small button beside the line pauses it.
 * Screen readers get every customer once, as a list, rather than the
 * moving picture. Reduced motion, or `autoplay={false}`: the first logos
 * stand still (cycle) or wrap into a still row (marquee), with no button.
 *
 * Pass your own `logos` (a wordmark as `logo`, or a 24×24 `mark` beside
 * the name); every string is in `copy`. */

type HeadingLevel = 1 | 2 | 3

interface LogoCloudProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The customers. Default: the demo's sixteen. */
  logos?: LogoCloudLogo[]
  /** `cycle`, a grid that trades logos in place, or `marquee`, a drifting row. Default `cycle`. */
  variant?: 'cycle' | 'marquee'
  /** How many logos the cycling grid shows at once: four to a row, six on a phone. Default 8. */
  cells?: number
  /** Let it move. Default true (never under reduced motion). */
  autoplay?: boolean
  /** The line's heading level. Default 2. */
  headingLevel?: HeadingLevel
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<LogoCloudCopy>
}

function LogoCloud({
  theme,
  embedded = false,
  logos = LOGOS,
  variant = 'cycle',
  cells = 8,
  autoplay = true,
  headingLevel = 2,
  copy: copyProp,
  className,
  ...rest
}: LogoCloudProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const k = useYouj()
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const [paused, setPaused] = useState(false)
  const [pointed, setPointed] = useState(false)
  const moving = autoplay && !k.reduced
  // The cycle has something to trade only with more customers than cells.
  const controls = moving && (variant === 'marquee' || logos.length > Math.min(cells, logos.length))

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-14 md:py-20', className)}>
      <Reveal className={cn('flex flex-col gap-8', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <div className="flex items-center justify-center gap-2">
          <Title id={titleId} className="text-balance text-center text-ui text-fg-muted">
            {copy.title}
          </Title>
          {controls && (
            <Button variant="ghost" size="icon-sm" aria-label={paused ? copy.play : copy.pause} onClick={() => setPaused((was) => !was)} className="shrink-0 text-fg-muted">
              <span className="grid place-items-center">
                <PlayIcon active={!paused} className="size-3.5" />
              </span>
            </Button>
          )}
        </div>
        <ul aria-label={copy.listLabel} className="sr-only">
          {logos.map((logo) => (
            <li key={logo.name}>{logo.name}</li>
          ))}
        </ul>
        {/* The pictures are hidden from screen readers: the names are in the list above, once. */}
        {variant === 'marquee' ? (
          moving ? (
            <Marquee aria-hidden speed={paused ? 0 : 32} gap={56} fade={96} className="text-fg-muted">
              {logos.map((logo) => (
                <Wordmark key={logo.name} {...logo} />
              ))}
            </Marquee>
          ) : (
            <div aria-hidden className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6 text-fg-muted">
              {logos.map((logo) => (
                <Wordmark key={logo.name} {...logo} />
              ))}
            </div>
          )
        ) : (
          <div onPointerEnter={() => setPointed(true)} onPointerLeave={() => setPointed(false)}>
            <Cycle key={logos.map((logo) => logo.name).join('|')} logos={logos} cells={cells} held={!moving || paused || pointed} />
          </div>
        )}
      </Reveal>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { LogoCloud }
export type { LogoCloudProps, LogoCloudCopy, LogoCloudLogo }
