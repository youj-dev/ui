import { useEffect, useMemo, useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { toast } from '@youj/react/components/ui/toast'
import { DEMO_NOW, KINDS, makeLetters, ME, nextMonday, nextMorning, thisEvening, type Letter, type Stack } from './data'
import { back } from './time'

export interface Draft {
  to: string[]
  subject: string
  body: string
}

export type Tally = { done: number; later: number; replied: number; deleted: number }

export interface FolioOptions {
  onSend: (draft: Draft) => Promise<unknown>
  defaultLetter?: string
  cleared?: boolean
}

const byTime = (a: Letter, b: Letter) => b.time - a.time
/** A stack in the order J walks it: the inbox by what each letter needs, the rest by time, set-aside letters by when they come back. */
function inOrder(letters: Letter[], stack: Stack) {
  if (stack === 'inbox') return KINDS.flatMap((kind) => letters.filter((m) => m.kind === kind.id).sort(byTime))
  return [...letters].sort(stack === 'later' ? (a, b) => a.until! - b.until! : byTime)
}

/**
 * Folio's state and its verbs. Filing a letter (done, later, delete, reply)
 * hands the desk to the next one, which is read as it opens, counts it in the
 * morning's tally, and can be undone from the toast or with Z.
 */
export function useFolio({ onSend, defaultLetter, cleared = false }: FolioOptions) {
  const k = useYouj()
  const [now] = useState(DEMO_NOW)
  const [letters, setLetters] = useState(() => makeLetters(now).map((m) => (cleared && m.stack === 'inbox' ? { ...m, stack: 'done' as const, read: true } : m)))
  const [stack, setStack] = useState<Stack>('inbox')
  const [currentId, setCurrentId] = useState<string | null>(() => (cleared ? null : (defaultLetter ?? 'tillpoint')))
  const [query, setQuery] = useState('')
  const [replying, setReplying] = useState(false)
  const [laterOpen, setLaterOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState<Draft>({ to: [], subject: '', body: '' })
  const [reading, setReading] = useState(false)
  const [tally, setTally] = useState<Tally>({ done: 0, later: 0, replied: 0, deleted: 0 })
  const [pressed, setPressed] = useState<string | null>(null)
  const pressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const undo = useRef<(() => void) | null>(null)
  const search = useRef<HTMLInputElement>(null)
  const index = useRef<HTMLDivElement>(null)
  const desk = useRef<HTMLDivElement>(null)

  const order = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (m: Letter) => !q || `${m.from.name} ${m.from.org ?? ''} ${m.subject} ${m.body.join(' ')}`.toLowerCase().includes(q)
    return inOrder(letters.filter((m) => m.stack === stack && match(m)), stack)
  }, [letters, stack, query])
  const current = order.find((m) => m.id === currentId) ?? null
  const count = (s: Stack) => letters.filter((m) => m.stack === s).length
  const handled = tally.done + tally.later + tally.replied + tally.deleted

  // A search, or a stack, that leaves the current letter out hands the desk to its first match.
  if (!current && order[0] && currentId !== null) setCurrentId(order[0].id)

  // Each letter opens at its top; the index keeps the current one in view.
  useEffect(() => {
    desk.current?.scrollTo({ top: 0 })
    if (current) index.current?.querySelector(`[data-letter="${current.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: k.reduced ? 'auto' : 'smooth' })
  }, [current?.id, k.reduced])

  /** Presses a key in on the legend, for as long as the slow token. */
  const flash = (key: string) => {
    setPressed(key)
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => setPressed(null), k.reduced ? 120 : k.ms('slow'))
  }
  useEffect(() => () => clearTimeout(pressTimer.current), [])

  const patch = (id: string, change: Partial<Letter>) => setLetters((list) => list.map((m) => (m.id === id ? { ...m, ...change } : m)))
  const open = (id: string) => {
    setCurrentId(id)
    patch(id, { read: true })
    setReplying(false)
    setReading(true)
  }
  const step = (by: 1 | -1) => {
    if (!order.length) return
    const i = current ? order.indexOf(current) : -1
    const next = order[Math.min(order.length - 1, Math.max(0, i + by))]!
    open(next.id)
    // The index's roving tab stop follows along, so focus stays on the letter you're reading.
    if (index.current?.contains(document.activeElement)) requestAnimationFrame(() => index.current?.querySelector<HTMLElement>(`[data-letter="${next.id}"]`)?.focus({ preventScroll: true }))
  }

  const file = (m: Letter, to: Stack, change: Partial<Letter>, message: string, counter: keyof Tally) => {
    const i = order.indexOf(m)
    const after = order[i + 1] ?? order[i - 1] ?? null
    const before: Partial<Letter> = { stack: m.stack, until: m.until, read: m.read }
    setLetters((list) => list.map((x) => (x.id === m.id ? { ...x, stack: to, read: true, ...change } : after && x.id === after.id ? { ...x, read: true } : x)))
    setCurrentId(after?.id ?? null)
    if (!after) setReading(false)
    setReplying(false)
    setTally((t) => ({ ...t, [counter]: t[counter] + 1 }))
    const restore = () => {
      setLetters((list) => list.map((x) => (x.id === m.id ? { ...x, ...before } : x)))
      setCurrentId(m.id)
      setTally((t) => ({ ...t, [counter]: Math.max(0, t[counter] - 1) }))
      undo.current = null
    }
    undo.current = restore
    toast(message, { description: m.subject, action: { label: 'Undo', onClick: restore } })
  }

  const laterOptions = [
    { key: '1', label: 'This evening', time: thisEvening(now) },
    { key: '2', label: 'Tomorrow morning', time: nextMorning(now, 1) },
    { key: '3', label: 'Monday morning', time: nextMonday(now) },
  ]

  const actions = {
    open,
    step,
    flash,
    done: (m: Letter) => file(m, 'done', {}, 'Done', 'done'),
    remove: (m: Letter) => file(m, 'trash', {}, 'Deleted', 'deleted'),
    later: (m: Letter, until: number) => file(m, 'later', { until }, `Back ${back(until, now)}`, 'later'),
    star: (m: Letter, starred = !m.starred) => patch(m.id, { starred }),
    reply: async (m: Letter, body: string) => {
      await onSend({ to: [m.from.email], subject: `Re: ${m.subject}`, body })
      const sent: Letter = { ...m, id: `sent-${m.id}-${Date.now()}`, stack: 'sent', from: ME, to: [m.from.email], cc: [], subject: `Re: ${m.subject}`, body: body.split(/\n{2,}/), signoff: undefined, time: now, read: true, starred: false, enclosures: [], dates: [], until: undefined }
      setLetters((list) => [sent, ...list])
      file(m, 'done', {}, `Sent to ${m.from.name.split(' ')[0]}`, 'replied')
    },
    compose: (next: Draft = { to: [], subject: '', body: '' }) => {
      setDraft(next)
      setComposing(true)
    },
    send: async (next: Draft) => {
      await onSend(next)
      const sent: Letter = { id: `sent-${Date.now()}`, stack: 'sent', kind: 'reply', from: ME, to: next.to, subject: next.subject || '(no subject)', body: next.body ? next.body.split(/\n{2,}/) : ['(no letter)'], time: now, read: true, starred: false, enclosures: [], dates: [] }
      setLetters((list) => [sent, ...list])
      setComposing(false)
      toast.success('Letter sent', { description: `To ${next.to.join(', ')}` })
    },
    pick: (next: Stack) => {
      setStack(next)
      setReading(false)
      setReplying(false)
      setQuery('')
      setCurrentId(inOrder(letters.filter((m) => m.stack === next), next)[0]?.id ?? null)
    },
  }

  return {
    now,
    letters,
    stack,
    order,
    current,
    position: current ? order.indexOf(current) + 1 : 0,
    count,
    tally,
    handled,
    query,
    setQuery,
    replying,
    setReplying,
    laterOpen,
    setLaterOpen,
    laterOptions,
    palette,
    setPalette,
    composing,
    setComposing,
    draft,
    reading,
    setReading,
    pressed,
    undo,
    refs: { search, index, desk },
    ...actions,
  }
}

export type Folio = ReturnType<typeof useFolio>
