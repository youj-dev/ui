'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { ArrowRightIcon } from '@youj/icons/components/youj/icons/arrow-right'
import { Button, Field, FieldError, FieldLabel, PasswordInput } from '@youj/react'

/**
 * The early-access-code form inside the stealth gate's code entry (stealth-form.tsx),
 * a chunk of its own: it loads when the page is idle or the entry opens. A
 * plain post to /stealth/login; the field takes focus as it appears, and
 * shakes once with an error (not under reduced motion).
 */
export function StealthCodePanel({ next, message }: { next: string; message?: string }) {
  const k = useYouj()
  const [pending, setPending] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => form.current?.querySelector<HTMLInputElement>('input[name="password"]')?.focus(), [])

  return (
    <form
      ref={form}
      method="post"
      action="/stealth/login"
      aria-label="Early access"
      onSubmit={() => setPending(true)}
      className="rounded-xl border border-line bg-surface/90 youj-allow-glass p-4 text-start shadow-lg backdrop-blur"
    >
      <input type="hidden" name="next" value={next} />
      <motion.div
        initial={false}
        animate={message && !k.reduced ? { x: [0, -8, 7, -5, 3, -1, 0] } : undefined}
        transition={{ duration: k.ms('slow') / 1000, ease: 'easeOut' }}
      >
        <Field invalid={Boolean(message)}>
          <FieldLabel>Have an early access code? Get in early</FieldLabel>
          <div className="flex gap-2">
            <PasswordInput name="password" required groupClassName="flex-1" />
            <Button type="submit" loading={pending}>
              Get in <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
            </Button>
          </div>
          {message && <FieldError>{message}</FieldError>}
        </Field>
      </motion.div>
    </form>
  )
}
