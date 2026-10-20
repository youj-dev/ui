'use client'

import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type ComponentType, type ElementType, type MouseEventHandler, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Reveal, Stagger } from '@youj/motion'
import { ActivityIcon, ArrowRightIcon, GitBranchIcon, HistoryIcon, PlayIcon, type IconProps } from '@youj/icons'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { DeploymentsShot, SHOT_HEIGHT, SHOT_WIDTH } from './hero-product/deployments-shot'

/* A centered hero that leads with the product. The headline, one sentence and
 * two calls to action rise in; under them, the deployments view sits in a
 * browser frame over a soft accent glow. The frame starts tipped back in
 * perspective and settles flat as it scrolls up toward the reader (the tilt
 * is tied to scroll, so it reverses on the way back). The screenshot is the
 * real components at a fixed desktop width, scaled to fit like an image; it
 * is inert and hidden from assistive tech. Three callouts under it rise in
 * as they come into view. Pass your own calls to action, `callouts` and
 * `media` (your product's screenshot); every other string is in `copy`, and
 * `linkComponent` renders the links. Reduced motion: the frame is flat and
 * everything is in place. */

/** A call to action: a link styled as a button. */
interface HeroProductCta {
  label: string
  href: string
  /** Runs on click; the link still follows `href` unless you call `event.preventDefault()`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
  /** An icon before the label. */
  icon?: ReactNode
}

/** A feature under the product frame. */
interface HeroProductCallout {
  icon: ComponentType<IconProps>
  title: string
  description: string
}

const DEFAULT_COPY = {
  /** The label at the start of the announcement pill. */
  badge: 'New',
  headline: 'See every deploy. Undo any of them.',
  description:
    'Northwind keeps each build warm and one click from production, with the branch, the author and its health beside it. Shipping on a Friday is just shipping.',
  /** The address in the frame's window bar. */
  url: 'app.northwind.dev',
  /** The rest of the address, shown on wider screens. */
  urlPath: '/acme/storefront',
}
type HeroProductCopy = typeof DEFAULT_COPY

const CALLOUTS: HeroProductCallout[] = [
  { icon: HistoryIcon, title: 'Roll back in 0.8 seconds', description: 'Every deploy stays warm, so production points back without a rebuild.' },
  { icon: GitBranchIcon, title: 'A preview for every branch', description: 'Each pull request gets its own URL, with comments pinned to the pixels.' },
  { icon: ActivityIcon, title: 'Health in 38 regions', description: 'Errors and latency per deploy, so you know which change did it.' },
]

/** Scales a fixed-width picture to its container's width, down to `min`; narrower than that, the picture crops at the inline end. */
function useFitScale(width: number, min: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<number>()
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setScale(Math.max(min, entry!.contentRect.width / width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [width, min])
  return { ref, scale }
}

interface ProductFrameProps {
  url: string
  urlPath: string
  width: number
  height: number
  /** The demo shot is a picture of the app: inert and hidden. Your media keeps its own semantics. */
  decorative: boolean
  children: ReactNode
}

function ProductFrame({ url, urlPath, width, height, decorative, children }: ProductFrameProps) {
  const k = useYouj()
  const stage = useRef<HTMLDivElement>(null)
  const { ref: fitRef, scale: fitScale } = useFitScale(width, 0.5)
  // 0 as the frame's top enters the viewport, 1 once it has risen to a quarter of the way down.
  const { scrollYProgress } = useScroll({ target: stage, offset: ['start end', 'start 0.25'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1])

  return (
    <div ref={stage} className="relative [perspective:1600px]">
      <div aria-hidden className="absolute inset-x-[8%] top-[12%] bottom-[8%] -z-10 rounded-full bg-accent-line blur-3xl" />
      <motion.div
        style={k.reduced ? undefined : { rotateX, scale, transformOrigin: '50% 0%' }}
        aria-hidden={decorative || undefined}
        inert={decorative || undefined}
        className="overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-accent/15"
      >
        <div className="flex h-9 items-center gap-1.5 border-b border-line bg-transparent px-3.5 sm:h-10">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-well" />
          ))}
          <span className="mx-auto truncate rounded-md bg-canvas px-3 py-0.5 text-ui-sm text-fg-muted">
            {url}
            <span className="max-sm:hidden">{urlPath}</span>
          </span>
        </div>
        <div
          ref={fitRef}
          className="relative overflow-hidden"
          style={fitScale ? { height: height * fitScale } : { aspectRatio: `${width} / ${height}` }}
        >
          <div
            className={cn('absolute top-0 start-0 origin-top-left rtl:origin-top-right', fitScale === undefined && 'invisible')}
            style={{ width, transform: `scale(${fitScale ?? 1})` }}
          >
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

interface HeroProductProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, padding or max width), and the title is an h2. Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<HeroProductCopy>
  /** The announcement pill above the headline; `null` hides it. Default: "Deployments, redesigned" to `#changelog`. */
  announcement?: HeroProductCta | null
  /** The main call to action. Default: "Start deploying" to `#signup`. */
  primaryCta?: HeroProductCta
  /** The second call to action; `null` hides it. Default: "Watch the 2-minute tour" to `#tour`. */
  secondaryCta?: HeroProductCta | null
  /** The features under the frame; empty hides them. Default: the demo's three. */
  callouts?: HeroProductCallout[]
  /** What the browser frame shows, usually your product's screenshot (give an image its `alt`). It's laid out at `mediaSize` and scaled to fit like an image. Default: the demo's deployments view, decorative. */
  media?: ReactNode
  /** The size `media` is laid out at, in pixels, before it's scaled. Default `{ width: 1120, height: 680 }`. */
  mediaSize?: { width: number; height: number }
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The headline's level. Default 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
}

