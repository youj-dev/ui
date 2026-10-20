'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentProps,
  type DragEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { IconSwap } from '@youj/icons/components/youj/icons/icon-swap'
import { ArrowUpIcon } from '@youj/icons/components/youj/icons/arrow-up'
import { FileTextIcon } from '@youj/icons/components/youj/icons/file-text'
import { PaperclipIcon } from '@youj/icons/components/youj/icons/paperclip'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { useComponentLabels } from '@youj/core/labels'
import { chatPromptInputLabels } from '@youj/core/labels'
import { cn, formatBytes } from '../../../lib/utils'
import { Button } from '../button'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '../input-group'
import { Kbd } from '../kbd'
import { Spinner } from '../spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip'
import { useEnterToSubmit } from './chat-keys'

/* The composer.
 * - A textarea that grows with the message (CSS field-sizing, with a
 *   measured fallback where it isn't supported) up to 40% of the viewport,
 *   then scrolls. Enter sends and Shift+Enter breaks the line, and neither
 *   ever cuts an IME composition short. On touch keyboards Enter is a line
 *   break and the button sends.
 * - Attachments: a paperclip opens the file picker, and pasting or dropping
 *   files attaches them. They sit above the text as chips (a thumbnail for
 *   images, name and size for files) that enter and leave through
 *   PresenceList, each with its own remove button; removing one moves focus
 *   to its neighbor, never to <body>.
 * - The bottom bar holds your toolbar (a model select, tool toggles) at the
 *   start, and a counter plus the send button at the end. While the
 *   assistant works, send morphs into stop (motion's IconSwap morph, a real
 *   path morph from the arrow to the square) and Escape stops too.
 * - Disabled grays the whole frame and blocks everything.
 * Reduced motion: the morph and the chips are instant. */

export type PromptStatus = 'idle' | 'submitted' | 'streaming'

export interface PromptAttachment {
  id: string
  name: string
  /** MIME type. image/* shows a thumbnail. */
  type?: string
  /** Bytes. */
  size?: number
  /** A preview (an object URL for a picked file). */
  url?: string
  /** Uploading attachments block sending; failed ones say so. Default 'ready'. */
  status?: 'uploading' | 'ready' | 'error'
}

export interface PromptSubmission {
  text: string
  attachments: PromptAttachment[]
}

export interface PromptInputProps extends Omit<ComponentProps<'form'>, 'onSubmit' | 'children'> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Called with the trimmed text and the attachments. Uncontrolled, the text then clears itself. */
  onSubmit: (message: PromptSubmission) => void
  /** 'submitted' and 'streaming' turn send into stop. Default 'idle'. */
  status?: PromptStatus
  onStop?: () => void
  /** Default "Ask anything…". */
  placeholder?: string
  /** The text field's name for assistive tech. Default "Message". */
  label?: string
  disabled?: boolean
  attachments?: PromptAttachment[]
  /** Enables attaching: the paperclip, paste and drop. Receives the files. */
  onAttach?: (files: File[]) => void
  onRemoveAttachment?: (id: string) => void
  /** Which files the picker offers and paste or drop accept, as in <input accept>. */
  accept?: string
  /** Controls at the start of the bottom bar: a model select, tool toggles. */
  toolbar?: ReactNode
  /** Replaces the built-in character counter, e.g. `<PromptInputCounter value={tokens} max={8000} unit="tokens" />`. */
  counter?: ReactNode
  /** A character limit: shows a counter near it and blocks sending past it. */
  maxLength?: number
  autoFocus?: boolean
  /** The textarea, e.g. to focus it after picking a suggestion. */
  textareaRef?: Ref<HTMLTextAreaElement>
}

/** Whether `file` matches an <input accept> list ("image/*,.pdf"). */
function accepts(file: File, accept?: string) {
  if (!accept) return true
  return accept.split(',').some((rule) => {
    const r = rule.trim().toLowerCase()
    if (r.startsWith('.')) return file.name.toLowerCase().endsWith(r)
    if (r.endsWith('/*')) return file.type.startsWith(r.slice(0, -1))
    return file.type === r
  })
}

const fieldSizing = typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content')

