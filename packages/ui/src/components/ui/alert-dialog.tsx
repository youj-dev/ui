'use client'

import { alertDialogLabels, codeBlockLabels } from '@youj/core/labels'
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { useYouj, useYoujScope, usePortalContainer } from '@youj/core'
import { useComponentLabels } from '@youj/core/labels'
import { CheckIcon } from '@youj/icons'
import { CopyIcon } from '@youj/icons/components/youj/icons/copy'
import { cn } from '../../lib/utils'
import { AsyncButton, type AsyncButtonProps } from './async-button'
import { Button, type ButtonProps } from './button'
import { dialogPopupClass, dialogViewportClass, keepFocusOnViewportPress, overlayScrimClass, useDialogFocus } from './dialog'
import { Field, FieldLabel } from './field'
import { InputGroup, InputGroupAddon, InputGroupInput } from './input-group'

/* A dialog that asks before something happens. Same motion as Dialog (yj-dialog
 * over a fading scrim), but it doesn't close on a press outside: it wants an
 * answer. Escape cancels. Focus starts on the least destructive control, which
 * is Cancel unless there is a field to fill, and returns to the trigger.
 * Actions sit in a footer band.
 *
 * ConfirmDialog is the opinionated version, ported from atelier-ui: its
 * confirm button says what it does ("Delete 12 projects", never "OK"), an
 * async confirm keeps the dialog open until the work lands (and stays open,
 * showing the error, if it fails), and `challenge` makes the user type a
 * phrase before a wide destructive action arms.
 *
 * On touch it stays a centered alert, as a phone's own alerts are, and is
 * never a sheet you can pull away: an alert wants an answer, not a swipe.
 * Its actions stack full width with the primary on top (the small size keeps
 * its two side by side), each at least 44px tall, with the buttons' press
 * state; nothing in it waits for a hover. */

function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

/** Base UI's Portal with the youj scope, so the dialog follows Speed and reduced motion, in the provider's `portalContainer` when it sets one. */
function AlertDialogPortal({ container, ...props }: AlertDialogPrimitive.Portal.Props) {
  const scope = useYoujScope()
  const portalContainer = usePortalContainer()
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" container={container ?? portalContainer} {...props} {...scope} />
}

function AlertDialogOverlay({ className, ...props }: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(overlayScrimClass, className)}
      {...props}
    />
  )
}

interface AlertDialogContentProps extends AlertDialogPrimitive.Popup.Props {
  /** `sm` centers a short question over two equal buttons. Default `default`. */
  size?: 'default' | 'sm'
}

function AlertDialogContent({ className, size = 'default', ref, initialFocus, ...props }: AlertDialogContentProps) {
  const focus = useDialogFocus(ref)
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Viewport
        data-slot="alert-dialog-viewport"
        className={dialogViewportClass}
        onMouseDown={keepFocusOnViewportPress}
      >
        <AlertDialogPrimitive.Popup
          ref={focus.ref}
          initialFocus={initialFocus ?? focus.initialFocus}
          data-slot="alert-dialog-content"
          data-yj-tone="overlay"
          data-size={size}
          className={cn(dialogPopupClass, 'group/alert-dialog data-[size=sm]:max-w-xs', className)}
          {...props}
        />
      </AlertDialogPrimitive.Viewport>
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        'own:grid own:gap-1.5',
        // A badge sits beside the title and description…
        'has-data-[slot=alert-dialog-media]:grid-cols-[auto_minmax(0,1fr)] has-data-[slot=alert-dialog-media]:gap-x-3.5',
        // …or, in the small size, everything stacks and centers.
        'group-data-[size=sm]/alert-dialog:grid-cols-1 group-data-[size=sm]/alert-dialog:justify-items-center group-data-[size=sm]/alert-dialog:text-center',
        className,
      )}
      {...props}
    />
  )
}

const alertDialogMediaVariants = cva(
  "row-span-2 own:mb-1 own:inline-grid size-10 place-items-center own:rounded-lg group-data-[size=sm]/alert-dialog:row-span-1 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: 'own:bg-band own:text-fg',
        danger: 'own:bg-danger-subtle own:text-danger-text',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

/** An icon badge beside the title. */
function AlertDialogMedia({
  className,
  variant,
  ...props
}: Omit<ComponentProps<'div'>, 'variant'> & {
  variant?: VariantProps<typeof alertDialogMediaVariants>['variant']
}) {
  return (
    <div
      data-slot="alert-dialog-media"
      aria-hidden
      className={cn(alertDialogMediaVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('own:text-base own:leading-6 own:font-semibold own:tracking-tight text-fg', className)}
      {...props}
    />
  )
}

function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        'own:text-ui text-pretty own:text-fg-muted *:[a]:text-fg *:[a]:underline *:[a]:underline-offset-3',
        className,
      )}
      {...props}
    />
  )
}

