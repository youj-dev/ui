'use client'

import { useId, useRef, useState, useSyncExternalStore, type ClipboardEvent, type DragEvent, type HTMLAttributes, type KeyboardEvent } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { PaperclipIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '../../components/ui/input-group'
import { Kbd } from '../../components/ui/kbd'
import { useLiveRegion } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { Chips } from './attachments/chips'
import {
  DEFAULT_COPY,
  DEMO_ATTACHMENTS,
  DEMO_TEXT,
  demo,
  formatBytes,
  stamp,
  type AttachmentComposerCopy,
  type AttachmentComposerFile,
  type AttachmentComposerMessage,
  type AttachmentComposerUploadContext,
} from './attachments/data'
import { Preview } from './attachments/preview'
import { useAttachments } from './attachments/use-attachments'

/* A reply box that takes files while you write. Attach with the paperclip,
 * paste a screenshot (named by the moment, not "image.png"), or drop files
 * on it; each one uploads at once and shows a ring as it goes, and a failed
 * one says why and retries on a press. Pictures show themselves; other
 * files their glyph, name and size. Arrange them by dragging (a caret shows
 * where one lands, and it glides into place) or with Alt or Option and the
 * arrows; Delete removes one and focus moves on. A press opens one large.
 * The rules (type, size, count) say why a file wasn't attached, under the
 * field. Send (⌘↵ or Ctrl+↵) waits for uploads still running, saying how
 * many it's waiting for, then sends the text and the files in their order;
 * a failure stops it with focus on the file. Reduced motion: chips appear,
 * leave and move in place. */

interface AttachmentComposerProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onPaste' | 'defaultValue'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2`, and no page around it. Default true; `false` draws its own page (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (672px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<AttachmentComposerCopy>
  /** Writes sizes in this locale (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The message (controlled): pair it with `onValueChange`. */
  value?: string
  /** The message it starts with, when the block owns it. Default: a demo reply. */
  defaultValue?: string
  onValueChange?: (text: string) => void
  /** Files already attached (`status: 'done'`). Default: the demo's three. */
  defaultAttachments?: AttachmentComposerFile[]
  /** Every change to the attachments: added, uploading, uploaded, failed, moved, removed. */
  onAttachmentsChange?: (files: AttachmentComposerFile[]) => void
  /** The files it takes, as an input's `accept`. Default images, video, PDF and common documents. */
  accept?: string
  /** How many files a message holds. Default 10. */
  maxFiles?: number
  /** The largest file, in bytes. Default 25 MB. */
  maxSize?: number
  /** Uploads one file as it's attached: report progress, resolve with what you'll want back (a URL, a key). Default: a simulated upload. */
  onUpload?: (file: File, context: AttachmentComposerUploadContext) => Promise<unknown> | unknown
  /** Sends the message with its files, once they've all uploaded. Awaited; it clears on success. Default: a demo wait. */
  onSend?: (message: AttachmentComposerMessage) => Promise<unknown> | unknown
  disabled?: boolean
}

const MB = 1024 * 1024
const subscribeNothing = () => () => {}
const isApple = () => /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files')

