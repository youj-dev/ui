'use client'

import { useDeferredValue, useId, useState } from 'react'
import { useYouj } from '@youj/core'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'
import { useRoadmap } from './context'
import { similarRequests, type Category, type RoadmapRequest } from './data'
import { StatusTag } from './status-tag'
import { VoteButton } from './vote-button'
import { Eyebrow } from '../../../components/ui/typography'

/* Post a request, but first see if it exists. As the title takes shape, up
 * to three similar requests fold open under it (Collapse), each with its
 * status and a vote, so voting is one press away from posting a duplicate.
 * The matches change through PresenceList and their count is announced.
 * Posting holds the button pending, then the dialog closes on success. */

export function SubmitDialog({
  open,
  onOpenChange,
  requests,
  voted,
  countOf,
  onVote,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requests: readonly RoadmapRequest[]
  voted: ReadonlySet<string>
  countOf: (r: RoadmapRequest) => number
  onVote: (r: RoadmapRequest, voted: boolean) => void
  /** Posts the draft; reject to keep the dialog open and shake the button. */
  onSubmit: (draft: { title: string; body: string; category: Category }) => Promise<unknown> | unknown
}) {
  const k = useYouj()
  const id = useId()
  const { copy, categories } = useRoadmap()
  const first = 'channels' in categories ? 'channels' : (Object.keys(categories)[0] ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<Category>(first)
  const [error, setError] = useState<string>()
  const query = useDeferredValue(title)
  const matches = query.trim().length >= 3 ? similarRequests(requests, query) : []
  const shown = matches.length > 0

  const reset = () => {
    setTitle('')
    setBody('')
    setCategory(first)
    setError(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={(isOpen) => !isOpen && reset()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.submit}</DialogTitle>
          <DialogDescription>{copy.dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <FieldGroup className="gap-4">
            <Field invalid={!!error}>
              <FieldLabel>{copy.titleLabel}</FieldLabel>
              <Input
                value={title}
                autoComplete="off"
                placeholder={copy.titlePlaceholder}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setError(undefined)
                }}
              />
              <FieldError>{error}</FieldError>
            </Field>

            <p role="status" className="sr-only">
              {shown ? copy.similarFound(matches.length) : ''}
            </p>
            <Collapse open={shown}>
              <section aria-labelledby={`${id}-similar`} className="flex flex-col gap-2 rounded-lg border border-line bg-transparent p-2.5">
                <Eyebrow render={<h3 id={`${id}-similar`} />} className="px-1 text-ui-sm font-medium text-fg-muted">
                  {copy.similarHeading}
                </Eyebrow>
                <PresenceList className="flex flex-col gap-1.5">
                  {matches.map((r) => (
                    <PresenceItem key={r.id} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-ui font-medium text-fg">{r.title}</span>
                        <StatusTag status={r.status} className="text-ui-xs" />
                      </div>
                      <VoteButton layout="row" title={r.title} count={countOf(r)} voted={voted.has(r.id)} onVote={(v) => onVote(r, v)} className="h-control-sm" />
                    </PresenceItem>
                  ))}
                </PresenceList>
              </section>
            </Collapse>

            <Field>
              <FieldLabel>{copy.details}</FieldLabel>
              <Textarea value={body} rows={4} onChange={(event) => setBody(event.target.value)} placeholder={copy.detailsPlaceholder} />
              <FieldDescription>{copy.detailsHint}</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>{copy.area}</FieldLabel>
              <Select items={categories} value={category} onValueChange={(value) => value && setCategory(value as Category)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categories).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {copy.cancel}
          </Button>
          <AsyncButton
            pendingLabel={copy.posting}
            successLabel={copy.posted}
            onClick={(event) => {
              if (title.trim().length >= 8) return
              setError(copy.titleTooShort)
              event.preventDefault()
            }}
            onAction={async () => {
              await onSubmit({ title: title.trim(), body: body.trim(), category })
            }}
            onActionStateChange={(state) => state === 'success' && setTimeout(() => onOpenChange(false), k.ms('base'))}
          >
            {copy.postRequest}
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
