'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Collapse } from '@youj/motion'
import { BugIcon, CheckIcon, HeartIcon, LightbulbIcon, MessageSparkleIcon, PaperclipIcon } from '@youj/icons'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Field, FieldError, FieldLabel } from '../../../components/ui/field'
import { FileUpload } from '../../../components/ui/file-upload'
import { Kbd, KbdGroup } from '../../../components/ui/kbd'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Textarea } from '../../../components/ui/textarea'
import { nextReference, type FeedbackEntry, type FeedbackCopy, type FeedbackKind, type FeedbackKindCopy } from './data'

/* Send feedback, for the widget's popover and the settings card alike. The
 * type (a segmented control whose raised key glides) re-words the message's
 * label and placeholder. A screenshot is one press away: the attach button
 * unfolds a FileUpload (Collapse). Sending holds the button pending with the
 * fields disabled; a failure raises an Alert and keeps the draft; success
 * folds the form into a drawn check with a reference, and focus follows. */

const ICONS: Record<string, FeedbackKindCopy['icon']> = { bug: BugIcon, idea: LightbulbIcon, praise: HeartIcon }

interface FeedbackFormProps {
  /** The title and description: PopoverTitle in the widget, a card header inline. */
  header: ReactNode
  /** Resolve with your own reference (a string) to show it; anything else shows a generated one. */
  onSend: (feedback: FeedbackEntry) => Promise<unknown>
  /** In the popover: a Close button once sent. */
  onClose?: () => void
  /** Starts on this type (a key of `copy.kinds`). Default: the first. */
  defaultKind?: FeedbackKind
  /** The sent heading's level, one below the header's title. Default 'h3'. */
  headingAs?: 'h3' | 'h4' | 'h5'
  copy: FeedbackCopy
  product: string
}

function FeedbackForm({ header, onSend, onClose, defaultKind, headingAs: Heading = 'h3', copy: text, product }: FeedbackFormProps) {
  const uploadId = useId()
  const kinds = text.kinds(product)
  const [kind, setKind] = useState<FeedbackKind>(defaultKind ?? Object.keys(kinds)[0]!)
  const [message, setMessage] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [attaching, setAttaching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A rejected send's own message, shown in the failure alert.
  const [failure, setFailure] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed' | 'sent'>('idle')
  const [reference, setReference] = useState('')
  const [round, setRound] = useState(0)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const sentHeading = useRef<HTMLHeadingElement>(null)
  const sending = status === 'sending'
  const copy = kinds[kind]!

  useEffect(() => {
    if (status === 'sent') sentHeading.current?.focus({ preventScroll: true })
  }, [status])

  const submit = async () => {
    if (sending) return
    if (message.trim().length < 3) {
      setError(text.tooShort)
      textarea.current?.focus()
      return
    }
    setStatus('sending')
    try {
      const sent = await onSend({ kind, message: message.trim(), screenshot })
      setReference(typeof sent === 'string' ? sent : nextReference())
      setStatus('sent')
    } catch (reason) {
      setFailure(reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : '')
      setStatus('failed')
    }
  }

  const again = () => {
    setMessage('')
    setScreenshot(null)
    setAttaching(false)
    setStatus('idle')
    setRound((n) => n + 1)
    requestAnimationFrame(() => textarea.current?.focus())
  }

  return (
    <div className="flex flex-col gap-4">
      {header}
      <Collapse open={status !== 'sent'}>
        <form
          noValidate
          aria-busy={sending || undefined}
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
          className="flex flex-col gap-4"
        >
          <fieldset disabled={sending} className="flex min-w-0 flex-col gap-4">
            <SegmentedControl aria-label={text.kindLabel} value={kind} onValueChange={(next) => setKind(next as FeedbackKind)} className="w-full">
              {Object.keys(kinds).map((key) => {
                const Icon = kinds[key]!.icon ?? ICONS[key] ?? MessageSparkleIcon
                return (
                  <SegmentedControlItem key={key} value={key}>
                    <Icon size={14} strokeWidth={2} /> {kinds[key]!.label}
                  </SegmentedControlItem>
                )
              })}
            </SegmentedControl>
            <Field invalid={!!error}>
              <FieldLabel>{copy.prompt}</FieldLabel>
              <Textarea
                ref={textarea}
                rows={4}
                maxLength={2000}
                placeholder={copy.placeholder}
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
              />
              <FieldError>{error}</FieldError>
            </Field>
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ms-2 self-start"
                aria-expanded={attaching}
                aria-controls={uploadId}
                onClick={() => setAttaching((open) => !open)}
              >
                <PaperclipIcon size={16} />
                {screenshot ? text.attached : text.attach}
              </Button>
              <Collapse open={attaching} id={uploadId} keepMounted>
                <FileUpload
                  key={round}
                  className="pt-2"
                  variant="gallery"
                  multiple={false}
                  maxFiles={1}
                  accept="image/png,image/jpeg,image/webp"
                  maxSize={5 * 1024 * 1024}
                  title={
                    <>
                      {text.dropScreenshot} <span className="underline decoration-accent decoration-2 underline-offset-3">{text.browse}</span>
                    </>
                  }
                  onFilesChange={(files) => setScreenshot(files[0]?.file ?? null)}
                />
              </Collapse>
            </div>
          </fieldset>
          <Alert variant="danger" open={status === 'failed'}>
            <AlertTitle>{text.failedTitle}</AlertTitle>
            <AlertDescription>{failure || text.failedBody}</AlertDescription>
          </Alert>
          <div className="flex items-center gap-3 border-t border-line pt-3">
            <p className="me-auto min-w-0 truncate text-ui-sm text-fg-muted" title={text.context}>
              <span className="sr-only">{text.sentWith}</span>
              {text.context}
            </p>
            <KbdGroup aria-hidden className="max-sm:hidden">
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd>
            </KbdGroup>
            <Button type="submit" size="sm" loading={sending} loadingLabel={text.sendingFeedback}>
              {status === 'failed' ? text.tryAgain : text.send}
            </Button>
          </div>
        </form>
      </Collapse>

      <Collapse open={status === 'sent'}>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span aria-hidden className="mb-1 grid size-12 place-items-center rounded-full bg-success-subtle text-success-text">
            {status === 'sent' && <CheckIcon trigger="mount" size={24} strokeWidth={2.5} />}
          </span>
          <Heading ref={sentHeading} tabIndex={-1} className="text-ui-lg font-semibold tracking-tight text-fg outline-none">
            {text.sentTitle}
          </Heading>
          <p className="max-w-72 text-ui text-balance text-fg-muted">{copy.sent}</p>
          <p className="font-mono text-ui-sm text-fg-muted">{text.reference(reference)}</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={again}>
              {text.sendAnother}
            </Button>
            {onClose && (
              <Button size="sm" onClick={onClose}>
                {text.close}
              </Button>
            )}
          </div>
        </div>
      </Collapse>
    </div>
  )
}

export { FeedbackForm }
