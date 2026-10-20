'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type ElementType, type MouseEventHandler, type ReactNode } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Counter, Reveal, Stagger, TextSplit } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { buttonVariants } from '../../components/ui/button'
import { useVisible } from '../../hooks/use-visible'
import { cn } from '../../lib/utils'

/* An editorial hero, set like the cover of a journal. A masthead rule carries
 * the issue, the season and the section; under it the headline runs the full
 * width at poster size, and its middle line cycles (Fridays, holidays,
 * launch day), each word rising out of the line's mask as the last one
 * leaves through the top. The other lines rise in word by word. The lede is set in two columns with a drop cap
 * beside the byline, then the calls to action, and a closing rule of three
 * figures that roll in. Between lede and figures sits "In this issue": the
 * issue's other pieces as a numbered contents (kicker, title, minutes),
 * each a link whose arrow nudges on hover or focus; an optional `media`
 * (a cover image or illustration) can sit under the headline. Assistive tech reads one fixed headline; the cycling
 * word is a picture of it. The cycle stops off-screen. Reduced motion: the
 * first word stays, the lines are set and the figures are there. Pass your
 * own cycling `words`, `figures` and calls to action; every other string
 * (masthead, byline, lede) is in `copy`, and `linkComponent` renders the
 * links. */

/** A call to action: a link styled as a button. */
interface HeroEditorialCta {
  label: string
  href: string
  /** Runs on click; the link still follows `href` unless you call `event.preventDefault()`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** A piece in the issue's contents. */
interface HeroEditorialStory {
  /** The section it runs in ("Postmortem"), set small above the title. */
  kicker: string
  title: string
  href: string
  /** Minutes to read; left out, none is shown. */
  minutes?: number
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** A figure in the closing rule. */
interface HeroEditorialFigure {
  /** The number the counter rolls to. */
  value: number
  /** How the number is written (`Intl.NumberFormat` options). */
  format?: Intl.NumberFormatOptions
  /** The unit set small after the number. */
  unit: string
  label: string
}

const DEFAULT_COPY = {
  issue: 'Issue 07',
  season: 'Autumn 2026',
  section: 'The deploy report',
  /** The contents' heading. */
  inThisIssue: 'In this issue',
  /** A piece's reading time: "6 min read". */
  readTime: (minutes: number) => `${minutes} min read`,
  /** The masthead's name, at its inline end on wider screens. */
  publication: 'Northwind Journal',
  /** The headline's first line. */
  headlineLead: 'Deploy on',
  /** The headline's last line, set muted. The cycling `words` sit between. */
  headlineTail: 'Sleep anyway.',
  /** Before the author's name. */
  by: 'By',
  author: 'Iris Calder',
  authorRole: 'Staff engineer, Northwind',
  /** The avatar's letters. */
  authorInitials: 'IC',
  dateline: 'September 24, 2026 · 6 min read',
  /** The lede's paragraphs; the first gets the drop cap. */
  lede: [
    'Most teams freeze deploys before a weekend, because a bad release used to mean a bad night. On Northwind every build stays warm, so undoing one is a pointer change that lands in under a second, from the dashboard, the CLI or your phone.',
    'We asked 1,200 teams what changed when rollback stopped being an event. The answer was the calendar: they ship when the work is ready, not when the week allows.',
  ],
}
type HeroEditorialCopy = typeof DEFAULT_COPY

const WORDS = ['Fridays.', 'holidays.', 'launch day.']

const STORIES: HeroEditorialStory[] = [
  { kicker: 'Infrastructure', title: 'What a rollback costs when it takes a second', href: '#rollback', minutes: 4 },
  { kicker: 'Culture', title: 'Shipping on Fridays: a field guide', href: '#fridays', minutes: 6 },
  { kicker: 'Postmortem', title: 'The Tuesday our CDN lied to us', href: '#postmortem', minutes: 8 },
]

const FIGURES: HeroEditorialFigure[] = [
  { value: 0.8, format: { minimumFractionDigits: 1 }, unit: 'sec', label: 'median rollback' },
  { value: 38, unit: 'regions', label: 'on the edge by default' },
  { value: 99.99, format: { minimumFractionDigits: 2 }, unit: '%', label: 'uptime, last 12 months' },
]

function CyclingWord({ words }: { words: string[] }) {
  const k = useYouj()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  // Also off while the tab is hidden: `inView` alone keeps a scrolled-to word cycling in the background.
  const shown = useVisible(ref)
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!inView || !shown || k.reduced) return
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), k.ms('deliberate') * 5)
    return () => clearInterval(id)
  }, [inView, shown, k, words.length])
  const word = k.reduced ? words[0] : words[index % words.length]
  return (
    <>
      <span className="sr-only">{words[0]}</span>
      {/* The line's mask: words rise into it from below and leave through the top. */}
      <span ref={ref} aria-hidden className="relative -my-[0.2em] -ms-[0.06em] block overflow-hidden py-[0.2em] ps-[0.06em] italic text-accent">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={word}
            className="block"
            initial={{ y: '105%' }}
            animate={{ y: 0 }}
            exit={{ y: '-105%' }}
            transition={k.tween('slow', 'emphasized')}
          >
            {word}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  )
}

