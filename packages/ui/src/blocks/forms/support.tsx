'use client'

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ElementType, type HTMLAttributes } from 'react'
import { useForm, useWatch, type FieldErrors, type Resolver } from 'react-hook-form'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Collapse } from '@youj/motion'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Checkbox } from '../../components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '../../components/ui/field'
import { FileUpload, type UploadContext, type UploadFile } from '../../components/ui/file-upload'
import { Form, FormField, FormInvalidError, FormItem, FormLabel, FormMessage, FormSubmit } from '../../components/ui/form'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { cn } from '../../lib/utils'
import { Articles } from './support/articles'
import {
  backAt,
  DEFAULT_COPY,
  demo,
  demoArticles,
  environment,
  isOpen,
  replyBy,
  SUPPORT_HOURS,
  SUPPORT_TOPICS,
  type SupportArticle,
  type SupportField,
  type SupportHours,
  type SupportOption,
  type SupportTicket,
  type SupportRequestCopy,
  type SupportTopic,
} from './support/data'
import { Done, ReplyLine, spoken } from './support/done'
import { TopicFields, TopicPicker } from './support/topic'

/* A request to support that starts helping before it's sent. The topic
 * decides what's asked: a bug asks where it happened and how bad it is (and
 * offers to include the browser and system, showing exactly what), billing
 * asks for the invoice, access asks what's wrong, and only those fields
 * grow in. While the subject is typed, the help center's closest articles
 * appear under it, opening in a new tab so nothing is lost. Screenshots
 * upload with progress as they're dropped. The foot says when to expect a
 * reply on the team's real hours, in the requester's own clock, and moves
 * it up when a bug is blocking work. Sent, the card turns into the
 * confirmation with the request's number. Every field checks itself when
 * left; Send checks them all and focuses the first problem; a failed send
 * keeps everything. Reduced motion: fields appear and go in place.
 *
 * Pass your `topics` (and their fields), your team's `hours`, the signed-in
 * `user`, search your help center with `onSearchArticles`, upload with
 * `onUpload`, and send through `onSubmit`; every string is in `copy`. */

interface SupportUser {
  name?: string
  /** Where the reply goes. */
  email: string
}

interface SupportValues {
  topic: string
  email: string
  subject: string
  message: string
  fields: Record<string, string>
  diagnostics: boolean
}

