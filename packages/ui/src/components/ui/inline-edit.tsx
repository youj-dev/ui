'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { useSoundCue } from '@youj/core'
import { useYouj } from '@youj/core/lib/youj/provider'
import { inlineEditLabels, useComponentLabels } from '@youj/core/labels'
import { AsyncAnnouncer, Collapse } from '@youj/motion'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupTextarea } from './input-group'
import { Spinner } from './spinner'

/* Text that edits in place. It reads as text until it's pressed, then the
 * same words sit in a field at the same spot: the preview and the field share
 * their box (height, padding, corner, type), so nothing moves but the frame
 * that appears around them. A click puts the caret where it landed (where the
 * browser can say), the keyboard selects the text (Enter, Space or F2). Enter
 * saves, Escape cancels, and leaving the field saves (`saveOnBlur`).
 * `multiline` edits in a textarea that grows, where Enter starts a new line
 * and Ctrl or Command with Enter saves, with Save and Cancel in the frame.
 *
 * Saving: `validate` can refuse the draft, and `onSave` can return a promise.
 * While it runs the field stays open, read-only, with a spinner at its end;
 * it closes when the promise resolves and a check draws after the text. A
 * refusal or a rejection keeps the field open with its reason under it, so
 * nothing typed is lost; the outcome is announced.
 *
 * Motion: the swap itself is instant, since the text holds still. A refusal
 * shakes the frame (a decaying 4/3/2 px on the slow token, as AsyncFeedback's
 * error) while the reason grows in under it (Collapse), and the check draws
 * on. Reduced motion: no shake, the reason appears at once, and the check is
 * drawn finished. */

interface InlineEditProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange' | 'onError'> {
  /**
   * What the value is ("Project name"). It names the field, and the preview
   * after the text it shows: "Apollo, edit Project name".
   */
  label: string
  /** The saved value, controlled. */
  value?: string
  /** The saved value to start from, uncontrolled. Default "". */
  defaultValue?: string
  /** Fires with the new value once it's saved: at once, or when `onSave`'s promise resolves. */
  onValueChange?: (value: string) => void
  /**
   * Saves a changed value (an unchanged one just closes the field). Return a
   * promise to keep the field open while it saves: it closes when the promise
   * resolves, and stays open with the error's message when it rejects or
   * throws, so the text can be fixed and saved again.
   */
  onSave?: (value: string) => unknown
  /** Returns a reason to refuse the draft before it's saved, or nothing to accept it. */
  validate?: (value: string) => string | null | undefined | void
  /** Shown, muted, while the value is empty, and as the empty field's placeholder. Default "Empty". */
  placeholder?: string
  /**
   * Edits in a textarea that grows: Enter starts a new line, Ctrl or Command
   * with Enter saves. The preview keeps the line breaks; one line truncates.
   */
  multiline?: boolean
  /** Save and Cancel buttons in the field's frame. Default: on for `multiline`, off for one line, where Enter saves. */
  actions?: boolean
  /** Leaving the field saves the draft; `false` cancels it instead. A draft held back by an error stays open either way. Default true. */
  saveOnBlur?: boolean
  /** Whether the field is open, controlled. It takes focus as it opens. */
  editing?: boolean
  /** Opens the field on the first render, focused: for an item that was just created. */
  defaultEditing?: boolean
  /** Fires when the field opens or closes. */
  onEditingChange?: (editing: boolean) => void
  /** Announced while `onSave` runs. Default "Saving…". */
  pendingLabel?: string
  /** Announced when `onSave` resolves. Default "Saved". */
  successLabel?: string
  /**
   * Shown under the field when `onSave` rejects or throws, and announced.
   * Default: the error's message, else "Couldn’t save". A function gets what
   * it rejected with: `errorLabel={(error) => describe(error)}`.
   */
  errorLabel?: string | ((error: unknown) => string)
  /** Blocks editing. The value still reads as text. */
  disabled?: boolean
  /** With sound on (`YoujProvider`’s `sound`), a save that resolves sounds its success, and a refusal its error. `false` keeps it silent. Default true. */
  sound?: boolean
}

type Caret = number | 'all' | 'end'

/** The browsers' two ways to find the caret under a point: the standard one, and WebKit's older one. */
interface CaretLookup {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  caretRangeFromPoint?: (x: number, y: number) => { startContainer: Node; startOffset: number } | null
}

/** Where in `text` a click at (x, y) landed, as a caret offset, when the browser can tell. */
function caretAt(x: number, y: number, text: HTMLElement | null): number | null {
  if (!text) return null
  const lookup = document as unknown as CaretLookup
  const position = lookup.caretPositionFromPoint?.(x, y)
  const range = position ? null : lookup.caretRangeFromPoint?.(x, y)
  const node = position?.offsetNode ?? range?.startContainer
  if (!node || node.nodeType !== Node.TEXT_NODE || !text.contains(node)) return null
  return position?.offset ?? range?.startOffset ?? null
}

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function'

