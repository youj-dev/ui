'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { annotatedImageLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useDirection } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'

/* A picture with numbered callouts: each point on the media carries its
 * number, and a leader line runs from it to its label in the gutter beside
 * the media, so the eye goes point → line → words. Labels sit on the side of
 * their point (or `side`), stacked in order and nudged apart so they never
 * overlap; they follow the media as it resizes. Under 40rem of its own width
 * the gutters fold into a numbered list under the media, without lines.
 * - Picking: hovering or focusing a callout or its label lights that pair
 *   (its line and number in the accent, the rest quieter); pressing a
 *   callout pins it (`value`). Callouts are buttons in number order, each
 *   described by its label; the labels are an ordered list.
 * - Motion: on first view the callouts pop in one after another, each line
 *   draws from its point to its label and the label fades in as it lands;
 *   labels glide to their new places on resize. Reduced motion: drawn in
 *   place, labels jump.
 * - The media never mirrors, so neither do the points; in RTL the labels'
 *   text runs right to left in the same gutters. */

interface ImageAnnotation {
  id: string
  /** Where the point sits across the media, 0–100 from its left edge. */
  x: number
  /** Where the point sits down the media, 0–100 from its top. */
  y: number
  /** The label's first line: "Reefer unit". */
  title: ReactNode
  /** A second line: "34.1°F · set 34°F". */
  detail?: ReactNode
  /** The gutter its label sits in. Default: the side its point is on. */
  side?: 'left' | 'right'
}

interface AnnotatedImageProps extends Omit<ComponentProps<'figure'>, 'children' | 'defaultValue'> {
  annotations: ImageAnnotation[]
  /** The image. Leave it out and pass `media` for anything else. */
  src?: string
  /** The image's text alternative. */
  alt?: string
  /** Your own media in place of the image: a video, an illustration, a canvas. Points are placed over it. */
  media?: ReactNode
  /** Under the figure, as its caption. */
  caption?: ReactNode
  /** The lit annotation's id (controlled); `null` for none. */
  value?: string | null
  /** The annotation lit at first. Default: none. */
  defaultValue?: string | null
  /** Fires when a callout is pressed: its id, or `null` when it's pressed again. */
  onValueChange?: (id: string | null) => void
  /** Names the list of labels. Default: the labels' "Annotations". */
  label?: string
}

/** Below this width (px) of its own, the labels fold into a list under the media. */
const WIDE = 640
/** Space kept between stacked labels, in px. */
const GAP = 10
/** Where a label's line arrives, from its top: the middle of its number. */
const ANCHOR = 11

