'use client'

import { useState, type FormEvent } from 'react'
import { ContentSwap, Counter, MorphLabel } from '@youj/motion'
import { ArrowRightIcon, CheckCircleIcon } from '@youj/icons'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle } from '../../../components/ui/field'
import { FileUpload } from '../../../components/ui/file-upload'
import { Input } from '../../../components/ui/input'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Skeleton } from '../../../components/ui/skeleton'
import { Textarea } from '../../../components/ui/textarea'
import { demo, type HelpCenterCopy, type HelpChannel, type HelpRequest, type HelpTopic } from './data'

interface ContactProps {
  copy: HelpCenterCopy
  channels: HelpChannel[]
  topics: HelpTopic[]
  /** Sends the request and resolves with the ticket's id; reject with an Error to say why not. */
  onSubmit: (request: HelpRequest) => Promise<string>
  /** Uploads an attachment. */
  onUpload: (file: File) => Promise<unknown>
}

function Contact({ copy, channels, topics, onSubmit, onUpload }: ContactProps) {
  const [channel, setChannel] = useState(channels.find((c) => c.id === 'email')?.id ?? channels[0]?.id ?? '')
  const [phase, setPhase] = useState<'form' | 'sending' | 'done'>('form')
  const [topic, setTopic] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ topic?: string; message?: string }>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [ticket, setTicket] = useState('')
  const active = channels.find((c) => c.id === channel)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const message = String(data.get('message') ?? '').trim()
    const next = {
      topic: topic ? undefined : copy.topicRequired,
      message: message.length >= 20 ? undefined : copy.messageTooShort,
    }
    setErrors(next)
    setFailure(null)
    if (next.topic || next.message) return
    setPhase('sending')
    try {
      setTicket(await onSubmit({ channel, topic: topic!, reference: String(data.get('reference') ?? '').trim(), message }))
      setPhase('done')
    } catch (error) {
      setFailure(error instanceof Error ? error.message : copy.sendFailed)
      setPhase('form')
    }
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className="grid gap-8 rounded-2xl border border-line bg-surface p-5 md:grid-cols-[18rem_1fr] md:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 id="contact-title" className="text-2xl font-semibold tracking-tight">
            {copy.contactTitle}
          </h2>
          <p className="text-ui text-fg-muted">{copy.contactDescription}</p>
        </div>
        <RadioGroup aria-label={copy.channel} value={channel} onValueChange={(value) => setChannel(value as string)} className="flex flex-col gap-2">
          {channels.map((c) => (
            <FieldLabel key={c.id}>
              <Field orientation="horizontal">
                <RadioGroupItem value={c.id} />
                <FieldContent>
                  <FieldTitle>
                    <c.icon size={15} className="text-fg-muted" /> {c.title}
                  </FieldTitle>
                  <FieldDescription>{c.description}</FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        {active && (
          <div className="rounded-xl bg-accent-subtle px-4 py-3" aria-live="polite">
            <p className="text-ui-sm text-fg-muted">{copy.typicalReply}</p>
            <p className="flex items-baseline gap-1.5 text-fg">
              <Counter value={active.reply} className="text-3xl font-semibold tracking-tight" />
              <MorphLabel value={active.unit} className="text-ui font-medium text-fg-muted">
                {active.unit}
              </MorphLabel>
            </p>
          </div>
        )}
      </div>

      <ContentSwap
        loading={phase === 'sending'}
        loadingLabel={copy.sending}
        fallback={
          <div className="flex min-h-111.5 flex-col gap-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        }
      >
        {phase === 'done' ? (
          // Sending and sent take the form's height at 100%, so the page never shifts under them.
          <div className="flex h-full min-h-111.5 flex-col items-start justify-center gap-4 py-6">
            <span className="grid size-12 place-items-center rounded-full bg-success-subtle text-success">
              <CheckCircleIcon size={24} trigger="mount" />
            </span>
            <h3 className="text-xl font-semibold tracking-tight">{copy.doneTitle}</h3>
            <p className="max-w-md text-ui text-fg-muted">
              {copy.ticket} <span className="font-mono font-medium text-fg">{ticket}</span>{' '}
              {copy.doneBody(topics.find((t) => t.value === topic)?.label ?? '', active?.title ?? '', active?.reply ?? 0, active?.unit ?? '')}
            </p>
            <Button variant="outline" onClick={() => setPhase('form')}>
              {copy.another}
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={submit} aria-label={copy.form}>
            <FieldGroup className="gap-5">
              <Alert variant="danger" open={failure !== null}>
                <AlertDescription>{failure}</AlertDescription>
              </Alert>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field invalid={!!errors.topic}>
                  <FieldLabel>{copy.topic}</FieldLabel>
                  <Select
                    items={topics}
                    value={topic}
                    onValueChange={(value) => {
                      setTopic(value as string)
                      setErrors((e) => ({ ...e, topic: undefined }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={copy.topicPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.topic}</FieldError>
                </Field>
                <Field>
                  <FieldLabel>{copy.reference}</FieldLabel>
                  <Input name="reference" placeholder={copy.referencePlaceholder} className="font-mono" />
                  <FieldDescription>{copy.referenceHint}</FieldDescription>
                </Field>
              </div>
              <Field invalid={!!errors.message}>
                <FieldLabel>{copy.message}</FieldLabel>
                <Textarea name="message" rows={4} placeholder={copy.messagePlaceholder} onInput={() => setErrors((e) => ({ ...e, message: undefined }))} />
                <FieldError>{errors.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel>{copy.attachments}</FieldLabel>
                <FileUpload maxFiles={3} maxSize={10 * 1024 * 1024} onUpload={(file) => onUpload(file)} title={copy.attachmentsTitle} hint={copy.attachmentsHint} />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-ui-sm text-fg-muted">{copy.replyBy(copy.replyChannel[channel] ?? active?.title.toLowerCase() ?? channel)}</p>
                <Button type="submit">
                  {copy.send} <ArrowRightIcon size={14} className="rtl:-scale-x-100" />
                </Button>
              </div>
            </FieldGroup>
          </form>
        )}
      </ContentSwap>
    </section>
  )
}

/** The demo's send: a short wait and a made-up ticket. */
const demoSubmit = async () => (await demo('HelpCenter: onSubmit', 1200), `HB-${48213 + Math.floor(Math.random() * 400)}`)

export { Contact, demoSubmit }