function PromptInput({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onSubmit,
  status = 'idle',
  onStop,
  placeholder,
  label,
  disabled = false,
  attachments = [],
  onAttach,
  onRemoveAttachment,
  accept,
  toolbar,
  counter,
  maxLength,
  autoFocus,
  textareaRef,
  className,
  ref,
  ...props
}: PromptInputProps) {
  const labels = useComponentLabels(chatPromptInputLabels)
  placeholder ??= labels.chatPromptPlaceholder
  label ??= labels.chatPromptLabel
  const [own, setOwn] = useState(defaultValue)
  const text = valueProp ?? own
  const setText = (next: string) => {
    if (valueProp === undefined) setOwn(next)
    onValueChange?.(next)
  }
  const field = useRef<HTMLTextAreaElement | null>(null)
  const picker = useRef<HTMLInputElement>(null)
  const form = useRef<HTMLFormElement | null>(null)
  const setForm = useCallback(
    (node: HTMLFormElement | null) => {
      form.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )
  const counterId = useId()
  const [dragging, setDragging] = useState(false)

  // A removed attachment hands focus to its neighbor's remove button, or,
  // once there's none, to the text field: never to <body>.
  const refocus = useRef<number | null>(null)
  useEffect(() => {
    if (refocus.current === null) return
    const buttons = [...(form.current?.querySelectorAll<HTMLButtonElement>('li:not([inert]) [data-slot=prompt-attachment-remove]') ?? [])]
    const next = buttons[Math.min(refocus.current, buttons.length - 1)]
    refocus.current = null
    ;(next ?? field.current)?.focus()
  })

  const busy = status !== 'idle'
  const over = maxLength !== undefined && text.length > maxLength
  const uploading = attachments.some((a) => a.status === 'uploading')
  const empty = text.trim() === '' && attachments.length === 0
  const canSend = !disabled && !busy && !empty && !over && !uploading

  const submit = () => {
    if (!canSend) return
    onSubmit({ text: text.trim(), attachments })
    if (valueProp === undefined) setOwn('')
    field.current?.focus()
  }
  const enter = useEnterToSubmit(submit)

  const setField = useCallback(
    (node: HTMLTextAreaElement | null) => {
      field.current = node
      if (typeof textareaRef === 'function') textareaRef(node)
      else if (textareaRef) textareaRef.current = node
    },
    [textareaRef],
  )

  // Where CSS can't size the field to its content, measure it.
  useLayoutEffect(() => {
    const el = field.current
    if (fieldSizing || !el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  const attach = (files: File[]) => {
    const taken = files.filter((file) => accepts(file, accept))
    if (taken.length && onAttach) onAttach(taken)
    return taken.length > 0
  }

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!onAttach || disabled) return
    const files = [...event.clipboardData.files]
    // A pasted screenshot has no text: attach it instead of pasting nothing.
    if (files.length && attach(files) && !event.clipboardData.getData('text/plain')) event.preventDefault()
  }

  const dragProps = onAttach && !disabled
    ? {
        onDragOver: (event: DragEvent) => {
          if (!event.dataTransfer.types.includes('Files')) return
          event.preventDefault()
          setDragging(true)
        },
        onDragLeave: (event: DragEvent) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        },
        onDrop: (event: DragEvent) => {
          if (!event.dataTransfer.files.length) return
          event.preventDefault()
          setDragging(false)
          attach([...event.dataTransfer.files])
        },
      }
    : {}

  return (
    <form
      ref={setForm}
      data-slot="prompt-input"
      data-status={status}
      className={cn('own:w-full', className)}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      {...props}
    >
      <InputGroup
        data-dragging={dragging || undefined}
        // shape: a file held over the composer lights it as the drop target
        className={cn(
          'h-auto flex-col shadow-sm',
          'own:data-dragging:border-focus own:data-dragging:bg-accent-subtle',
        )}
        {...dragProps}
      >
        {attachments.length > 0 && (
          <InputGroupAddon align="block-start" className="own:px-2.5 own:pt-2.5 own:pb-0">
            <AttachmentList
              attachments={attachments}
              disabled={disabled}
              onRemove={
                onRemoveAttachment &&
                ((id, index) => {
                  refocus.current = index
                  onRemoveAttachment(id)
                })
              }
            />
          </InputGroupAddon>
        )}
        <InputGroupTextarea
          ref={setField}
          aria-label={label}
          aria-describedby={maxLength !== undefined ? counterId : undefined}
          aria-invalid={over || undefined}
          placeholder={placeholder}
          value={text}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={1}
          onChange={(event) => setText(event.target.value)}
          onPaste={onPaste}
          onCompositionStart={enter.onCompositionStart}
          onCompositionEnd={enter.onCompositionEnd}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && busy && onStop) {
              event.preventDefault()
              onStop()
              return
            }
            if (event.key !== 'Enter' || event.shiftKey) return
            // Touch keyboards have no Shift+Enter: there, Enter is a line break and the button sends.
            if (window.matchMedia?.('(pointer: coarse)').matches && !event.metaKey && !event.ctrlKey) return
            if (busy) {
              event.preventDefault()
              return
            }
            enter.onKeyDown(event)
          }}
          className="min-h-12 max-h-[40vh] own:px-3.5 own:pt-3 own:pb-1 text-ui-lg leading-6"
        />
        <InputGroupAddon align="block-end" className="gap-1 own:px-2 own:pt-1 own:pb-2">
          <div className="own:flex min-w-0 flex-1 items-center gap-1">
            {onAttach && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={<Button variant="ghost" size="icon-sm" disabled={disabled} />}
                      aria-label={labels.chatAttachFiles}
                      onClick={() => picker.current?.click()}
                    >
                      <PaperclipIcon size={16} strokeWidth={1.75} />
                    </TooltipTrigger>
                    <TooltipContent>{labels.chatAttachFiles}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  ref={picker}
                  type="file"
                  multiple
                  accept={accept}
                  tabIndex={-1}
                  aria-hidden
                  className="sr-only"
                  onChange={(event) => {
                    attach([...(event.target.files ?? [])])
                    event.target.value = ''
                  }}
                />
              </>
            )}
            {toolbar}
          </div>
          <div className="own:flex shrink-0 items-center gap-2">
            {counter ?? (maxLength !== undefined && <PromptInputCounter id={counterId} value={text.length} max={maxLength} />)}
            <SendButton busy={busy} canSend={canSend} canStop={Boolean(onStop)} onStop={() => onStop?.()} />
          </div>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}