interface HeroEditorialProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, padding or max width), and the title is an h2. Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<HeroEditorialCopy>
  /** The headline's middle line, cycling; assistive tech reads the first. Default: Fridays, holidays, launch day. */
  words?: string[]
  /** The issue's other pieces, as a numbered contents; empty hides it. Default: the demo's three. */
  stories?: HeroEditorialStory[]
  /** A cover picture under the headline: an image, an illustration or a motion piece. Decorative, so give it no text a reader needs. */
  media?: ReactNode
  /** The closing rule's figures; empty hides it. Default: the demo's three. */
  figures?: HeroEditorialFigure[]
  /** The BCP 47 locale the figures are written in. Default: the YoujProvider's locale (en-US without one). */
  locale?: string
  /** The main call to action. Default: "Start deploying free" to `#signup`. */
  primaryCta?: HeroEditorialCta
  /** The second call to action; `null` hides it. Default: "Read the deploy report" to `#report`. */
  secondaryCta?: HeroEditorialCta | null
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The headline's level. Default 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
}

function HeroEditorial({
  theme,
  embedded = false,
  copy: copyProp,
  words = WORDS,
  stories = STORIES,
  media,
  figures = FIGURES,
  locale,
  primaryCta = { label: 'Start deploying free', href: '#signup' },
  secondaryCta = { label: 'Read the deploy report', href: '#report' },
  linkComponent: Link = 'a',
  headingLevel = embedded ? 2 : 1,
  className,
  ...rest
}: HeroEditorialProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas', className)}>
      <div className={cn('@container flex flex-col', !embedded && 'mx-auto max-w-6xl px-4 pt-12 pb-20 sm:px-6 md:pt-16 md:pb-24')}>
        <Reveal inView={false} variant="fade" className="flex flex-wrap items-center gap-x-6 gap-y-1 border-y border-fg py-2.5 text-ui-sm tracking-wide uppercase">
          <span className="font-semibold">{copy.issue}</span>
          <span className="text-fg-muted">{copy.season}</span>
          <span className="text-fg-muted">{copy.section}</span>
          <span className="ms-auto font-semibold max-sm:hidden">{copy.publication}</span>
        </Reveal>

        <Title
          id={titleId}
          className="mt-10 text-[clamp(3.5rem,11.5cqi,7rem)] leading-[0.9] font-semibold tracking-[-0.045em] text-balance md:mt-14"
        >
          <TextSplit as="span" by="words" inView={false} delay={1} duration="deliberate" ease="enter" className="block">
            {copy.headlineLead}
          </TextSplit>{' '}
          {words.length > 0 && <CyclingWord words={words} />}{' '}
          <TextSplit as="span" by="words" inView={false} delay={4} duration="deliberate" ease="enter" className="block text-fg-muted">
            {copy.headlineTail}
          </TextSplit>
        </Title>

        {media && (
          <div aria-hidden className="mt-10 overflow-hidden rounded-xl border border-line md:mt-14">
            {media}
          </div>
        )}

        <Stagger inView={false} delay={8} step="loose" className="mt-12 grid gap-10 border-t border-line pt-8 md:mt-16 md:grid-cols-12 md:gap-8">
          <Reveal variant="rise" className="flex items-start gap-3 md:col-span-4">
            <Avatar size="lg">
              <AvatarFallback>{copy.authorInitials}</AvatarFallback>
            </Avatar>
            <p className="flex flex-col text-ui">
              <span>
                {copy.by} <span className="font-semibold">{copy.author}</span>
              </span>
              <span className="text-fg-muted">{copy.authorRole}</span>
              <span className="mt-1 text-ui-sm text-fg-muted">{copy.dateline}</span>
            </p>
          </Reveal>
          <Reveal variant="rise" className="flex flex-col gap-8 md:col-span-8">
            <div className="gap-8 text-pretty text-ui-lg leading-relaxed text-fg-muted md:columns-2">
              {copy.lede.map((paragraph, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? 'first-letter:float-start first-letter:me-1 first-letter:mt-1 first-letter:text-[3.4em] first-letter:leading-[0.8] first-letter:font-semibold first-letter:text-fg'
                      : 'mt-4'
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={primaryCta.href} onClick={primaryCta.onClick} className={buttonVariants({ size: 'lg' })}>
                {primaryCta.label}
              </Link>
              {secondaryCta && (
                <Link href={secondaryCta.href} onClick={secondaryCta.onClick} className={buttonVariants({ size: 'lg', variant: 'ghost', className: 'gap-2' })}>
                  {secondaryCta.label} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
                </Link>
              )}
            </div>
          </Reveal>
          {stories.length > 0 && (
            <Reveal variant="rise" className="md:col-span-12">
              <nav aria-label={copy.inThisIssue}>
                <p className="mb-3 text-ui-sm font-semibold tracking-wide uppercase">{copy.inThisIssue}</p>
                <ol className="grid border-t border-fg sm:grid-cols-3">
                  {stories.map((story, i) => (
                    <li key={story.href} className="border-b border-line sm:border-s sm:px-5 sm:first:border-s-0 sm:first:ps-0">
                      <Link
                        href={story.href}
                        onClick={story.onClick}
                        className="group/story flex h-full flex-col gap-2 rounded-sm py-4 focus-ring"
                      >
                        <span className="flex items-baseline justify-between gap-3 text-ui-sm text-fg-muted">
                          <span className="font-mono tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                          <span className="tracking-wide uppercase">{story.kicker}</span>
                        </span>
                        <span className="text-balance text-ui-lg font-medium text-fg underline decoration-transparent underline-offset-4 transition-colors yj-duration-fast ease-standard group-hover/story:decoration-fg">
                          {story.title}
                        </span>
                        <span className="mt-auto flex items-center gap-1.5 pt-1 text-ui-sm text-fg-muted">
                          {story.minutes !== undefined && copy.readTime(story.minutes)}
                          <ArrowRightIcon
                            size={14}
                            aria-hidden
                            className="transition-transform yj-duration-fast ease-standard group-hover/story:translate-x-1 group-focus-visible/story:translate-x-1 rtl:-scale-x-100 rtl:group-hover/story:-translate-x-1 rtl:group-focus-visible/story:-translate-x-1"
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </nav>
            </Reveal>
          )}
        </Stagger>

        {figures.length > 0 && (
          <dl className="mt-14 grid border-y border-fg" style={{ gridTemplateColumns: `repeat(${figures.length}, minmax(0, 1fr))` }}>
            {figures.map((f) => (
              <div key={f.label} className="flex flex-col-reverse gap-1 border-s border-line px-3 py-4 first:border-s-0 first:ps-0 sm:px-5">
                <dt className="text-ui-sm text-fg-muted">{f.label}</dt>
                <dd className="flex items-baseline gap-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                  <Counter value={f.value} mode="roll" format={f.format} locale={locale} duration="deliberate" />
                  <span className="text-ui font-medium text-fg-muted sm:text-ui-lg">{f.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { HeroEditorial }
export type { HeroEditorialProps, HeroEditorialCopy, HeroEditorialCta, HeroEditorialFigure, HeroEditorialStory }
