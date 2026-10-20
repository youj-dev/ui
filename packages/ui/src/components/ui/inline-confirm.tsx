'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { MorphLabel, useMorphRoot, type AsyncState } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { inlineConfirmLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { AsyncButton, type AsyncButtonProps } from './async-button'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { Button, type ButtonProps } from './button'

/* A button that confirms in its own place instead of opening a dialog.
 * Pressed, it splits (useMorphRoot + MorphLabel, the AsyncButton motion) into
 * two icon buttons, a cross to cancel and a tick to confirm, and focus moves
 * to the tick; the question is the pair's accessible name and is announced. The confirm is an AsyncButton: `onConfirm` is awaited through
 * pending to done or failed, then the row folds back into the trigger. Before
 * it's pressed, Escape, Cancel, focus leaving the row or `timeout` fold it back;
 * Escape and Cancel return focus to the trigger. */

interface InlineConfirmProps extends Omit<ComponentProps<'div'>, 'children' | 'onError'> {
  /** The trigger's label, and the confirm button's unless `confirmLabel` is set. */
  children: ReactNode
  /**
   * The action, run when the confirm button is pressed. It is awaited as an
   * AsyncButton's `onAction`: resolve for success, reject or throw for an
   * error. A second press while it runs is ignored.
   */
  onConfirm: () => unknown
  /** The question the cross and tick answer: the pair's accessible name, announced as it opens. Default "Are you sure?". */
  prompt?: string
  /** The tick's accessible name. Default: `children` when it is a string, else the question. */
  confirmLabel?: string
  /** The cross's accessible name. Default "Cancel". */
  cancelLabel?: string
  /** Shown beside the spinner while `onConfirm` runs, and announced. Default "Working…". */
  pendingLabel?: AsyncButtonProps['pendingLabel']
  /** Shown beside the check once `onConfirm` resolves, and announced. Default "Done". */
  successLabel?: AsyncButtonProps['successLabel']
  /** Shown beside the cross when `onConfirm` rejects, and announced assertively. Default "Failed". */
  errorLabel?: AsyncButtonProps['errorLabel']
  /** How long the outcome shows before the row folds back into the trigger, in ms. Default: 3 × the deliberate token. */
  resetAfter?: number
  /** The action deletes or can't be undone: the confirm button takes the danger fill. */
  destructive?: boolean
  /** The trigger's look: `default | secondary | outline | ghost | danger`. Default `outline`. */
  variant?: Exclude<ButtonProps['variant'], 'link'>
  /** `sm | default | lg`: the trigger's size, and the cross and tick at the matching icon size. */
  size?: 'sm' | 'default' | 'lg'
  /** How long the open question waits for an answer before it folds back, in ms. `false` waits until it's answered. Default 5000. */
  timeout?: number | false
  /** Blocks the trigger. */
  disabled?: boolean
  /** Fires when the question opens or folds back. */
  onOpenChange?: (open: boolean) => void
  /** With sound on (`YoujProvider`’s `sound`), opening and folding back sound, and the confirm sounds as an AsyncButton does. `false` keeps it silent. Default true. */
  sound?: boolean
}

