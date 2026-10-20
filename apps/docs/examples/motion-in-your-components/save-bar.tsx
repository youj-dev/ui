'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { CheckIcon } from '@youj/icons'
import { Button, Switch } from '@youj/react'

const SETTINGS = [
  { id: 'previews', label: 'Protect preview deployments', hint: 'Visitors sign in before they see a preview.' },
  { id: 'production', label: 'Protect production', hint: 'Only your team can open the production URL.' },
] as const
type Settings = Record<(typeof SETTINGS)[number]['id'], boolean>

export default function SaveBar() {
  const k = useYouj()
  const [saved, setSaved] = useState<Settings>({ previews: true, production: false })
  const [draft, setDraft] = useState(saved)
  const [confirmed, setConfirmed] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const dirty = SETTINGS.some(({ id }) => draft[id] !== saved[id])

  const settle = (next: Settings, didSave: boolean) => {
    setSaved(next)
    setDraft(next)
    setConfirmed(didSave)
    // The bar and its buttons are leaving: keep focus in the card rather than dropping it on <body>.
    card.current?.focus({ preventScroll: true })
  }

  // The confirmation holds for three deliberate steps, so Speed stretches it too.
  useEffect(() => {
    if (!confirmed) return
    const timer = setTimeout(() => setConfirmed(false), k.ms('deliberate') * 3)
    return () => clearTimeout(timer)
  }, [confirmed, k])

  // Arrivals decelerate into place; exits are shorter and accelerate away. Reduced motion: no travel.
  const enter = k.reduced ? { duration: 0 } : k.tween('base', 'enter')
  const exit = k.reduced ? { duration: 0 } : k.tween('fast', 'exit')

  return (
    <MotionFeatures>
      <div className="w-full max-w-md">
        <div ref={card} tabIndex={-1} className="rounded-xl border border-line bg-surface outline-none">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-medium text-fg">Deployment protection</p>
            <p role="status" className="h-6">
              <AnimatePresence>
                {confirmed && (
                  <m.span
                    initial={k.reduced ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1, transition: k.reduced ? { duration: 0 } : k.spring('settle') }}
                    exit={{ opacity: 0, transition: exit }}
                    className="inline-flex h-6 items-center gap-1 rounded-full bg-success-subtle px-2 text-xs font-medium text-success-text"
                  >
                    <CheckIcon size={14} strokeWidth={2} trigger="mount" />
                    Saved
                  </m.span>
                )}
              </AnimatePresence>
            </p>
          </div>
          <div className="divide-y divide-line">
            {SETTINGS.map(({ id, label, hint }) => (
              <label key={id} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
                <span>
                  <span className="block text-sm text-fg">{label}</span>
                  <span className="block text-xs text-fg-muted">{hint}</span>
                </span>
                <Switch checked={draft[id]} onCheckedChange={(on) => setDraft((d) => ({ ...d, [id]: on }))} />
              </label>
            ))}
          </div>
        </div>

        {/* A fixed slot, so the page below never jumps when the bar comes and goes. */}
        <div className="mt-3 h-12">
          <AnimatePresence>
            {dirty && (
              <m.div
                initial={k.reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: enter }}
                exit={{ opacity: 0, y: 8, transition: exit }}
                className="flex h-12 items-center justify-between gap-3 rounded-lg border border-line bg-raised ps-4 pe-2 shadow-md"
              >
                <span className="text-sm text-fg-muted">Unsaved changes</span>
                <span className="flex gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => settle(saved, false)}>
                    Discard
                  </Button>
                  <Button size="sm" onClick={() => settle(draft, true)}>
                    Save
                  </Button>
                </span>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionFeatures>
  )
}
