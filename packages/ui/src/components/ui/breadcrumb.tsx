'use client'

import { breadcrumbLabels } from '@youj/core/labels'
import {
  Children,
  cloneElement,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { EllipsisIcon } from '@youj/icons/components/youj/icons/ellipsis'
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useComponentLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* shadcn's breadcrumb in youj's type: 13px muted crumbs, the current page
 * in full ink, slanted hairline separators. Long labels truncate (the full
 * text stays in the accessible name). A long path collapses: give the list
 * `maxItems` and the middle crumbs fold into an ellipsis button; pressing it
 * unfolds them in place (each one's width grows from zero so the crumbs
 * after it glide aside, staggered) and moves focus to the first one. */

function Breadcrumb({ 'aria-label': label, ...props }: ComponentProps<'nav'>) {
  const labels = useComponentLabels(breadcrumbLabels)
  return <MotionFeatures><nav aria-label={label ?? labels.breadcrumb} data-slot="breadcrumb" {...props} /></MotionFeatures>
}

/** Set while a crumb (and the separator after it) unfolds: its place in the unfolding run. */
const RevealContext = createContext<number | null>(null)

interface BreadcrumbListProps extends ComponentProps<'ol'> {
  /** Collapse the middle crumbs when there are more than this many. */
  maxItems?: number
  /** Crumbs kept before the ellipsis. Default 1. */
  itemsBeforeCollapse?: number
  /** Crumbs kept after the ellipsis. Default 2: the page and its parent. */
  itemsAfterCollapse?: number
}

interface Segment {
  item: ReactElement
  separator?: ReactElement
}

/** Direct children, with fragments unwrapped (their keys prefixed, so crumbs from different fragments never collide). */
function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child) || child.type !== Fragment) return [child]
    return flatten(child.props.children).map((inner) =>
      isValidElement(inner) ? cloneElement(inner, { key: `${child.key}${inner.key}` }) : inner,
    )
  })
}

function BreadcrumbList({
  className,
  maxItems,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 2,
  children,
  ...props
}: BreadcrumbListProps) {
  const labels = useComponentLabels(breadcrumbLabels)
  const [expanded, setExpanded] = useState(false)
  const [focusReveal, setFocusReveal] = useState(false)
  const firstRevealed = useRef<HTMLLIElement>(null)

  // Crumbs, each with the separator that follows it.
  const segments: Segment[] = []
  for (const child of flatten(children)) {
    if (!isValidElement(child)) continue
    if (child.type === BreadcrumbSeparator && segments.length) segments[segments.length - 1]!.separator = child
    else if (child.type !== BreadcrumbSeparator) segments.push({ item: child })
  }

  // A new path (a navigation) starts collapsed again.
  const signature = segments.map((s) => s.item.key ?? '').join('|') + segments.length
  const [seen, setSeen] = useState(signature)
  if (seen !== signature) {
    setSeen(signature)
    setExpanded(false)
  }

  const collapsible = maxItems !== undefined && segments.length > maxItems && itemsBeforeCollapse + itemsAfterCollapse < segments.length
  const hidden = collapsible ? segments.slice(itemsBeforeCollapse, segments.length - itemsAfterCollapse) : []

  useEffect(() => {
    if (!focusReveal) return
    setFocusReveal(false)
    firstRevealed.current?.querySelector<HTMLElement>('a, button, [tabindex]')?.focus()
  }, [focusReveal])

  const render = (segment: Segment, index: number) => (
    <Fragment key={segment.item.key ?? index}>
      {segment.item}
      {segment.separator}
    </Fragment>
  )

  let content: ReactNode
  if (!collapsible) {
    content = segments.map(render)
  } else if (!expanded) {
    const separator = hidden[hidden.length - 1]?.separator ?? segments[0]?.separator ?? <BreadcrumbSeparator />
    content = (
      <>
        {segments.slice(0, itemsBeforeCollapse).map(render)}
        <BreadcrumbItem key="breadcrumb-ellipsis">
          <BreadcrumbEllipsis
            render={<button type="button" />}
            aria-label={labels.showMoreCount(hidden.length)}
            onClick={() => {
              setExpanded(true)
              setFocusReveal(true)
            }}
          />
        </BreadcrumbItem>
        {cloneElement(separator, { key: 'breadcrumb-ellipsis-separator' })}
        {segments.slice(segments.length - itemsAfterCollapse).map((s, i) => render(s, segments.length - itemsAfterCollapse + i))}
      </>
    )
  } else {
    content = segments.map((segment, index) => {
      const run = index - itemsBeforeCollapse
      if (run < 0 || run >= hidden.length) return render(segment, index)
      return (
        <RevealContext.Provider key={segment.item.key ?? index} value={run}>
          {run === 0 ? cloneElement(segment.item as ReactElement<{ ref?: unknown }>, { ref: firstRevealed }) : segment.item}
          {segment.separator}
        </RevealContext.Provider>
      )
    })
  }

  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn('own:flex flex-wrap items-center gap-1.5 own:text-ui own:text-fg-muted', className)}
      {...props}
    >
      {content}
    </ol>
  )
}

