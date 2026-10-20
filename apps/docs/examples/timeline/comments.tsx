'use client'

import { useState } from 'react'
import { CircleDashedIcon } from '@youj/icons'
import { Button, Textarea, Timeline, type TimelineEvent, type TimelineEventType } from '@youj/react'

/* An issue's activity: comments beside status changes, newest first. The
 * composer sits above the feed, where a posted comment lands. */
const TYPES: Record<string, TimelineEventType> = {
  status: { icon: CircleDashedIcon, tone: 'accent', label: 'Status change' },
}

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000)

const ACTIVITY: TimelineEvent[] = [
  { id: 'c3', type: 'comment', actor: { name: 'Jonas Ortiz' }, title: 'Safari 17 still loops after the cookie fix. Repro steps in the ticket.', time: minutesAgo(12) },
  { id: 's2', type: 'status', actor: { name: 'Mira Kovac' }, title: 'moved this from To do to In progress', time: minutesAgo(48) },
  { id: 'c1', type: 'comment', actor: { name: 'Mira Kovac' }, title: 'Taking this one. I think it is the SameSite change.', time: minutesAgo(50) },
]

export default function TimelineComments() {
  const [events, setEvents] = useState(ACTIVITY)
  const [draft, setDraft] = useState('')
  const post = () => {
    const text = draft.trim()
    if (!text) return
    setEvents((list) => [{ id: `c${list.length + 1}`, type: 'comment', actor: { name: 'Sana Noor' }, title: text, time: new Date() }, ...list])
    setDraft('')
  }
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          post()
        }}
      >
        <Textarea aria-label="Comment" placeholder="Leave a comment" value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} />
        <Button type="submit" size="sm" className="self-end" disabled={!draft.trim()}>
          Comment
        </Button>
      </form>
      <Timeline events={events} types={TYPES} />
    </div>
  )
}
