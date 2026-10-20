'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useComponentLabels } from '@youj/core/labels'
import { chatToolApprovalLabels } from '@youj/core/labels'
import { EyeIcon } from '@youj/icons/components/youj/icons/eye'
import { EyeOffIcon } from '@youj/icons/components/youj/icons/eye-off'
import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { Field, FieldError, FieldLabel } from '../field'
import { Input } from '../input'
import { Textarea } from '../textarea'

/* The arguments of a ToolApproval: a readable key/value list, and the form
 * that edits it. Sensitive values stay masked until revealed, long values clamp
 * behind Show more, and an edit is parsed back to each value's original type. */

const SENSITIVE = /pass(word|wd)?|secret|token|api[-_ ]?key|authorization|credential|private[-_ ]?key/i
const LONG = 140

export const isSensitive = (key: string, sensitive: readonly string[] | undefined) => sensitive?.includes(key) || SENSITIVE.test(key)

const asText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? String(value))
const isLong = (text: string) => text.length > LONG || text.includes('\n')

function ArgValue({ name, value, masked }: { name: string; value: unknown; masked: boolean }) {
  const labels = useComponentLabels(chatToolApprovalLabels)
  const id = useId()
  const [shown, setShown] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const text = asText(value)
  if (masked) {
    return (
      <span className="own:flex min-w-0 items-center gap-1.5">
        <span className="min-w-0 break-all own:font-mono">
          {shown ? text : <span aria-hidden>••••••••</span>}
          {!shown && <span className="sr-only">{labels.toolApprovalHidden}</span>}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={shown ? labels.toolApprovalHideValue(name) : labels.toolApprovalShowValue(name)}
          aria-pressed={shown}
          onClick={() => setShown(!shown)}
        >
          {shown ? <EyeOffIcon size={14} strokeWidth={1.75} /> : <EyeIcon size={14} strokeWidth={1.75} />}
        </Button>
      </span>
    )
  }
  const long = isLong(text)
  return (
    <span className="own:flex min-w-0 flex-col items-start gap-0.5">
      <span id={id} className={cn('min-w-0 whitespace-pre-wrap break-words own:font-mono', long && !expanded && 'own:line-clamp-2')}>
        {text}
      </span>
      {long && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
          className="rounded-sm own:text-ui-sm text-accent-text underline-offset-2 hover:underline focus-ring"
        >
          {expanded ? labels.toolApprovalShowLess : labels.toolApprovalShowMore}
        </button>
      )}
    </span>
  )
}

export function ArgsList({ args, sensitive, className }: { args: Record<string, unknown>; sensitive?: readonly string[]; className?: string }) {
  return (
    <dl data-slot="chat-tool-approval-args" className={cn('own:grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-baseline own:gap-x-4 own:gap-y-2 own:text-ui-sm', className)}>
      {Object.entries(args).map(([key, value]) => (
        <div key={key} className="own:contents">
          <dt className="max-w-40 break-words own:font-mono own:text-fg-muted">{key}</dt>
          <dd className="min-w-0 text-fg">
            <ArgValue name={key} value={value} masked={isSensitive(key, sensitive)} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Parses edited text back to the type the argument had. Returns the value, or a message. */
function parse(text: string, original: unknown, labels: ReturnType<typeof useLabelSet>): { value: unknown } | { error: string } {
  const trimmed = text.trim()
  if (typeof original === 'number') {
    const n = Number(trimmed)
    return trimmed === '' || Number.isNaN(n) ? { error: labels.toolApprovalNotNumber } : { value: n }
  }
  if (typeof original === 'boolean') return trimmed === 'true' || trimmed === 'false' ? { value: trimmed === 'true' } : { error: labels.toolApprovalNotBoolean }
  if (typeof original === 'string') return original !== '' && trimmed === '' ? { error: labels.toolApprovalRequired } : { value: text }
  try {
    return { value: JSON.parse(trimmed) }
  } catch {
    return { error: labels.toolApprovalNotJson }
  }
}
const useLabelSet = () => useComponentLabels(chatToolApprovalLabels)

export function ArgsForm({
  args,
  sensitive,
  validate,
  onSave,
  onCancel,
}: {
  args: Record<string, unknown>
  sensitive?: readonly string[]
  /** Checks a parsed value; return a message to refuse it. */
  validate?: (key: string, value: unknown, args: Record<string, unknown>) => string | undefined
  onSave: (args: Record<string, unknown>) => void
  onCancel: () => void
}) {
  const labels = useLabelSet()
  const editable = Object.keys(args).filter((key) => !isSensitive(key, sensitive))
  const [draft, setDraft] = useState(() => Object.fromEntries(editable.map((key) => [key, asText(args[key])])))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const form = useRef<HTMLFormElement>(null)

  // Editing starts in the first field you can change.
  useEffect(() => {
    form.current?.querySelector<HTMLElement>('[data-yj-arg]:not([readonly])')?.focus()
  }, [])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = { ...args }
    const found: Record<string, string> = {}
    for (const key of editable) {
      const result = parse(draft[key] ?? '', args[key], labels)
      const message = 'error' in result ? result.error : validate?.(key, result.value, args)
      if (message) found[key] = message
      else if ('value' in result) next[key] = result.value
    }
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      event.currentTarget.querySelector<HTMLElement>(`[data-yj-arg="${CSS.escape(first)}"]`)?.focus()
      return
    }
    onSave(next)
  }

  return (
    <form
      ref={form}
      data-slot="chat-tool-approval-form"
      noValidate
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onCancel()
        }
      }}
      className="own:flex flex-col own:gap-3"
    >
      {Object.entries(args).map(([key, value]) => {
        const locked = !editable.includes(key)
        const multiline = typeof value === 'object' && value !== null
        const Control = multiline || isLong(asText(value)) ? Textarea : Input
        return (
          <Field key={key} invalid={Boolean(errors[key])} disabled={locked}>
            <FieldLabel className="own:font-mono">{key}</FieldLabel>
            <Control
              data-yj-arg={key}
              value={locked ? '••••••••' : (draft[key] ?? '')}
              readOnly={locked}
              onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
              className={cn(multiline && 'own:font-mono')}
            />
            {errors[key] && <FieldError>{errors[key]}</FieldError>}
          </Field>
        )
      })}
      <div className="own:flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button type="submit" size="sm">
          {labels.save}
        </Button>
      </div>
    </form>
  )
}
