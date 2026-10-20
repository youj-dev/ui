'use client'

import { useId, type ComponentProps, type ElementType, type MouseEventHandler, type ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Stagger } from '@youj/motion'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { LiveSite } from './hero-terminal/live-site'
import { InstallCommand, Terminal, TRANSCRIPT, type HeroTerminalLine } from './hero-terminal/terminal'

/* A split hero for a CLI. The pitch and the calls to action sit on the
 * inline start, with the install command under them (its copy button
 * morphs to "Copied"). On the end, a terminal types `npx northwind deploy`
 * key by key once it scrolls into view, then streams the deploy: the linked
 * project, the framework it found, 214 files counting up beside a filling
 * bar, a spinner while it builds, and the live URL; then what it deployed
 * lands on the terminal's corner, the live site in a window of its own, on
 * the settle spring. Replay sends the site away and restarts it from the top
 * at any moment. The transcript and the site are a picture of output, so
 * they're hidden from assistive tech; Replay is a real button. Reduced
 * motion: the whole transcript and the site are there at once, and Replay is
 * gone. Pass your own `command`, `transcript`, `preview`, `install` command
 * and calls to action; every other string is in `copy`, and `linkComponent`
 * renders the links. */

/** A call to action: a link styled as a button. */
interface HeroTerminalCta {
  label: string
  href: string
  /** Runs on click; the link still follows `href` unless you call `event.preventDefault()`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

const DEFAULT_COPY = {
  eyebrow: 'New in 4.2: instant rollback',
  headline: 'One command from commit to production',
  description: (
    <>
      Run <code className="rounded-sm bg-band px-1.5 py-0.5 font-mono text-[0.9em] text-fg">northwind deploy</code> in any repository. It finds
      the framework, builds close to your users and hands you a live URL in about twenty seconds. No config file, no dashboard detour.
    </>
  ) as ReactNode,
  /** The small print under the install command; empty hides it. */
  note: 'macOS, Linux and Windows · Node 20 or later',
  /** The working directory in the terminal's title bar. */
  cwd: '~/acme/storefront',
  replay: 'Replay',
  copy: 'Copy',
  copied: 'Copied',
  /** The copy button's accessible name before it's pressed. */
  copyAria: 'Copy install command',
}
type HeroTerminalCopy = typeof DEFAULT_COPY

interface HeroTerminalProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, padding or max width), and the title is an h2. Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. `description` may hold inline markup. */
  copy?: Partial<HeroTerminalCopy>
  /** The command the terminal types. Default `npx northwind deploy`. */
  command?: string
  /** What the command prints, line by line. Default: the demo's deploy. */
  transcript?: HeroTerminalLine[]
  /** The install command with a copy button; `null` hides it. Default `npm i -g northwind`. */
  install?: string | null
  /** Called with the install command when it's copied. */
  onCopyCommand?: (command: string) => void
  /** What the deploy made, landing on the terminal's corner once the transcript is done (decorative: hidden from assistive tech); `null` leaves it out. Default: the demo's live storefront. */
  preview?: ReactNode | null
  /** The main call to action. Default: "Install the CLI" to `#install`. */
  primaryCta?: HeroTerminalCta
  /** The second call to action; `null` hides it. Default: "Read the CLI docs" to `#docs`. */
  secondaryCta?: HeroTerminalCta | null
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The headline's level. Default 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
}

function HeroTerminal({
  theme,
  embedded = false,
  copy: copyProp,
  command = 'npx northwind deploy',
  transcript = TRANSCRIPT,
  install = 'npm i -g northwind',
  onCopyCommand,
  preview = <LiveSite />,
  primaryCta = { label: 'Install the CLI', href: '#install' },
  secondaryCta = { label: 'Read the CLI docs', href: '#docs' },
  linkComponent: Link = 'a',
  headingLevel = embedded ? 2 : 1,
  className,
  ...rest
}: HeroTerminalProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'overflow-hidden bg-canvas', className)}>
      <div
        className={cn(
          'grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16',
          !embedded && 'mx-auto min-h-[min(88dvh,760px)] max-w-6xl px-4 py-20 sm:px-6 md:py-28',
        )}
      >
        <Stagger inView={false} variant="rise" className="flex min-w-0 flex-col items-start gap-6">
          {copy.eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-ui-sm text-fg-muted">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              {copy.eyebrow}
            </span>
          )}
          <Title id={titleId} className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.06]">
            {copy.headline}
          </Title>
          <p className="max-w-md text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={primaryCta.href} onClick={primaryCta.onClick} className={buttonVariants({ size: 'lg' })}>
              {primaryCta.label}
            </Link>
            {secondaryCta && (
              <Link href={secondaryCta.href} onClick={secondaryCta.onClick} className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'bg-surface hover:bg-hover')}>
                {secondaryCta.label}
              </Link>
            )}
          </div>
          {install && <InstallCommand command={install} labels={copy} onCopyCommand={onCopyCommand} />}
          {copy.note && <p className="text-ui-sm text-fg-muted">{copy.note}</p>}
        </Stagger>
        <div className="min-w-0">
          <Terminal command={command} script={transcript} cwd={copy.cwd} replay={copy.replay} preview={preview} />
        </div>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { HeroTerminal }
export type { HeroTerminalProps, HeroTerminalCopy, HeroTerminalCta, HeroTerminalLine }