function HeroProduct({
  theme,
  embedded = false,
  copy: copyProp,
  announcement = { label: 'Deployments, redesigned', href: '#changelog' },
  primaryCta = { label: 'Start deploying', href: '#signup' },
  secondaryCta = { label: 'Watch the 2-minute tour', href: '#tour', icon: <PlayIcon size={15} /> },
  callouts = CALLOUTS,
  media,
  mediaSize = { width: SHOT_WIDTH, height: SHOT_HEIGHT },
  linkComponent: Link = 'a',
  headingLevel = embedded ? 2 : 1,
  className,
  ...rest
}: HeroProductProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'overflow-hidden bg-canvas', className)}>
      <div className={cn('flex flex-col gap-14 md:gap-16', !embedded && 'mx-auto max-w-6xl px-4 pt-20 pb-20 sm:px-6 md:pt-28 md:pb-28')}>
        <Stagger inView={false} variant="rise" className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          {announcement && (
            <Link
              href={announcement.href}
              onClick={announcement.onClick}
              className="group inline-flex items-center gap-2 rounded-full border border-line bg-transparent py-1 ps-3 pe-2.5 text-ui-sm text-fg-muted transition-colors yj-duration-fast ease-standard focus-ring hover:text-fg"
            >
              <span className="font-medium text-fg">{copy.badge}</span>
              <span aria-hidden className="h-3 w-px bg-line" />
              {announcement.label}
              <ArrowRightIcon size={13} className="transition-transform yj-duration-fast ease-standard group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
            </Link>
          )}
          <Title id={titleId} className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.04]">
            {copy.headline}
          </Title>
          <p className="max-w-xl text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={primaryCta.href} onClick={primaryCta.onClick} className={buttonVariants({ size: 'lg' })}>
              {primaryCta.icon} {primaryCta.label}
            </Link>
            {secondaryCta && (
              <Link href={secondaryCta.href} onClick={secondaryCta.onClick} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                {secondaryCta.icon} {secondaryCta.label}
              </Link>
            )}
          </div>
        </Stagger>
        <Reveal inView={false} variant="rise" delay={5} delayStep="loose" className="min-w-0">
          <ProductFrame url={copy.url} urlPath={copy.urlPath} width={mediaSize.width} height={mediaSize.height} decorative={media === undefined}>
            {media === undefined ? <DeploymentsShot /> : media}
          </ProductFrame>
        </Reveal>
        {callouts.length > 0 && (
          <Stagger as="ul" itemAs="li" variant="rise" className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {callouts.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-3.5 sm:flex-col sm:gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-transparent text-accent">
                  <Icon size={17} />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-ui font-semibold">{title}</p>
                  <p className="text-ui text-fg-muted">{description}</p>
                </div>
              </div>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { HeroProduct }
export type { HeroProductProps, HeroProductCopy, HeroProductCta, HeroProductCallout }