function AttachmentComposer({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  value,
  defaultValue = DEMO_TEXT,
  onValueChange,
  defaultAttachments = DEMO_ATTACHMENTS,
  onAttachmentsChange,
  accept = 'image/*,video/*,application/pdf,.zip,.txt,.csv,.docx,.xlsx,.pptx',
  maxFiles = 10,
  maxSize = 25 * MB,
  onUpload,
  onSend,
  disabled = false,
  className,
  ...rest
}: AttachmentComposerProps) {
  const copy: AttachmentComposerCopy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const notesId = useId()
  const itemsId = useId()
  const itemId = (id: string) => `${itemsId}-${id}`
  const Title = embedded ? 'h2' : 'h1'
  const apple = useSyncExternalStore(subscribeNothing, isApple, () => true)
  const { politeRef, assertiveRef, announce } = useLiveRegion()
  const [text, setInner] = useControllableState(value, defaultValue)
  const setText = (next: string) => {
    setInner(next)
    onValueChange?.(next)
  }
  const att = useAttachments({ initial: defaultAttachments, accept, maxFiles, maxSize, onUpload, onAttachmentsChange, copy, announce })
  const field = useRef<HTMLTextAreaElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const sendButton = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLElement>(null)
  const [over, setOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [blocked, setBlocked] = useState<string | null>(null)
  const uploading = att.files.filter((f) => f.status === 'uploading').length
  const total = att.files.reduce((sum, f) => sum + f.size, 0)
  const empty = !text.trim() && att.files.length === 0
  const note = blocked ?? (att.refused.length > 0 ? att.refused.join(' ') : null)

  const paste = (event: ClipboardEvent) => {
    const files = Array.from(event.clipboardData?.files ?? [])
    if (files.length === 0) return
    event.preventDefault()
    const now = new Date()
    att.add(
      files.map((f) =>
        f.name && !/^image\.\w+$/i.test(f.name)
          ? f
          : new File([f], `${copy.pastedName(stamp(now))}.${f.type.split('/')[1] ?? 'png'}`, { type: f.type }),
      ),
    )
  }
  const drop = {
    onDragEnter: (event: DragEvent) => carriesFiles(event) && !disabled && setOver(true),
    onDragOver: (event: DragEvent) => {
      if (!carriesFiles(event) || disabled) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (event: DragEvent) => !event.currentTarget.contains(event.relatedTarget as Node) && setOver(false),
    onDrop: (event: DragEvent) => {
      setOver(false)
      if (disabled || !event.dataTransfer?.files.length) return
      event.preventDefault()
      att.add(Array.from(event.dataTransfer.files))
    },
  }

  /** Sends once every upload is in; a failed one stops it, with focus on the file. */
  const send = async () => {
    setBlocked(null)
    if (att.files.some((f) => f.status === 'uploading')) setWaiting(true)
    try {
      await att.settled()
    } catch (failed) {
      setWaiting(false)
      const ids = failed as string[]
      const message = copy.blocked(ids.length)
      setBlocked(message)
      document.getElementById(itemId(ids[0]!))?.querySelector('button')?.focus()
      throw new Error(message)
    }
    setWaiting(false)
    await (onSend ? onSend({ text: text.trim(), attachments: att.current() }) : demo('AttachmentComposer: onSend', 700))
    setText('')
    att.clear()
    announce(copy.sentMessage)
    field.current?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey) || event.nativeEvent.isComposing) return
    event.preventDefault()
    sendButton.current?.click()
  }

  const modifier = apple ? '⌘' : 'Ctrl+'
  const panel = (
    <article
      ref={root}
      aria-labelledby={titleId}
      {...(embedded ? rest : null)}
      className={cn(
        'w-full rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface text-fg',
        embedded ? 'shadow-sm' : 'shadow-lg',
        !fill && 'max-w-2xl',
        embedded && className,
      )}
    >
      <header className="flex flex-col gap-1 px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-4">
        <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
          {copy.title}
        </Title>
        <p className="text-ui text-fg-muted">{copy.description}</p>
      </header>
      <div className="flex flex-col gap-2 px-(--ui--panel-x) pb-(--ui--panel-y)">
        <InputGroup
          {...drop}
          data-state={over ? 'over' : 'idle'}
          className="relative transition-[border-color,box-shadow] yj-duration-fast ease-standard data-[state=over]:border-accent data-[state=over]:shadow-[0_0_0_3px_var(--color-accent-subtle)]"
        >
          <InputGroupTextarea
            ref={field}
            value={text}
            disabled={disabled}
            aria-label={copy.message}
            aria-describedby={notesId}
            placeholder={copy.placeholder}
            rows={3}
            onChange={(event) => setText(event.currentTarget.value)}
            onPaste={paste}
            onKeyDown={onKeyDown}
            // A fixed height that scrolls: writing more never grows the card.
            className="h-24 field-sizing-fixed"
          />
          {/* One row of attachments that scrolls sideways, there whether or not there are any: attaching never grows the card. */}
          <div className="h-17 w-full px-2.5">
            {att.files.length > 0 ? (
              <Chips
                files={att.files}
                copy={copy}
                modifier={apple ? 'Option' : 'Alt'}
                idOf={itemId}
                onOpen={setPreview}
                onRetry={att.retry}
                onRemove={att.remove}
                onMove={att.move}
                onEmpty={() => field.current?.focus()}
              />
            ) : (
              <p className="mt-2 flex h-14 items-center justify-center rounded-lg border border-dashed border-line text-ui-sm text-fg-subtle">
                {copy.noFiles}
              </p>
            )}
          </div>
          <InputGroupAddon align="block-end" className="gap-2 border-t border-line">
            <Button variant="ghost" size="icon-sm" aria-label={copy.attach} disabled={disabled} onClick={() => input.current?.click()}>
              <PaperclipIcon />
            </Button>
            {/* Why a file wasn't attached, or why Send stopped, takes the count's place: the card keeps its height. */}
            <span
              id={notesId}
              title={note ?? undefined}
              className={cn('min-w-0 truncate text-ui-xs tabular-nums', note ? 'text-danger-text' : 'text-fg-subtle')}
            >
              {note ?? copy.count(att.files.length, maxFiles, formatBytes(total, copy.locale))}
            </span>
            <span className="ms-auto flex items-center gap-2">
              <Kbd aria-hidden className="max-sm:hidden">
                {copy.shortcut(modifier)}
              </Kbd>
              <AsyncButton
                ref={sendButton}
                size="sm"
                aria-keyshortcuts={apple ? 'Meta+Enter' : 'Control+Enter'}
                disabled={disabled || empty}
                onAction={send}
                pendingLabel={waiting && uploading ? copy.waiting(uploading) : copy.sending}
                successLabel={copy.sent}
                errorLabel={copy.sendFailed}
              >
                {copy.send}
              </AsyncButton>
            </span>
          </InputGroupAddon>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 grid place-items-center rounded-[inherit] bg-[color-mix(in_oklab,var(--color-surface)_84%,transparent)] opacity-0 transition-opacity yj-duration-fast ease-standard in-data-[state=over]:opacity-100"
          >
            <span className="flex items-center gap-2 rounded-full border border-line bg-overlay px-4 py-2 text-ui font-medium text-fg shadow-md">
              <PaperclipIcon size={15} className="text-accent-text" />
              {copy.dropHere}
            </span>
          </span>
        </InputGroup>
        <input
          ref={input}
          type="file"
          multiple
          accept={accept}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            att.add(Array.from(event.currentTarget.files ?? []))
            event.currentTarget.value = ''
          }}
        />
      </div>
      <Preview file={att.files.find((f) => f.id === preview) ?? null} copy={copy} onClose={() => setPreview(null)} />
      <div ref={politeRef} role="status" className="sr-only" />
      <div ref={assertiveRef} role="alert" className="sr-only" />
    </article>
  )

  const shell = embedded ? (
    panel
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {panel}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{shell}</ThemeScope> : shell
}

export { AttachmentComposer, DEFAULT_COPY as ATTACHMENT_COMPOSER_COPY }
export type { AttachmentComposerCopy, AttachmentComposerFile, AttachmentComposerMessage, AttachmentComposerProps, AttachmentComposerUploadContext }
