'use client'

import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react'
import { Collapse, MorphLabel, Reveal } from '@youj/motion'
import { BotIcon, CheckCircleIcon, FileTextIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Rating } from '../../../components/ui/rating'
import { Textarea } from '../../../components/ui/textarea'
import { cn } from '../../../lib/utils'
import { useSupportChat } from './context'
import { fileSize, type SupportAgent, type SupportAttachment } from './data'

/* The pieces a support conversation adds to the chat kit: who's talking
 * (the assistant's mark, a person's initials), files in a message, the
 * email form for when the team is away, and the rating that closes it. */

const TINT: Record<string, string> = {
  mira: 'bg-accent-subtle text-accent-text',
  jonas: 'bg-success-subtle text-success-text',
  aiko: 'bg-warning-subtle text-warning-text',
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

export function PersonAvatar({ agent, className }: { agent: SupportAgent; className?: string }) {
  return (
    <Avatar className={cn('size-7', className)}>
      <AvatarFallback className={cn('font-semibold', TINT[agent.id])}>{initials(agent.name)}</AvatarFallback>
    </Avatar>
  )
}

export function UserAvatar() {
  return (
    <Avatar className="size-7">
      <AvatarFallback>{initials(useSupportChat().user.name)}</AvatarFallback>
    </Avatar>
  )
}

export function BotAvatar({ className }: { className?: string }) {
  return (
    <Avatar className={cn('size-7', className)}>
      <AvatarFallback className="bg-accent-subtle text-accent-text">
        <BotIcon size={15} strokeWidth={1.75} />
      </AvatarFallback>
    </Avatar>
  )
}

export function MessageAttachments({ attachments, mine = false }: { attachments: SupportAttachment[]; mine?: boolean }) {
  const { copy } = useSupportChat()
  return (
    <ul aria-label={copy.attachments} className={cn('flex max-w-full flex-wrap gap-2', mine && 'justify-end')}>
      {attachments.map((file) => (
        <li key={file.id} className="max-w-full min-w-0">
          {file.url && file.type?.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too
            <img src={file.url} alt={file.name} className="h-28 max-w-52 rounded-lg border border-line object-cover" />
          ) : (
            <span className="flex max-w-64 items-center gap-2.5 rounded-lg border border-line bg-canvas py-1.5 ps-1.5 pe-3">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-band text-fg-muted">
                <FileTextIcon size={16} strokeWidth={1.75} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-ui font-medium text-fg">{file.name}</span>
                <span className="text-ui-sm text-fg-muted tabular-nums">{fileSize(file.size, copy.locale)}</span>
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Takes focus when it replaces the composer that had it, so focus never falls to the page. */
function useClaimFocus(root: RefObject<HTMLElement | null>, selector: string) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: claims focus once, as it arrives; a new selector must not steal it again
  useEffect(() => {
    const active = document.activeElement
    if (active && active !== document.body) return
    root.current?.querySelector<HTMLElement>(selector)?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- claims focus once, as it arrives; a new selector must not steal it again
  }, [])
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** While the team is away: leave an email and the conversation continues there. */
export function EmailCapture({ email, onSubmit }: { email: string | null; onSubmit: (email: string) => Promise<unknown> | unknown }) {
  const { copy } = useSupportChat()
  const [error, setError] = useState<string | undefined>()
  const titleId = useId()
  const form = useRef<HTMLFormElement>(null)
  useClaimFocus(form, 'input')
  // The form goes once it's sent: focus moves to what replaced it, which reads it out.
  const done = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (email) done.current?.focus()
  }, [email])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    if (!EMAIL.test(value)) return setError(value ? copy.emailInvalid : copy.emailMissing)
    setError(undefined)
    try {
      await onSubmit(value)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }
  if (email)
    return (
      <Reveal ref={done} tabIndex={-1} inView={false} variant="rise" className="flex items-start gap-3 rounded-xl border border-line bg-canvas p-4 outline-none">
        <CheckCircleIcon size={20} strokeWidth={1.75} trigger="mount" className="mt-0.5 shrink-0 text-success" />
        <p className="text-ui text-fg-muted">
          <span className="block font-medium text-fg">{copy.allSet}</span>
          {copy.willReply(email)}
        </p>
      </Reveal>
    )
  return (
    <form ref={form} noValidate onSubmit={submit} aria-labelledby={titleId} className="flex flex-col gap-3 rounded-xl border border-line bg-canvas p-4">
      <p id={titleId} className="text-ui font-medium text-fg">
        {copy.emailTitle}
      </p>
      <Field invalid={!!error}>
        <FieldLabel>{copy.email}</FieldLabel>
        <div className="flex gap-2">
          <Input name="email" type="email" autoComplete="email" placeholder={copy.emailPlaceholder} className="min-w-0 flex-1" />
          <Button type="submit">{copy.notifyMe}</Button>
        </div>
        {error ? <FieldError>{error}</FieldError> : <FieldDescription>{copy.emailHint}</FieldDescription>}
      </Field>
    </form>
  )
}

interface RatingCardProps {
  /** Whom it rates: a person, or the assistant when no one joined. */
  subject: string
  rated?: number
  onRate: (score: number, note: string) => void
  onNew: () => void
}

/** How did it go: stars, then an optional note, then thanks. */
export function RatingCard({ subject, rated, onRate, onNew }: RatingCardProps) {
  const { copy } = useSupportChat()
  const [score, setScore] = useState(0)
  const [sent, setSent] = useState(rated !== undefined)
  const titleId = useId()
  const noteId = useId()
  const done = sent && rated !== undefined
  const card = useRef<HTMLElement>(null)
  const again = useRef<HTMLButtonElement>(null)
  useClaimFocus(card, '[role=slider]')
  return (
    <section ref={card} aria-labelledby={titleId} className="flex flex-col items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-5 text-center">
      <h3 id={titleId} className="text-ui font-medium text-balance text-fg">
        {done ? copy.rated(subject) : copy.rateAsk(subject)}
      </h3>
      {done ? (
        <Rating readOnly value={rated} size="lg" />
      ) : (
        <>
          <Rating size="lg" value={score} onValueChange={setScore} aria-labelledby={titleId} />
          <MorphLabel value={score} className="h-5 text-ui-sm text-fg-muted">
            {score ? copy.verdicts[score] : copy.tapStar}
          </MorphLabel>
        </>
      )}
      <Collapse open={score > 0 && !sent} className="w-full">
        <form
          className="flex flex-col gap-2 pt-1 text-start"
          onSubmit={(event) => {
            event.preventDefault()
            setSent(true)
            onRate(score, String(new FormData(event.currentTarget).get('note') ?? '').trim())
            // The note folds away with the button that had focus.
            again.current?.focus()
          }}
        >
          <label htmlFor={noteId} className="text-ui-sm text-fg-muted">
            {copy.note}
          </label>
          <Textarea id={noteId} name="note" rows={2} />
          <Button type="submit" className="self-end">
            {copy.sendFeedback}
          </Button>
        </form>
      </Collapse>
      {/* Present from the start, so the thanks is announced when it arrives. */}
      <p role="status" className="text-ui-sm text-fg-muted empty:hidden">
        {done ? copy.thanks : ''}
      </p>
      <Button ref={again} variant="outline" size="sm" onClick={onNew} className="mt-1">
        {copy.newConversation}
      </Button>
    </section>
  )
}
