'use client'

import { useEffect, useId, useRef, useState, type ComponentType } from 'react'
import { KeyIcon } from '@youj/icons/components/youj/icons/key'
import { safeNext } from '@/lib/stealth'
import { afterFirstPaint } from './stealth-idle'

const ERRORS: Record<string, string> = {
  wrong: 'That code didn’t work.',
  rate: 'Too many tries. Try again in 15 minutes.',
}

type Panel = ComponentType<{ next: string; message?: string }>
const loadPanel = () => import('./stealth-code-panel').then((m) => m.StealthCodePanel)

/**
 * The early-access-code entry on the stealth gate: a button at the top right that
 * opens the code form below it (Escape or a click elsewhere closes it, and
 * Escape gives focus back to the button). A wrong code comes back as
 * `?error=`, which opens the entry with the message. The form itself
 * (stealth-code-panel.tsx) loads once the page is idle, or on opening.
 */
export function StealthForm({ next, error }: { next: string; error?: string }) {
  const message = error ? (ERRORS[error] ?? ERRORS.wrong) : undefined
  const [open, setOpen] = useState(Boolean(message))
  const [Panel, setPanel] = useState<Panel | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  // An error read after mount (the static page's) opens the entry too.
  useEffect(() => {
    if (message) setOpen(true)
  }, [message])

  useEffect(() => {
    const load = () => void loadPanel().then((p) => setPanel(() => p))
    if (open) load()
    else return afterFirstPaint(load)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      trigger.current?.focus()
    }
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div ref={root} className="flex flex-col items-end">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-canvas/60 youj-allow-glass px-3 text-sm font-medium text-fg backdrop-blur transition-colors hover:bg-band focus-ring aria-expanded:bg-band"
      >
        <KeyIcon size={16} /> Early access code
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-x-3 top-[4.25rem] sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-[22rem]"
      >
        {open && (Panel ? <Panel next={next} message={message} /> : <div className="h-28 rounded-xl border border-line bg-surface" />)}
      </div>
    </div>
  )
}

/** The form on the static sign-in page (Cloudflare), which has no request to read: `next` and `error` come from the address bar once it mounts. */
export function StealthFormFromUrl() {
  const [query, setQuery] = useState<{ next: string; error?: string }>({ next: '/' })
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setQuery({ next: safeNext(params.get('next')), error: params.get('error') ?? undefined })
  }, [])
  return <StealthForm next={query.next} error={query.error} />
}