/* ── Send / stop ────────────────────────────────────────────────────────── */

/** The stop mark: a filled rounded square, for IconSwap's morph out of the arrow. */
function StopGlyph({ size = 24 }: { size?: number | string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none" aria-hidden focusable="false">
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
    </svg>
  )
}

function SendButton({ busy, canSend, canStop, onStop }: { busy: boolean; canSend: boolean; canStop: boolean; onStop: () => void }) {
  const labels = useComponentLabels(chatPromptInputLabels)
  const label = busy ? labels.chatStopGenerating : labels.chatSendMessage
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          // Stays focusable while it can't act, so keyboard focus is never dropped mid-reply.
          render={<Button size="icon-sm" type={busy ? 'button' : 'submit'} disabled={busy ? !canStop : !canSend} focusableWhenDisabled />}
          aria-label={label}
          onClick={(event) => {
            if (!busy) return
            event.preventDefault()
            onStop()
          }}
          data-slot="prompt-input-send"
        >
          <IconSwap from={ArrowUpIcon} to={StopGlyph} active={busy} transition="morph" size={16} strokeWidth={2} />
        </TooltipTrigger>
        <TooltipContent>
          {busy ? labels.chatStop : labels.send}
          <Kbd>{busy ? labels.escKey : '↵'}</Kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/* ── Counter ────────────────────────────────────────────────────────────── */

export interface PromptInputCounterProps {
  value: number
  max: number
  /** What's counted, for the announcement. Default "characters". */
  unit?: string
  /** Show from this share of `max`. Default 0.8. */
  from?: number
  id?: string
}

/**
 * A quiet count that appears near a limit: muted, then warning at 95%,
 * danger past it. It's announced only in the last stretch (under 10% left)
 * and when over, not on every keystroke.
 */
function PromptInputCounter({ value, max, unit, from = 0.8, id }: PromptInputCounterProps) {
  const locale = useLocale()
  const labels = useComponentLabels(chatPromptInputLabels)
  unit ??= labels.chatCharacters
  const left = max - value
  const shown = value >= max * from
  const message = left < 0 ? labels.chatOverLimit(-left, unit) : left <= max * 0.1 ? labels.chatLeft(left, unit) : ''
  return (
    <>
      <span
        aria-hidden
        data-slot="prompt-input-counter"
        className={cn(
          'own:font-mono own:text-ui-xs own:tabular-nums transition-opacity yj-duration-fast ease-standard',
          shown ? 'opacity-100' : 'opacity-0',
          left < 0 ? 'own:text-danger-text' : left <= max * 0.05 ? 'own:text-warning-text' : 'own:text-fg-muted',
        )}
      >
        {value.toLocaleString(locale)} / {max.toLocaleString(locale)}
      </span>
      <span id={id} className="sr-only" aria-live="polite">
        {message}
      </span>
    </>
  )
}

/* ── Attachments ────────────────────────────────────────────────────────── */

function AttachmentList({
  attachments,
  disabled,
  onRemove,
}: {
  attachments: PromptAttachment[]
  disabled: boolean
  onRemove?: (id: string, index: number) => void
}) {
  const labels = useComponentLabels(chatPromptInputLabels)
  return (
    <PresenceList as="ul" aria-label={labels.chatAttachments} className="own:flex own:w-full flex-wrap own:gap-2">
      {attachments.map((attachment, index) => (
        <PresenceItem key={attachment.id}>
          <AttachmentChip attachment={attachment} disabled={disabled} onRemove={onRemove && (() => onRemove(attachment.id, index))} />
        </PresenceItem>
      ))}
    </PresenceList>
  )
}

function AttachmentChip({ attachment, disabled, onRemove }: { attachment: PromptAttachment; disabled: boolean; onRemove?: () => void }) {
  const k = useYouj()
  const locale = useLocale()
  const labels = useComponentLabels(chatPromptInputLabels)
  const image = Boolean(attachment.url && attachment.type?.startsWith('image/'))
  const status = attachment.status ?? 'ready'
  const detail = status === 'uploading' ? labels.chatUploading : status === 'error' ? labels.chatUploadFailed : attachment.size !== undefined ? formatBytes(attachment.size, locale) : attachment.type
  return (
    <div
      data-slot="prompt-attachment"
      data-status={status}
      data-reduced-motion={k.reduced || undefined}
      className={cn(
        'group/attachment relative own:flex own:h-12 items-center own:rounded-lg border own:border-line own:bg-band',
        image ? 'own:w-12' : 'own:max-w-56 own:gap-2.5 own:ps-1.5 own:pe-3',
        'own:data-[status=error]:border-danger-line',
      )}
    >
      {image ? (
        <img src={attachment.url} alt={attachment.name} className="size-full rounded-[inherit] object-cover" />
      ) : (
        <>
          <span aria-hidden className="own:grid size-9 shrink-0 place-items-center rounded-md bg-canvas own:text-fg-muted">
            <FileTextIcon size={16} strokeWidth={1.75} />
          </span>
          <span className="own:flex min-w-0 flex-col own:leading-tight">
            <span className="truncate own:text-ui own:font-medium own:text-fg">{attachment.name}</span>
            <span className={cn('truncate own:text-ui-xs', status === 'error' ? 'own:text-danger-text' : 'own:text-fg-muted')}>{detail}</span>
          </span>
        </>
      )}
      {status === 'uploading' && (
        <span className={cn('absolute inset-0 own:grid place-items-center rounded-[inherit] bg-canvas', !image && 'own:hidden')}>
          <Spinner label={null} size={16} />
        </span>
      )}
      {image && <span className="sr-only">{detail}</span>}
      {onRemove && (
        <button
          type="button"
          data-slot="prompt-attachment-remove"
          aria-label={labels.remove(attachment.name)}
          disabled={disabled}
          onClick={onRemove}
          className={cn(
            'absolute -end-1.5 -top-1.5 own:grid own:size-5 place-items-center own:rounded-full border own:border-canvas own:bg-fg own:text-canvas own:shadow-xs',
            // Quiet until the chip is hovered or focused; always there on touch.
            'opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/attachment:opacity-100 focus-visible:opacity-100 touch:opacity-100',
            'focus-ring disabled:hidden',
            // A 24px target around the 20px dot.
            'after:absolute after:-inset-0.5',
          )}
        >
          <XIcon className="own:size-3" strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

/* ── Managing picked files ──────────────────────────────────────────────── */

export interface PickedAttachment extends PromptAttachment {
  file: File
}

/**
 * Files as attachments: `add` them from onAttach, `remove` by id, `clear`
 * after sending. Images get an object-URL preview. Removing one revokes its
 * preview at once; clearing keeps them alive (the message you just sent may
 * still show them) until the component unmounts, which revokes them all.
 */
export function usePromptAttachments() {
  const labels = useComponentLabels(chatPromptInputLabels)
  const [attachments, setAttachments] = useState<PickedAttachment[]>([])
  const count = useRef(0)
  const urls = useRef(new Map<string, string>())
  const revoke = (id: string) => {
    const url = urls.current.get(id)
    if (url) URL.revokeObjectURL(url)
    urls.current.delete(id)
  }
  useEffect(() => {
    const live = urls.current
    return () => {
      for (const url of live.values()) URL.revokeObjectURL(url)
      live.clear()
    }
  }, [])
  const add = useCallback((files: File[]) => {
    const next = files.map((file) => {
      const id = `attachment-${++count.current}`
      const url = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      if (url) urls.current.set(id, url)
      return { id, name: file.name || labels.chatPastedImage, type: file.type, size: file.size, url, file, status: 'ready' as const }
    })
    setAttachments((list) => [...list, ...next])
  }, [labels])
  const remove = useCallback((id: string) => {
    revoke(id)
    setAttachments((list) => list.filter((a) => a.id !== id))
  }, [])
  const clear = useCallback(() => setAttachments([]), [])
  return { attachments, add, remove, clear }
}

export { PromptInput, PromptInputCounter }