interface Layout {
  width: number
  height: number
  /** The media's box in the stage. */
  media: { left: number; right: number; top: number; height: number }
  /** Each label's top, by id. */
  tops: Record<string, number>
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const sideOf = (a: ImageAnnotation) => a.side ?? (a.x < 50 ? 'left' : 'right')

function AnnotatedImage({
  annotations,
  src,
  alt = '',
  media,
  caption,
  value,
  defaultValue = null,
  onValueChange,
  label,
  className,
  style,
  ...props
}: AnnotatedImageProps) {
  const k = useYouj()
  const direction = useDirection()
  const labels = useComponentLabels(annotatedImageLabels)
  const listId = useId()
  const stageRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLLIElement>())
  const inView = useInView(stageRef, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [pinned, setPinned] = useControllableState<string | null>(value, defaultValue)
  const [hovered, setHovered] = useState<string | null>(null)
  const active = hovered ?? pinned
  const [layout, setLayout] = useState<Layout>()
  // The entrance staggers once; later changes (hover, pin) answer at once.
  const [intro, setIntro] = useState(!k.reduced)
  useEffect(() => {
    if (!inView || !intro) return
    const timer = setTimeout(() => setIntro(false), annotations.length * k.ms('fast') + k.ms('slow') * 2)
    return () => clearTimeout(timer)
  }, [inView, intro, annotations.length, k])

  // Place the labels: each wants its top level with its point, then the stack in each gutter is pushed apart.
  useIsomorphicLayoutEffect(() => {
    const stage = stageRef.current
    const box = mediaRef.current
    if (!stage || !box) return
    const measure = () => {
      const s = stage.getBoundingClientRect()
      const mb = box.getBoundingClientRect()
      if (s.width < WIDE) return setLayout(undefined)
      const mediaBox = { left: mb.left - s.left, right: mb.right - s.left, top: mb.top - s.top, height: mb.height }
      const tops: Record<string, number> = {}
      let height = mediaBox.top + mediaBox.height
      for (const side of ['left', 'right'] as const) {
        const column = annotations.filter((a) => sideOf(a) === side).sort((a, b) => a.y - b.y)
        const sizes = column.map((a) => itemRefs.current.get(a.id)?.offsetHeight ?? 40)
        const want = column.map((a) => mediaBox.top + (a.y / 100) * mediaBox.height - ANCHOR)
        const placed: number[] = []
        // Down from the top, then back up from the bottom so the stack stays inside the media where it can.
        want.forEach((w, i) => placed.push(Math.max(w, i ? placed[i - 1]! + sizes[i - 1]! + GAP : 0)))
        for (let i = placed.length - 1, floor = height; i >= 0; i--) {
          placed[i] = Math.max(i ? placed[i - 1]! + sizes[i - 1]! + GAP : 0, Math.min(placed[i]!, floor - sizes[i]!))
          floor = placed[i]! - GAP
        }
        column.forEach((a, i) => (tops[a.id] = placed[i]!))
        if (placed.length) height = Math.max(height, placed.at(-1)! + sizes.at(-1)!)
      }
      setLayout({ width: s.width, height, media: mediaBox, tops })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    observer.observe(box)
    itemRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [annotations])

  const ordered = annotations
  const press = (id: string) => {
    const next = pinned === id ? null : id
    setPinned(next)
    onValueChange?.(next)
  }
  const wide = layout !== undefined
  const step = k.reduced || !intro ? 0 : k.stagger('base')

  return (
    <MotionFeatures>
      <figure
        data-slot="annotated-image"
        data-reduced-motion={k.reduced || undefined}
        className={cn('own:flex min-w-0 flex-col gap-3', className)}
        style={style}
        {...props}
      >
        <div
          ref={stageRef}
          dir="ltr"
          data-slot="annotated-image-stage"
          data-layout={wide ? 'wide' : 'stacked'}
          className="group/stage relative own:grid gap-x-6 gap-y-4 [--annotated-gutter:minmax(9rem,13rem)] data-[layout=wide]:grid-cols-[var(--annotated-gutter)_minmax(0,1fr)_var(--annotated-gutter)]"
          style={wide ? { minHeight: layout.height } : undefined}
        >
          <div
            ref={mediaRef}
            data-slot="annotated-image-media"
            className="relative own:overflow-hidden own:rounded-xl own:bg-band group-data-[layout=wide]/stage:col-start-2 group-data-[layout=wide]/stage:self-start"
          >
            {media ?? <img src={src} alt={alt} className="block h-auto w-full" draggable={false} />}
            {ordered.map((a, i) => {
              const lit = active === a.id
              return (
                <m.button
                  key={a.id}
                  type="button"
                  data-slot="annotated-image-callout"
                  data-active={lit || undefined}
                  aria-pressed={pinned === a.id}
                  aria-describedby={`${listId}-${a.id}`}
                  onClick={() => press(a.id)}
                  onPointerEnter={() => setHovered(a.id)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(a.id)}
                  onBlur={() => setHovered(null)}
                  className={cn(
                    'focus-ring absolute own:grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full own:font-mono own:text-ui-xs own:font-medium own:tabular-nums',
                    'shadow-[0_0_0_2px_var(--color-surface),0_1px_6px_color-mix(in_oklab,var(--color-fg)_30%,transparent)] transition-[background-color,color] yj-duration-fast ease-standard',
                    // A wider target than the disc, for fingers.
                    'before:absolute before:-inset-2.5 before:content-[""]',
                    lit ? 'own:bg-accent own:text-on-accent' : 'own:bg-fg own:text-canvas',
                  )}
                  style={{ left: `${a.x}%`, top: `${a.y}%` }}
                  initial={k.reduced ? false : { scale: 0.4, opacity: 0 }}
                  animate={shown ? { scale: lit ? 1.12 : 1, opacity: 1 } : undefined}
                  transition={k.reduced ? { type: false } : { ...k.spring('snappy'), delay: i * step }}
                >
                  {i + 1}
                </m.button>
              )
            })}
          </div>

          {wide && (
            <svg aria-hidden data-slot="annotated-image-lines" className="pointer-events-none absolute inset-0 size-full overflow-visible" width={layout.width} height={layout.height}>
              {ordered.map((a, i) => {
                const top = layout.tops[a.id]
                if (top === undefined) return null
                const left = sideOf(a) === 'left'
                const px = layout.media.left + (a.x / 100) * (layout.media.right - layout.media.left)
                const py = layout.media.top + (a.y / 100) * layout.media.height
                const ly = top + ANCHOR
                const edge = left ? layout.media.left : layout.media.right
                const end = left ? layout.media.left - 20 : layout.media.right + 20
                const lit = active === a.id
                return (
                  <m.path
                    key={a.id}
                    data-slot="annotated-image-line"
                    data-active={lit || undefined}
                    d={`M ${px} ${py} L ${edge} ${ly} L ${end} ${ly}`}
                    fill="none"
                    strokeWidth={lit ? 1.5 : 1}
                    strokeLinejoin="round"
                    className={cn('transition-[stroke,stroke-width] yj-duration-fast ease-standard', lit ? 'stroke-accent' : active ? 'stroke-line-strong' : 'stroke-fg-subtle')}
                    initial={k.reduced ? false : { pathLength: 0 }}
                    animate={shown ? { pathLength: 1 } : undefined}
                    transition={k.reduced ? { type: false } : { ...k.tween('slow', 'emphasized'), delay: intro ? i * step + k.duration('fast') : 0 }}
                  />
                )
              })}
            </svg>
          )}

          <ol
            aria-label={label ?? labels.annotations}
            data-slot="annotated-image-labels"
            className={cn('own:grid gap-x-6 gap-y-3 sm:grid-cols-2', wide && 'pointer-events-none absolute inset-0 own:block')}
          >
            {ordered.map((a, i) => {
              const left = sideOf(a) === 'left'
              const lit = active === a.id
              const top = layout?.tops[a.id]
              // The number sits next to the line: toward the media, whichever way the text runs.
              const reverse = left !== (direction === 'rtl')
              return (
                <m.li
                  key={a.id}
                  id={`${listId}-${a.id}`}
                  ref={(el: HTMLLIElement | null) => void (el ? itemRefs.current.set(a.id, el) : itemRefs.current.delete(a.id))}
                  dir={direction}
                  data-slot="annotated-image-label"
                  data-side={sideOf(a)}
                  data-active={lit || undefined}
                  onPointerEnter={() => setHovered(a.id)}
                  onPointerLeave={() => setHovered(null)}
                  className={cn(
                    'own:flex min-w-0 items-start gap-2.5',
                    wide && 'pointer-events-auto absolute top-0 transition-[translate] yj-duration-base ease-standard reduced:transition-none',
                    // youj-allow: physical side the media doesn't mirror, so its gutters don't either
                    wide && (left ? 'own:text-right' : 'own:text-left'),
                    wide && reverse && 'flex-row-reverse',
                  )}
                  style={
                    wide
                      ? ({
                          translate: `0 ${top ?? 0}px`,
                          ...(left ? { left: 0, width: layout.media.left - 24 } : { left: layout.media.right + 24, width: layout.width - layout.media.right - 24 }),
                        } as CSSProperties)
                      : undefined
                  }
                  initial={k.reduced ? false : { opacity: 0 }}
                  animate={shown ? { opacity: 1 } : undefined}
                  transition={k.reduced ? { type: false } : { ...k.tween('base', 'enter'), delay: intro ? i * step + (wide ? k.duration('slow') : 0) : 0 }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'own:grid size-5.5 shrink-0 place-items-center rounded-full own:font-mono own:text-ui-xs own:font-medium own:tabular-nums transition-[background-color,color] yj-duration-fast ease-standard',
                      lit ? 'own:bg-accent own:text-on-accent' : 'own:bg-band own:text-fg',
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="own:flex min-w-0 flex-col pt-px">
                    <span data-slot="annotated-image-title" className="own:text-ui own:font-medium own:text-fg">
                      {a.title}
                    </span>
                    {a.detail && <span className="sr-only">, </span>}
                    {a.detail && (
                      <span data-slot="annotated-image-detail" className="own:text-ui-sm own:text-fg-muted">
                        {a.detail}
                      </span>
                    )}
                  </span>
                </m.li>
              )
            })}
          </ol>
        </div>
        {caption && (
          <figcaption data-slot="annotated-image-caption" className="own:text-ui-sm own:text-fg-muted">
            {caption}
          </figcaption>
        )}
      </figure>
    </MotionFeatures>
  )
}

export { AnnotatedImage, type AnnotatedImageProps, type ImageAnnotation }