/** An unfolding crumb or separator: its width grows from zero (so what follows glides aside), then it fades in, a stagger step after the one before. */
function useReveal() {
  const k = useYouj()
  const run = useContext(RevealContext)
  if (run === null || k.reduced) return null
  const delay = k.stagger('tight') * run
  return {
    initial: { width: 0, opacity: 0 },
    animate: { width: 'auto', opacity: 1 },
    transition: {
      width: { ...k.tween('base', 'standard'), delay },
      opacity: { ...k.tween('base', 'enter'), delay: delay + k.stagger('base') },
    },
  }
}

function BreadcrumbItem({ className, ref, ...props }: ComponentProps<'li'>) {
  const reveal = useReveal()
  // Clip only while it grows: afterwards the focus ring needs the room.
  const [clip, setClip] = useState(reveal !== null)
  const classes = cn('own:inline-flex min-w-0 items-center gap-1.5', clip && 'overflow-hidden', className)
  if (!reveal) return <li ref={ref} data-slot="breadcrumb-item" className={classes} {...props} />
  return (
    <m.li
      ref={ref}
      data-slot="breadcrumb-item"
      {...reveal}
      onAnimationComplete={() => setClip(false)}
      className={classes}
      {...(props as ComponentProps<typeof m.li>)}
    />
  )
}

/* A crumb is a flex row (an icon or avatar can lead it), so its text is
 * wrapped in a span that can truncate: text-overflow does nothing on a flex
 * container's own text. */
const crumbClass = "own:inline-flex max-w-48 min-w-0 items-center gap-1.5 [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:shrink-0"

function truncating(children: ReactNode) {
  return Children.map(children, (child) =>
    typeof child === 'string' || typeof child === 'number' ? <span className="min-w-0 truncate">{child}</span> : child,
  )
}

function BreadcrumbLink({ className, render, children, ...props }: useRender.ComponentProps<'a'>) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      {
        className: cn(
          crumbClass,
          'own:rounded-sm transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring',
          className,
        ),
        children: truncating(children),
      },
      props,
    ),
    render,
    state: { slot: 'breadcrumb-link' },
  })
}

/** The current page: plain text marked aria-current, not a link to itself. */
function BreadcrumbPage({ className, children, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn(crumbClass, 'own:font-medium own:text-fg', className)}
      {...props}
    >
      {truncating(children)}
    </span>
  )
}

function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<'li'>) {
  const reveal = useReveal()
  const classes = cn('own:flex items-center own:text-fg-subtle [&>svg]:size-3.5', className)
  // The slanted hairline gets a box as wide as its lean, so an unfolding
  // separator's clip never shaves it to a tick.
  const mark = children ?? (
    <span className="own:flex w-1.5 justify-center">
      <span className="own:block h-3.5 w-px rotate-[20deg] rounded-full bg-line-strong rtl:-rotate-[20deg]" />
    </span>
  )
  if (reveal) {
    return (
      <m.li
        role="presentation"
        aria-hidden
        data-slot="breadcrumb-separator"
        {...reveal}
        {...(props as ComponentProps<typeof m.li>)}
        className={cn(classes, 'overflow-hidden')}
      >
        {mark}
      </m.li>
    )
  }
  return (
    <li role="presentation" aria-hidden data-slot="breadcrumb-separator" className={classes} {...props}>
      {mark}
    </li>
  )
}

/** The folded crumbs. Rendered as a button (with an aria-label naming how many it holds) by a collapsing list. */
function BreadcrumbEllipsis({ className, render, ...props }: useRender.ComponentProps<'span'>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(
          'own:flex h-5 w-6 items-center justify-center own:rounded-sm [&>svg]:size-4',
          '[button&]:transition-colors [button&]:yj-duration-fast [button&]:ease-standard [button&]:hover:bg-hover [button&]:hover:text-fg [button&]:focus-ring',
          className,
        ),
        children: <EllipsisIcon />,
      },
      props,
    ),
    render,
    state: { slot: 'breadcrumb-ellipsis' },
  })
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  type BreadcrumbListProps,
}
