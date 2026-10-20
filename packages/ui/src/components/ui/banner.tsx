'use client'

import { bannerLabels } from '@youj/core/labels'
import { useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { type VariantProps } from 'class-variance-authority'
import { Collapse } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { ArrowRightIcon, XIcon } from '@youj/icons'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { bannerVariants } from './banner.variants'

/* An announcement bar across the top of a page or an app: a launch, a
 * maintenance window, a trial running out. It is a named region, full bleed,
 * its message centered on one line where it fits. An optional action link
 * sends its arrow out and back in on hover or focus (the icon's own
 * choreography). Dismissing it collapses the bar through motion's Collapse:
 * height to 0 while the content fades out quicker than it folds, so the page
 * below glides up instead of jumping, and a keyboard user's focus moves on to
 * the next thing rather than dropping to <body>. A reversal mid-collapse
 * (controlled `open` flipped back) starts from the current height. Reduced
 * motion: the bar is removed at once and the arrow holds still. */

type BannerVariant = NonNullable<VariantProps<typeof bannerVariants>['variant']>

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The tabbable element after `el` in document order (or, failing that, the one before it). */
function neighbourOf(el: HTMLElement) {
  const all = Array.from(document.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (node) =>
      !el.contains(node) &&
      !node.closest('[inert], [hidden]') &&
      (typeof node.checkVisibility === 'function' ? node.checkVisibility({ visibilityProperty: true }) : true),
  )
  const after = all.find((node) => el.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)
  return after ?? all.filter((node) => el.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING).pop()
}

interface BannerProps extends ComponentProps<'div'>, VariantProps<typeof bannerVariants> {
  /** A leading icon or badge, before the message. */
  icon?: ReactNode
  /** Show a dismiss button. Implied by `onOpenChange`. */
  dismissible?: boolean
  /** Controlled visibility. */
  open?: boolean
  /** Uncontrolled initial visibility. Default true. */
  defaultOpen?: boolean
  /** Called with `false` when dismissed. */
  onOpenChange?: (open: boolean) => void
  /** Accessible name of the dismiss button. Default "Dismiss announcement". */
  dismissLabel?: string
}

function Banner({
  className,
  variant = 'default',
  icon,
  dismissible,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  dismissLabel,
  'aria-label': ariaLabel,
  children,
  ...props
}: BannerProps) {
  const labels = useComponentLabels(bannerLabels)
  dismissLabel ??= labels.dismissAnnouncement
  ariaLabel ??= labels.announcement
  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? openState
  const ref = useRef<HTMLDivElement>(null)
  const canDismiss = dismissible ?? onOpenChange !== undefined
  const tone: BannerVariant = variant ?? 'default'

  const dismiss = () => {
    const el = ref.current
    // Collapse makes the closing bar inert at once, which would drop focus onto <body>: hand it on first.
    if (el && el.contains(document.activeElement)) neighbourOf(el)?.focus()
    setOpenState(false)
    onOpenChange?.(false)
  }

  return (
    <Collapse open={open} data-slot="banner-collapse">
      <div
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        data-slot="banner"
        data-variant={tone}
        className={cn(bannerVariants({ variant: tone }), className)}
        {...props}
      >
        {icon && (
          <span data-slot="banner-icon" aria-hidden className="own:flex items-center [&_svg]:size-4">
            {icon}
          </span>
        )}
        {children}
        {canDismiss && (
          <Button
            data-slot="banner-dismiss"
            variant="ghost"
            size="icon-xs"
            aria-label={dismissLabel}
            onClick={dismiss}
            className="absolute end-2 top-1/2 -translate-y-1/2 own:text-(--banner-muted) own:hover:bg-current/10 own:hover:text-current"
          >
            <XIcon size={14} />
          </Button>
        )}
      </div>
    </Collapse>
  )
}

/** The message: a short line, with an optional lead-in in `<strong>`. */
function BannerTitle({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="banner-title"
      className={cn('min-w-0 text-pretty [&_strong]:font-semibold [&>span]:text-(--banner-muted)', className)}
      {...props}
    />
  )
}

/** A link after the message. Its arrow nudges out and back on hover or focus. */
function BannerAction({ className, children, ...props }: ComponentProps<'a'>) {
  return (
    <a
      data-slot="banner-action"
      data-yj-trigger=""
      className={cn(
        'own:inline-flex shrink-0 items-center gap-1 own:rounded-sm own:font-medium underline decoration-current/35 underline-offset-3 focus-ring',
        'transition-[text-decoration-color] yj-duration-fast ease-standard hover:decoration-current',
        className,
      )}
      {...props}
    >
      {children}
      <ArrowRightIcon size={14} aria-hidden className="rtl:-scale-x-100" />
    </a>
  )
}

export { Banner, BannerTitle, BannerAction, bannerVariants, type BannerProps }
