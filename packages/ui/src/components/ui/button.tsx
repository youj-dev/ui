'use client'

import { isValidElement, useEffect, useState, useSyncExternalStore } from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import type { VariantProps } from 'class-variance-authority'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { buttonLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { buttonVariants } from './button.variants'
import { usePressSound } from './button.press'

/* Only a button that can load needs motion, so a plain Button carries none:
 * the spinner is a chunk of its own, fetched when a button that uses it
 * mounts. Until it arrives the button renders without it, as it does on the
 * server and while hydrating, so server and client markup always agree;
 * buttons mounted after that get it at once. */
function onDemand<T>(load: () => Promise<T>) {
  let loaded: T | undefined
  let pending: Promise<void> | undefined
  const listeners = new Set<() => void>()
  const fetch = () =>
    (pending ??= load().then(
      (value) => {
        loaded = value
        listeners.forEach((listener) => listener())
      },
      // A failed chunk (offline, a deploy in between) is retried by the next button that wants it.
      () => {
        pending = undefined
      },
    ))
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  return function useOnDemand(wanted: boolean): T | undefined {
    const value = useSyncExternalStore(subscribe, () => loaded, () => undefined)
    useEffect(() => {
      if (wanted) void fetch()
    }, [wanted])
    return value
  }
}

const useSpinner = onDemand(() => import('./spinner').then((mod) => mod.Spinner))

declare const process: { env: { NODE_ENV?: string } }

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>

interface ButtonProps extends ButtonPrimitive.Props, Omit<VariantProps<typeof buttonVariants>, 'variant'> {
  /** `default | secondary | outline | ghost | danger | link`. */
  variant?: ButtonVariant
  /**
   * Swaps the label for a spinner without changing the button's width, sets
   * aria-busy, and blocks presses while keeping keyboard focus on the button.
   * Pass it (even as `false`) on any button that can load, so its live region
   * exists before the first announcement. Without it, a click handler that
   * returns a promise puts the button in this state until the promise settles;
   * an explicit `loading` (even `false`) wins. For a success or error label
   * after the work, use AsyncButton.
   */
  loading?: boolean
  /** Announced when loading starts. Default "Loading". */
  loadingLabel?: string
  /** With sound on (`YoujProvider`’s `sound`), the button plays `tap` as it's pressed. `false` keeps this one silent. Default true. */
  sound?: boolean
}

/* What `render` puts in the button's place. Base UI expects a native <button>
 * unless told otherwise, and logs an error for anything else, so a link
 * (`render={<Link href="/x" />}`, `render={<a href="/x" />}`) or another tag
 * is read here and `nativeButton` follows it. A link also keeps its link role,
 * so it's announced as what it is. A component without `href` or `to` can't be
 * told apart from a button and stays native; pass `nativeButton={false}` if it
 * renders something else. */
function renderedAs(render: ButtonProps['render']): 'button' | 'link' | 'other' {
  if (!isValidElement(render)) return 'button'
  const { href, to } = render.props as { href?: unknown; to?: unknown }
  if (href !== undefined || to !== undefined || render.type === 'a') return 'link'
  return typeof render.type === 'string' && render.type !== 'button' ? 'other' : 'button'
}

function Button({ sound = true, ...props }: ButtonProps) {
  // A link-styled button has no press motion, so it has no press sound.
  const press = usePressSound(sound && props.variant !== 'link', props)
  return <PlainButton {...props} {...press} />
}

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | undefined)?.then === 'function'

function PlainButton({
  className,
  variant = 'default',
  size = 'default',
  loading,
  loadingLabel,
  disabled,
  focusableWhenDisabled,
  children,
  nativeButton,
  onClick,
  ...props
}: ButtonProps) {
  const k = useYouj()
  // A click handler that returns a promise keeps the button busy until it settles.
  const [pending, setPending] = useState(false)
  const as = renderedAs(props.render)
  const labels = useComponentLabels(buttonLabels)
  const loads = loading !== undefined || pending
  const busy = loading ?? pending
  // A button that can load fetches its spinner up front, so it's there the
  // moment loading starts.
  const Spinner = useSpinner(loads)

  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={busy || undefined}
      // A className that sets a fill replaces a style's sheen too (bezel.css), not only the colour under it. own-variant: ignore
      data-fill={className && !cn('bg-action', className).split(' ').includes('bg-action') ? 'custom' : undefined}
      data-reduced-motion={k.reduced || undefined}
      aria-busy={busy || undefined}
      // `||`, not `??`: an explicit disabled={false} must not undo the block
      // that loading puts on presses.
      disabled={disabled === true || busy}
      // A button that goes busy under the user's finger keeps focus, so a
      // keyboard user is not dropped onto <body> mid-action.
      focusableWhenDisabled={focusableWhenDisabled === true || busy}
      className={cn(buttonVariants({ variant, size }), className)}
      nativeButton={nativeButton ?? as === 'button'}
      onClick={(event) => {
        const result: unknown = onClick?.(event)
        if (!isThenable(result)) return
        setPending(true)
        // The rejection still surfaces, as it would for any unawaited handler.
        void result.then(
          () => setPending(false),
          (error: unknown) => {
            setPending(false)
            throw error
          },
        )
      }}
      // Base UI gives a non-native button role="button"; a link stays a link.
      {...(as === 'link' && { role: 'link' })}
      {...props}
    >
      {!loads ? (
        children
      ) : (
        <>
          <span
            data-slot="button-label"
            className="own:inline-flex items-center gap-[inherit] transition-opacity yj-duration-fast ease-standard group-data-loading/button:opacity-0"
          >
            {children}
          </span>
          {busy && (
            <span aria-hidden className="absolute inset-0 own:grid place-items-center">
              {Spinner && <Spinner label={null} />}
            </span>
          )}
          {/* Mounted before it is needed; only its text changes. Several
              screen readers ignore a live region that arrives with its
              message already inside. */}
          <span role="status" className="sr-only">
            {busy ? (loadingLabel ?? labels.loading) : ''}
          </span>
        </>
      )}
    </ButtonPrimitive>
  )
}

export { Button, type ButtonProps }
// In a module of its own, so a link styled as a button (or a server component) takes the classes without the Button.
export { buttonVariants } from './button.variants'