function InlineEdit({
  label,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onSave,
  validate,
  placeholder,
  multiline = false,
  actions,
  saveOnBlur = true,
  editing: editingProp,
  defaultEditing = false,
  onEditingChange,
  pendingLabel,
  successLabel,
  errorLabel,
  disabled = false,
  sound = true,
  className,
  onKeyDown,
  onBlur,
  ...props
}: InlineEditProps) {
  const labels = useComponentLabels(inlineEditLabels)
  const k = useYouj()
  const cue = useSoundCue()
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [editing, setEditing] = useControllableState(editingProp, defaultEditing)
  const [draft, setDraft] = useState(value)
  const [status, setStatus] = useState<'idle' | 'pending' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)
  // Each opening starts from the saved value, however it opened: a press, or `editing` from outside.
  const [opened, setOpened] = useState(editing)
  if (opened !== editing) {
    setOpened(editing)
    setError(null)
    if (editing) {
      setDraft(value)
      if (status === 'success') setStatus('idle')
    }
  }

  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const root = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const preview = useRef<HTMLButtonElement>(null)
  const shown = useRef<HTMLSpanElement>(null)
  // Where the caret goes as the field opens; unset, the text is selected (one line) or the caret goes to its end.
  const caret = useRef<Caret | null>(null)
  // Whether focus goes back to the preview as the field closes: only when it was in the field, and not on the way out.
  const returnFocus = useRef(false)
  const leaving = useRef(false)
  const composing = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const pending = status === 'pending'
  const withActions = actions ?? multiline
  const text = value === '' ? (placeholder ?? labels.empty) : value

  // Focus follows the swap: into the field as it opens, with the caret placed, and back to the preview as it closes.
  useLayoutEffect(() => {
    if (!editing) {
      if (returnFocus.current) preview.current?.focus()
      returnFocus.current = false
      return
    }
    const el = field.current
    if (!el) return
    el.focus()
    const at = caret.current ?? (el.tagName === 'TEXTAREA' ? 'end' : 'all')
    caret.current = null
    if (at === 'all') el.select()
    else {
      const offset = at === 'end' ? el.value.length : Math.min(at, el.value.length)
      el.setSelectionRange(offset, offset)
    }
  }, [editing])

  // The check after a save holds for a moment, then goes.
  useEffect(() => {
    if (status !== 'success') return
    const timer = setTimeout(() => setStatus('idle'), k.ms('deliberate') * 3)
    return () => clearTimeout(timer)
  }, [status, k])

  const open = (at: Caret | null) => {
    if (disabled || editing) return
    caret.current = at
    setEditing(true)
    onEditingChange?.(true)
  }

  const close = () => {
    // A blur that saved leaves focus where it went; Enter, Escape and the buttons bring it back.
    returnFocus.current = !leaving.current && !!root.current?.contains(document.activeElement)
    setEditing(false)
    onEditingChange?.(false)
  }

  const cancel = () => {
    if (pending) return
    setError(null)
    close()
  }

  const refuse = (reason: string) => {
    setError(reason)
    if (sound) cue('error')
    const el = frame.current
    if (k.reduced || !el?.animate) return
    // A plain Web Animation, as AsyncFeedback's error: 4, 3, 2 px and home.
    const easing = `cubic-bezier(${k.ease('standard').join(',')})` // youj-allow: the standard ease token, serialized for WAAPI
    el.animate(
      [0, -4, 4, -3, 3, -2, 0].map((x) => ({ transform: `translateX(${x}px)`, easing })),
      { duration: k.ms('slow') },
    )
  }

  const accept = (next: string, saved: boolean) => {
    setValue(next)
    onValueChange?.(next)
    setError(null)
    setStatus(saved ? 'success' : 'idle')
    if (saved && sound) cue('success')
    close()
  }

  const failure = (thrown: unknown) =>
    typeof errorLabel === 'function'
      ? errorLabel(thrown)
      : (errorLabel ?? (thrown instanceof Error && thrown.message ? thrown.message : labels.saveFailed))

  const commit = () => {
    if (pending) return
    const next = draft
    if (next === value) return cancel()
    const reason = validate?.(next)
    if (reason) return refuse(reason)
    let result: unknown
    try {
      result = onSave?.(next)
    } catch (thrown) {
      return refuse(failure(thrown))
    }
    if (!isThenable(result)) return accept(next, false)
    setStatus('pending')
    setError(null)
    result.then(
      () => {
        if (mounted.current) accept(next, true)
      },
      (thrown: unknown) => {
        if (!mounted.current) return
        setStatus('idle')
        refuse(failure(thrown))
      },
    )
  }

  const onFieldKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Enter commits a CJK candidate mid-composition: browsers flag it as isComposing, or (Safari) as keyCode 229 after compositionend.
    if (event.key !== 'Enter' || composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return
    if (multiline && !event.metaKey && !event.ctrlKey) return
    event.preventDefault()
    commit()
  }

  // A press in the frame around the field (Save, Cancel, the spinner, the toolbar row) keeps focus in it: a blur would decide first.
  const keepFocus = (event: MouseEvent) => {
    if (event.target !== field.current) event.preventDefault()
  }

  const fieldProps = {
    ref: field,
    value: draft,
    placeholder: placeholder ?? labels.empty,
    disabled,
    readOnly: pending,
    'aria-label': label,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${errorId} ${hintId}` : hintId,
    'aria-busy': pending || undefined,
    onChange: (event: { target: { value: string } }) => {
      if (error) setError(null)
      setDraft(event.target.value)
    },
    onKeyDown: onFieldKeyDown,
    onCompositionStart: () => {
      composing.current = true
    },
    onCompositionEnd: () => {
      composing.current = false
    },
    className: cn(pending && 'own:text-fg-muted'),
  }

  return (
    <div
      ref={root}
      {...props}
      data-slot="inline-edit"
      data-state={editing ? 'editing' : 'preview'}
      data-status={status === 'idle' ? undefined : status}
      data-invalid={error ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      className={cn('own:flex own:w-full own:min-w-0 flex-col', className)}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.key !== 'Escape' || !editing || pending || event.nativeEvent.isComposing) return
        // Escape cancels the edit here, not the dialog or menu around it.
        event.preventDefault()
        event.stopPropagation()
        cancel()
      }}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        onBlur?.(event)
        const next = event.relatedTarget
        // Focus moving to the field's own buttons, or leaving with the swap, isn't leaving; a refused draft waits for a fix or Escape.
        if (!editing || pending || error || !event.target.isConnected || (next instanceof Node && root.current?.contains(next))) return
        leaving.current = true
        if (saveOnBlur) commit()
        else cancel()
        leaving.current = false
      }}
    >
      {editing ? (
        <InputGroup ref={frame} role={undefined} onMouseDown={keepFocus}>
          {multiline ? <InputGroupTextarea {...fieldProps} /> : <InputGroupInput {...fieldProps} />}
          {(pending || withActions) && (
            <InputGroupAddon align={multiline ? 'block-end' : 'inline-end'} className={cn(multiline && 'justify-end')}>
              {pending ? (
                <Spinner label={null} className="own:text-fg-muted" />
              ) : multiline ? (
                <>
                  <InputGroupButton size="sm" sound={false} onClick={cancel}>
                    {labels.cancel}
                  </InputGroupButton>
                  <InputGroupButton size="sm" variant="default" sound={false} onClick={commit}>
                    {labels.save}
                  </InputGroupButton>
                </>
              ) : (
                <>
                  <InputGroupButton size="icon-xs" aria-label={labels.cancel} sound={false} onClick={cancel}>
                    <XIcon />
                  </InputGroupButton>
                  <InputGroupButton size="icon-xs" aria-label={labels.save} sound={false} onClick={commit}>
                    <CheckIcon />
                  </InputGroupButton>
                </>
              )}
            </InputGroupAddon>
          )}
        </InputGroup>
      ) : (
        <button
          ref={preview}
          type="button"
          data-slot="inline-edit-preview"
          aria-label={labels.inlineEditTrigger(text, label)}
          disabled={disabled}
          // From the keyboard (no pointer, so detail 0) the text is selected; a click puts the caret where it landed.
          onClick={(event) => open(event.detail === 0 || value === '' ? null : caretAt(event.clientX, event.clientY, shown.current))}
          onKeyDown={(event) => {
            if (event.key !== 'F2') return
            event.preventDefault()
            open(null)
          }}
          className={cn(
            'own:flex own:w-full own:min-w-0 own:gap-1.5 own:border own:border-transparent own:bg-transparent own:px-2.5 own:text-start own:text-ui own:text-fg own:touch:text-base',
            'cursor-text transition-[background-color] yj-duration-fast ease-standard own:hover:bg-hover own:focus-ring',
            'disabled:cursor-not-allowed own:disabled:hover:bg-transparent',
            multiline
              ? 'own:min-h-control items-start own:rounded-field-area own:py-2 own:leading-5'
              : 'own:h-control items-center own:rounded-field',
          )}
        >
          <span
            ref={shown}
            data-slot="inline-edit-text"
            className={cn('own:min-w-0', multiline ? 'own:whitespace-pre-wrap own:break-words' : 'own:truncate', value === '' && 'own:text-fg-muted')}
          >
            {text}
          </span>
          {status === 'success' && <CheckIcon trigger="mount" size={16} strokeWidth={2.25} className="own:shrink-0 own:text-success" />}
        </button>
      )}
      <Collapse open={editing && !!error}>
        <p id={errorId} role="alert" data-slot="inline-edit-error" className="own:pt-1.5 own:text-ui-sm own:font-medium own:text-danger">
          {error}
        </p>
      </Collapse>
      {editing && (
        <span id={hintId} data-slot="inline-edit-hint" className="sr-only">
          {multiline ? labels.inlineEditHintMultiline : labels.inlineEditHint}
        </span>
      )}
      <AsyncAnnouncer state={status} pendingLabel={pendingLabel ?? labels.saving} successLabel={successLabel ?? labels.saved} />
    </div>
  )
}

export { InlineEdit, type InlineEditProps }