interface SupportRequestProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onSubmit'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2` instead of the page's `h1`, and no page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (672px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SupportRequestCopy>
  /** Writes times in this locale (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What a request can be about, each with the fields it asks for. Default: a bug, billing, access, an idea, something else. */
  topics?: SupportTopic[]
  /** The chosen topic's id, controlled: pair it with `onTopicChange`. */
  topic?: string
  /** The topic chosen at first, when the block owns it. Default: none. */
  defaultTopic?: string
  onTopicChange?: (topic: string) => void
  /** The signed-in person the reply goes to. `null` asks for an email instead. Default: a demo user. */
  user?: SupportUser | null
  /** When the team works, on its own clock. Default: weekdays 9:00 to 18:00 in Berlin. */
  hours?: SupportHours
  /** How soon a reply comes, in working hours, unless the topic or a chosen option says otherwise. Default 4. */
  replyHours?: number
  /** Now, for the reply time. Default: the moment the block mounts. */
  now?: Date
  /** Details about your app to include with a bug, beside the browser and system: `{ app: 'Tern 3.2.1' }`. */
  diagnostics?: Record<string, string>
  /** Searches your help center for what's typed in the subject. Default: a few demo articles. */
  onSearchArticles?: (query: string, topic: string) => Promise<SupportArticle[]> | SupportArticle[]
  /** Uploads one attachment, reporting progress; resolve when it's stored. Default: a demo upload. */
  onUpload?: (file: File, context: UploadContext) => Promise<unknown>
  /** Sends the request; resolve with its number to show it. Reject to keep everything and say why. Default: a short demo wait. */
  onSubmit?: (ticket: SupportTicket) => Promise<string | void> | string | void
  /** Where "See your requests" goes once sent. Without it there's no such link. */
  requestsHref?: string
  /** Renders links (the articles, your requests), e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
}

const DEMO_USER: SupportUser = { name: 'Ada Lovelace', email: 'ada@northwind.com' }
const subscribeNothing = () => () => {}
const agent = () => navigator.userAgent
const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const nothing = () => ''

async function demoUpload(_file: File, { signal, onProgress }: UploadContext) {
  for (let percent = 0; percent <= 100; percent += 25) {
    if (signal.aborted) throw new Error('Canceled')
    onProgress(percent)
    await demo('SupportRequest: onUpload', 180)
  }
}

function SupportRequest({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  topics = SUPPORT_TOPICS,
  topic: topicProp,
  defaultTopic,
  onTopicChange,
  user = DEMO_USER,
  hours = SUPPORT_HOURS,
  replyHours = 4,
  now,
  diagnostics: extra,
  onSearchArticles,
  onUpload,
  onSubmit,
  requestsHref,
  linkComponent = 'a',
  className,
  ...rest
}: SupportRequestProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const articlesId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [mountedAt] = useState(() => new Date())
  const today = now ?? mountedAt
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploadsKey, setUploadsKey] = useState(0)
  const [waiting, setWaiting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [done, setDone] = useState<{ id?: string; email: string; by: string } | null>(null)
  const card = useRef<HTMLElement>(null)

  const blank = (): SupportValues => ({
    topic: topicProp ?? defaultTopic ?? '',
    email: '',
    subject: '',
    message: '',
    fields: Object.fromEntries(topics.flatMap((t) => t.fields ?? []).map((f) => [f.id, f.defaultValue ?? ''])),
    diagnostics: true,
  })
  const resolver: Resolver<SupportValues> = (values) => {
    const errors: Record<string, unknown> = {}
    const fields: Record<string, unknown> = {}
    const say = (message: string) => ({ type: 'validate', message })
    if (!values.topic) errors.topic = say(copy.topicMissing)
    if (!user) {
      if (!values.email.trim()) errors.email = say(copy.emailMissing)
      else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = say(copy.emailInvalid)
    }
    if (values.subject.trim().length < 3) errors.subject = say(copy.subjectMissing)
    if (values.message.trim().length < 15) errors.message = say(copy.messageMissing)
    for (const field of topics.find((t) => t.id === values.topic)?.fields ?? []) if (field.required && !values.fields[field.id]?.trim()) fields[field.id] = say(copy.required(field.label))
    if (Object.keys(fields).length) errors.fields = fields
    return Object.keys(errors).length ? { values: {}, errors: errors as FieldErrors<SupportValues> } : { values, errors: {} }
  }
  const form = useForm<SupportValues>({ defaultValues: blank(), values: topicProp === undefined ? undefined : { ...blank(), topic: topicProp }, resetOptions: { keepDirtyValues: true }, resolver, mode: 'onTouched' })
  const [topicId, subject, chosen] = useWatch({ control: form.control, name: ['topic', 'subject', 'fields'] })
  const topic = topics.find((t) => t.id === topicId)

  // The soonest reply a chosen option asks for, else the topic's, else the block's.
  const hoursToReply = useMemo(() => {
    const picked = (topic?.fields ?? []).flatMap((f: SupportField) => f.options?.filter((o: SupportOption) => o.value === chosen?.[f.id] && o.replyHours !== undefined) ?? [])
    return picked.length ? Math.min(...picked.map((o) => o.replyHours!)) : (topic?.replyHours ?? replyHours)
  }, [topic, chosen, replyHours])
  const reply = useMemo(() => ({ open: isOpen(today, hours), back: backAt(today, hours), by: replyBy(today, hours, hoursToReply) }), [today, hours, hoursToReply])
  const by = spoken(reply.by, today, copy.locale, copy)

  const ua = useSyncExternalStore(subscribeNothing, agent, nothing)
  const tz = useSyncExternalStore(subscribeNothing, zone, nothing)
  const details = useMemo(() => ({ ...environment(ua), ...(tz && { timeZone: tz }), ...extra }), [ua, tz, extra])

  // Sent: the confirmation's heading takes focus, so it's heard.
  useEffect(() => {
    if (done) card.current?.querySelector<HTMLElement>('[data-yj-done-heading]')?.focus({ preventScroll: true })
  }, [done])

  const submit = async (values: SupportValues) => {
    setFailure(null)
    if (files.some((f) => f.status === 'uploading')) {
      setWaiting(true)
      throw new FormInvalidError()
    }
    const email = user?.email ?? values.email.trim()
    const request: SupportTicket = {
      topic: values.topic,
      email,
      subject: values.subject.trim(),
      message: values.message.trim(),
      fields: Object.fromEntries((topic?.fields ?? []).map((f) => [f.id, values.fields[f.id] ?? ''])),
      attachments: files.filter((f) => f.status === 'done').map((f) => f.file),
      diagnostics: topic?.diagnostics && values.diagnostics ? details : null,
      replyBy: reply.by,
    }
    let id: string | void
    try {
      id = await (onSubmit ? onSubmit(request) : demo('SupportRequest: onSubmit', 1100).then(() => 'S-48213'))
    } catch (cause) {
      setFailure(cause instanceof Error && cause.message ? cause.message : copy.failedDescription)
      throw cause
    }
    setDone({ id: id || undefined, email, by })
  }

  const again = () => {
    // useForm's resetOptions keep dirty values for a new `topic`; starting over drops them.
    form.reset(blank(), { keepDirtyValues: false })
    setFiles([])
    setUploadsKey((k) => k + 1)
    setWaiting(false)
    setDone(null)
  }

  const panel = (
    <article
      ref={card}
      aria-labelledby={titleId}
      {...(embedded ? rest : null)}
      className={cn(
        '@container/support w-full rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface text-fg',
        embedded ? 'shadow-sm' : 'shadow-lg',
        !fill && 'max-w-2xl',
        embedded && className,
      )}
    >
      <header className="flex flex-col gap-1 px-(--ui--panel-x) py-(--ui--panel-head-y)">
        <Title id={titleId} className="text-xl leading-tight font-semibold tracking-tight">
          {copy.title}
        </Title>
        <p className="text-ui text-fg-muted">{copy.description}</p>
      </header>
      <Collapse open={!done} className="border-t border-line">
        <Form form={form} onSubmit={submit}>
          <div className="flex flex-col gap-5 px-(--ui--panel-x) py-(--ui--panel-y)">
            {!user && (
              <FormField<SupportValues, 'email'>
                name="email"
                label={copy.email}
                className="max-w-sm"
              >
                {(field) => <Input {...field} type="email" autoComplete="email" inputMode="email" placeholder={copy.emailPlaceholder} />}
              </FormField>
            )}
            <FormField<SupportValues, 'topic'>
              name="topic"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-2">
                  <TopicPicker
                    topics={topics}
                    value={field.value}
                    invalid={fieldState.invalid}
                    onBlur={field.onBlur}
                    copy={copy}
                    onValueChange={(id) => {
                      if (topicProp === undefined) field.onChange(id)
                      onTopicChange?.(id)
                    }}
                  />
                  <FormMessage />
                </div>
              )}
            />
            <TopicFields topics={topics} topic={topicId} copy={copy} />
            <FormField<SupportValues, 'subject'>
              name="subject"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{copy.subject}</FormLabel>
                  <Input {...field} placeholder={topic?.subjectPlaceholder} aria-invalid={fieldState.invalid || undefined} aria-controls={articlesId} />
                  <FormMessage />
                  <Articles id={articlesId} query={subject} topic={topicId} copy={copy} search={onSearchArticles ?? demoArticles} linkComponent={linkComponent} />
                </FormItem>
              )}
            />
            <FormField<SupportValues, 'message'> name="message" label={copy.message}>
              {(field) => <Textarea {...field} rows={5} className="min-h-32" placeholder={copy.messagePlaceholder} />}
            </FormField>
            <FieldSet className="gap-2">
              <FieldLegend variant="label">
                {copy.attachments} <span className="font-normal text-fg-subtle">({copy.optional})</span>
              </FieldLegend>
              <FileUpload
                key={uploadsKey}
                title={copy.attachmentsTitle}
                maxFiles={5}
                maxSize={10 * 1024 * 1024}
                onUpload={onUpload ?? demoUpload}
                onFilesChange={(next) => {
                  setFiles(next)
                  if (!next.some((f) => f.status === 'uploading')) setWaiting(false)
                }}
              />
              <FieldError>{waiting ? copy.uploading : undefined}</FieldError>
            </FieldSet>
            {topic?.diagnostics && (
              <FormField<SupportValues, 'diagnostics'>
                name="diagnostics"
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox ref={field.ref} checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} />
                    <FieldContent>
                      <FieldLabel>{copy.diagnostics}</FieldLabel>
                      <FieldDescription>{copy.diagnosticsHint(Object.values(details).join(' · ') || '…')}</FieldDescription>
                    </FieldContent>
                  </Field>
                )}
              />
            )}
          </div>
          <footer className="flex flex-col gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
            {failure && (
              <Alert variant="danger">
                <AlertTitle>{copy.failedTitle}</AlertTitle>
                <AlertDescription>{failure}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-3 @md/support:flex-row @md/support:items-center @md/support:justify-between">
              <ReplyLine open={reply.open} back={spoken(reply.back, today, copy.locale, copy)} by={by} copy={copy} />
              <FormSubmit pendingLabel={copy.sending} successLabel={copy.sent} errorLabel={copy.failed} invalidLabel={copy.invalid} className="@md/support:shrink-0">
                {copy.send}
              </FormSubmit>
            </div>
          </footer>
        </Form>
      </Collapse>
      <Collapse open={!!done} className="border-t border-line">
        {/* Sent, the confirmation keeps at least the form's room (1033px at 100%), so the card doesn't collapse. */}
        {done && (
          <div className="flex min-h-258.25 flex-col justify-center">
            <Done id={done.id} email={done.email} by={done.by} heading={embedded ? 'h3' : 'h2'} copy={copy} requestsHref={requestsHref} linkComponent={linkComponent} onAnother={again} />
          </div>
        )}
      </Collapse>
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

export { SupportRequest, DEFAULT_COPY as SUPPORT_REQUEST_COPY }
export type { SupportArticle, SupportField, SupportHours, SupportOption, SupportRequestCopy, SupportRequestProps, SupportTicket, SupportTopic, SupportUser }