/* On touch the actions stack full width at any screen width, primary on top,
 * each at least 44px tall; the `!` wins over the wide screen's row. The small
 * size's two-column grid is kept, since its buttons already share the width. */
const touchFooterClass =
  'touch:flex-col-reverse! touch:items-stretch! touch:justify-start! own:touch:gap-2! touch:[&>:is(button,a)]:min-h-11'

/** The action band: a recessed strip across the bottom edge, Cancel before the action. */
function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'own:-mx-5 own:-mb-5 own:mt-1 own:flex flex-col-reverse own:gap-3 own:rounded-b-[calc(var(--radius-overlay)-1px)] own:border-t own:border-line own:bg-band own:px-5 own:pt-3 own:pb-4 own:sm:gap-2 own:sm:pb-3',
        'sm:flex-row sm:items-center sm:justify-end',
        'group-data-[size=sm]/alert-dialog:grid group-data-[size=sm]/alert-dialog:grid-cols-2',
        touchFooterClass,
        className,
      )}
      {...props}
    />
  )
}

/** A Button. With `onAction` or `status` it is an AsyncButton, so the confirm can show the whole attempt in place. */
function AlertDialogAction(props: ButtonProps | AsyncButtonProps) {
  if ('onAction' in props || 'status' in props) return <AsyncButton data-slot="alert-dialog-action" {...(props as AsyncButtonProps)} />
  return <Button data-slot="alert-dialog-action" {...(props as ButtonProps)} />
}

function AlertDialogCancel({
  variant = 'outline',
  size = 'default',
  ...props
}: AlertDialogPrimitive.Close.Props & Pick<ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}

/* ── ConfirmDialog ─────────────────────────────────────────────────────── */

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** What confirming does, in its own words: "Delete 12 projects". Never "OK". */
  confirmLabel: string
  /** Default "Cancel". */
  cancelLabel?: string
  /**
   * Return a promise to keep the dialog open while the work runs: it closes
   * when the promise resolves, and stays open with the error's message when
   * it rejects, so the failure shows next to the choice that caused it.
   */
  onConfirm: () => unknown
  /** A destructive confirm button and icon badge. */
  destructive?: boolean
  /** The icon in the badge beside the title. */
  icon?: ReactNode
  /**
   * Escalates the confirm: it arms only once this exact phrase is typed.
   * Reserve it for actions that are destructive and wide (many rows, or
   * something named).
   */
  challenge?: string
  /** The challenge field's label. Default: "Type this phrase to confirm", with the phrase in a copyable chip above the field. */
  challengeLabel?: ReactNode
  /** What will be lost, as a list under the description: counts, names. */
  consequences?: ReactNode[]
  /** Announced while an async confirm runs. Default "Working". */
  pendingLabel?: string
  /** Forces the loading state, for work driven elsewhere. An async `onConfirm` sets it by itself. */
  loading?: boolean
  /**
   * Where focus goes once the dialog has closed: an element or ref, or a
   * function that picks one (return `false` to leave focus where it is, say
   * after moving it yourself). Default: back to whatever had focus when it
   * opened. Base UI's `finalFocus`.
   */
  finalFocus?: AlertDialogPrimitive.Popup.Props['finalFocus']
  /** Runs when the open or close animation has finished. Base UI's `onOpenChangeComplete`. */
  onOpenChangeComplete?: AlertDialogPrimitive.Root.Props['onOpenChangeComplete']
  /** Extra content between the description and the challenge, such as what will be affected. */
  children?: ReactNode
}