function InlineConfirm({
  children,
  onConfirm,
  prompt,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  successLabel,
  errorLabel,
  resetAfter,
  destructive = false,
  variant = 'outline',
  size = 'default',
  timeout = 5000,
  disabled = false,
  onOpenChange,
  sound = true,
  className,
  onKeyDown,
  onBlur,
  onPointerEnter,
  onPointerLeave,
  ...props
}: InlineConfirmProps) {
  const labels = useComponentLabels(inlineConfirmLabels)
  const cue = useSoundCue()
  const morph = useMorphRoot()
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<AsyncState>('idle')
  const [hovered, setHovered] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const confirm = useRef<HTMLButtonElement>(null)
  // Where focus goes once the row has swapped: 'confirm' on opening, 'trigger' on a cancel.
  const focusNext = useRef<'confirm' | 'trigger' | null>(null)
  const settled = useRef(false)

  const question = prompt ?? labels.inlineConfirmPrompt
  const confirmName = confirmLabel ?? (typeof children === 'string' ? children : question)
  const iconSize = size === 'default' ? 'icon' : (`icon-${size}` as const)
  const busy = action !== 'idle'

  const change = (next: boolean, focus: 'trigger' | null) => {
    if (next === open) return
    focusNext.current = next ? 'confirm' : focus
    setOpen(next)
    setAction('idle')
    onOpenChange?.(next)
    if (sound) cue(next ? 'open' : 'close')
  }
  // Folding back on its own (a timeout, a settled action) keeps focus in the row if it was there.
  const fold = () => change(false, root.current?.contains(document.activeElement) ? 'trigger' : null)

  // Focus moves once the row has swapped: after `open` changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on each swap of the row
  useLayoutEffect(() => {
    const target = focusNext.current === 'confirm' ? confirm.current : focusNext.current === 'trigger' ? trigger.current : null
    focusNext.current = null
    target?.focus()
  }, [open])

  // An open question waits `timeout`, paused while the pointer is on it and while the action runs.
  // biome-ignore lint/correctness/useExhaustiveDependencies: fold reads the latest render; the timer restarts only when these change
  useEffect(() => {
    if (!open || busy || hovered || timeout === false) return
    const timer = setTimeout(fold, timeout)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fold reads the latest render; the timer restarts only when these change
  }, [open, busy, hovered, timeout])

  const onActionStateChange = (next: AsyncState) => {
    if (next !== 'idle') settled.current = next !== 'pending'
    setAction(next)
    // The outcome has shown for its while: the row folds back into the trigger.
    if (next === 'idle' && settled.current) {
      settled.current = false
      fold()
    }
  }

  return (
    <MotionFeatures features="max">
      <div
        ref={root}
        {...props}
        role="group"
        aria-label={open ? question : undefined}
        data-slot="inline-confirm"
        data-state={open ? 'open' : 'closed'}
        data-size={size}
        className={cn('relative own:inline-flex', className)}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || event.key !== 'Escape' || !open || busy) return
          // Escape answers the question here, not the dialog or menu around it.
          event.preventDefault()
          event.stopPropagation()
          change(false, 'trigger')
        }}
        onBlur={(event: FocusEvent<HTMLDivElement>) => {
          onBlur?.(event)
          const next = event.relatedTarget
          // A button leaving with the swap takes focus with it; that isn't focus leaving the row.
          if (!open || busy || !event.target.isConnected || (next instanceof Node && root.current?.contains(next))) return
          change(false, null)
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event)
          setHovered(true)
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event)
          setHovered(false)
        }}
      >
        {/* The box that morphs: the trigger's width to the pair's and back, on the AsyncButton's spring. */}
        <m.span {...morph} data-slot="inline-confirm-box" className="own:inline-flex items-center">
          <MorphLabel value={open ? 'open' : 'closed'} contentClassName="gap-1.5">
            {open ? (
              <>
                <Button
                  variant="outline"
                  size={iconSize}
                  aria-label={cancelLabel ?? labels.cancel}
                  data-slot="inline-confirm-cancel"
                  sound={false}
                  disabled={busy}
                  onClick={() => change(false, 'trigger')}
                >
                  <XIcon />
                </Button>
                <AsyncButton
                  ref={confirm}
                  variant={destructive ? 'danger' : 'default'}
                  size={iconSize}
                  aria-label={confirmName}
                  data-slot="inline-confirm-action"
                  sound={sound}
                  pendingLabel={pendingLabel}
                  successLabel={successLabel}
                  errorLabel={errorLabel}
                  resetAfter={resetAfter}
                  onActionStateChange={onActionStateChange}
                  onAction={onConfirm}
                >
                  <CheckIcon />
                </AsyncButton>
              </>
            ) : (
              <Button
                ref={trigger}
                variant={variant}
                size={size}
                data-slot="inline-confirm-trigger"
                disabled={disabled}
                sound={false}
                onClick={() => change(true, null)}
              >
                {children}
              </Button>
            )}
          </MorphLabel>
        </m.span>
        <span role="status" data-slot="inline-confirm-announcer" className="sr-only">
          {open && !busy ? question : ''}
        </span>
      </div>
    </MotionFeatures>
  )
}

export { InlineConfirm, type InlineConfirmProps }
