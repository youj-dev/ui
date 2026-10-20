'use client'

import { alertLabels } from '@youj/core/labels'
import { useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { Collapse } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, OctagonAlertIcon, XIcon } from '@youj/icons'
import type { Status } from '@youj/core'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { alertVariants } from './alert.variants'

/* A status message with a severity. Each variant tints the surface and
 * brings its youj icon, which plays once as the alert appears: info
 * draws its stem and drops the dot, success draws its ring and check,
 * warning rocks on its base, danger shakes. Warning and danger interrupt
 * (role="alert"); info and success wait their turn (role="status").
 * Dismissible alerts collapse through motion's Collapse (height to 0 while
 * the content fades), so what follows glides up instead of jumping, and a
 * keyboard user's focus moves on to the next thing rather than to <body>.
 * Reduced motion shows the icons at rest and removes the alert at once. */

type AlertVariant = Extract<Status, 'info' | 'success' | 'warning' | 'danger'>

const ICONS: Record<AlertVariant, ReactNode> = {
  info: <InfoIcon trigger="mount" size={16} strokeWidth={1.75} />,
  success: <CheckCircleIcon trigger="mount" size={16} strokeWidth={1.75} />,
  warning: <AlertTriangleIcon trigger="mount" size={16} strokeWidth={1.75} />,
  danger: <OctagonAlertIcon trigger="mount" size={16} strokeWidth={1.75} />,
}

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

interface AlertProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** The severity: `info`, `success`, `warning` or `danger`, the name Button, Badge and the menus use. Default `info`. */
  variant?: AlertVariant | null
  /** Replace the variant's icon, or `false` for none. */
  icon?: ReactNode | false
  /** Show a dismiss button. Implied by `onOpenChange`. */
  dismissible?: boolean
  /** Controlled visibility. */
  open?: boolean
  /** Uncontrolled initial visibility. Default true. */
  defaultOpen?: boolean
  /** Called with `false` when dismissed. */
  onOpenChange?: (open: boolean) => void
  /** Accessible name of the dismiss button. Default "Dismiss". */
  dismissLabel?: string
}

function Alert({
  className,
  variant = 'info',
  icon,
  dismissible,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  dismissLabel,
  role,
  children,
  ...props
}: AlertProps) {
  const labels = useComponentLabels(alertLabels)
  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? openState
  const ref = useRef<HTMLDivElement>(null)
  const canDismiss = dismissible ?? onOpenChange !== undefined
  const tone: AlertVariant = variant ?? 'info'

  const dismiss = () => {
    const el = ref.current
    // Collapse makes the closing alert inert at once, which would drop focus
    // onto <body>: hand it to the next thing first.
    if (el && el.contains(document.activeElement)) neighbourOf(el)?.focus()
    setOpenState(false)
    onOpenChange?.(false)
  }

  return (
    <Collapse open={open} data-slot="alert-collapse">
      <div
        ref={ref}
        data-slot="alert"
        data-variant={tone}
        role={role ?? (tone === 'warning' || tone === 'danger' ? 'alert' : 'status')}
        className={cn(alertVariants({ variant: tone }), className)}
        {...props}
      >
        {icon !== false && (
          <span data-slot="alert-icon" aria-hidden className="own:flex h-5 items-center own:text-(--alert-icon) [&_svg]:size-4">
            {icon ?? ICONS[tone]}
          </span>
        )}
        <div data-slot="alert-content" className={cn('own:flex min-w-0 flex-col gap-0.5', icon === false && 'col-span-2')}>
          {children}
        </div>
        {canDismiss && (
          <Button
            data-slot="alert-dismiss"
            variant="ghost"
            size="icon-xs"
            aria-label={dismissLabel ?? labels.dismiss}
            onClick={dismiss}
            className="-me-1 own:text-fg-muted own:hover:bg-hover"
          >
            <XIcon />
          </Button>
        )}
      </div>
    </Collapse>
  )
}

function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('own:leading-5 own:font-medium own:text-fg [&_a]:underline [&_a]:underline-offset-3', className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'own:text-fg-muted [&_a]:text-fg [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-2',
        className,
      )}
      {...props}
    />
  )
}

/** Actions under the message: a button or two, or a link. */
function AlertAction({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-action" className={cn('own:mt-2 own:flex flex-wrap items-center gap-2', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants, type AlertProps, type AlertVariant }