function PhraseChip({ phrase }: { phrase: string }) {
  const labels = useComponentLabels(alertDialogLabels)
  const codeLabels = useComponentLabels(codeBlockLabels)
  const k = useYouj()
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const copy = (text: string) => {
    const settle = (next: 'copied' | 'error') => {
      setState(next)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setState('idle'), k.ms('deliberate') * 3)
    }
    // The clipboard can refuse (no permission, an insecure page): say so rather than pretend.
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(
        () => settle('copied'),
        () => settle('error'),
      )
  }
  return (
    <div
      data-slot="confirm-dialog-phrase"
      className="own:flex own:items-center own:justify-between own:gap-2 own:rounded-lg own:bg-well own:py-1 own:pe-1 own:ps-3"
    >
      <code aria-hidden className="own:min-w-0 own:break-all own:font-mono own:text-ui-sm own:font-medium own:text-fg select-all">
        {phrase}
      </code>
      <Button type="button" variant="ghost" size="icon-xs" aria-label={labels.copyPhrase} onClick={() => copy(phrase)}>
        <CopyIcon active={state === 'copied'} size={14} strokeWidth={1.75} />
      </Button>
      <span role="status" className="sr-only">
        {state === 'copied' ? codeLabels.copied : state === 'error' ? codeLabels.copyFailed : ''}
      </span>
    </div>
  )
}

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
  icon,
  challenge,
  challengeLabel,
  consequences,
  pendingLabel,
  loading = false,
  finalFocus,
  onOpenChangeComplete,
  children,
}: ConfirmDialogProps) {
  const labels = useComponentLabels(alertDialogLabels)
  const [typed, setTyped] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const armed = challenge === undefined || typed.trim() === challenge
  const busy = loading || running

  const confirm = () => {
    if (!armed || busy) return
    setError(null)
    let result: unknown
    try {
      result = onConfirm()
    } catch (e) {
      setError(errorMessage(e, labels.somethingWentWrong))
      return
    }
    if (!(result instanceof Promise)) {
      onOpenChange(false)
      return
    }
    setRunning(true)
    result.then(
      () => {
        if (!mounted.current) return
        setRunning(false)
        onOpenChange(false)
      },
      (e: unknown) => {
        if (!mounted.current) return
        setRunning(false)
        setError(errorMessage(e, labels.somethingWentWrong))
      },
    )
  }

  return (
    <AlertDialog
      open={open}
      // While the work runs the dialog holds: closing it would hide the outcome.
      onOpenChange={(next) => (busy && !next ? undefined : onOpenChange(next))}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) {
          setTyped('')
          setError(null)
        }
        onOpenChangeComplete?.(isOpen)
      }}
    >
      <AlertDialogContent
        finalFocus={finalFocus}
        // The field, not the chip's copy button before it; a touch open keeps the dialog's default.
        initialFocus={challenge === undefined ? undefined : (type) => (type === 'touch' ? true : (input.current ?? true))}
      >
        <form
          noValidate
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
            confirm()
          }}
        >
          <AlertDialogHeader>
            {icon && <AlertDialogMedia variant={destructive ? 'danger' : 'default'}>{icon}</AlertDialogMedia>}
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          {consequences && consequences.length > 0 && (
            <ul
              data-slot="confirm-dialog-consequences"
              className="own:flex own:flex-col own:gap-1 own:text-ui-sm own:text-fg-muted"
            >
              {consequences.map((item, i) => (
                <li key={i} className="own:flex own:gap-2">
                  <span aria-hidden className="own:mt-[0.55em] own:size-1 own:shrink-0 own:rounded-full own:bg-danger-text" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {children}
          {challenge !== undefined && (
            <Field>
              <FieldLabel className="own:font-normal own:text-fg-muted">
                {challengeLabel ?? (
                  <>
                    {labels.typeToConfirm}
                    <span className="sr-only">: {challenge}</span>
                  </>
                )}
              </FieldLabel>
              {challengeLabel === undefined && <PhraseChip phrase={challenge} />}
              <InputGroup>
                <InputGroupInput
                  ref={input}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  // Read-only, not disabled, while the work runs: disabling the
                  // focused field would drop focus to the page.
                  readOnly={busy}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="font-mono"
                />
                {armed && (
                  <InputGroupAddon align="inline-end" className="text-success">
                    <CheckIcon trigger="mount" size={16} strokeWidth={2.25} />
                  </InputGroupAddon>
                )}
              </InputGroup>
              <span role="status" className="sr-only">
                {typed && armed ? labels.phraseMatches : ''}
              </span>
            </Field>
          )}
          {error && (
            <p role="alert" className="own:text-ui-sm own:font-medium own:text-danger-text">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{cancelLabel ?? labels.cancel}</AlertDialogCancel>
            <Button
              type="submit"
              data-slot="alert-dialog-action"
              variant={destructive ? 'danger' : 'default'}
              disabled={!armed}
              loading={busy}
              loadingLabel={pendingLabel ?? labels.confirming}
            >
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  ConfirmDialog,
}
export type { AlertDialogContentProps, ConfirmDialogProps }
