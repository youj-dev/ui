'use client'

import { useEffect, useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { Collapse } from '@youj/motion'
import { SendIcon } from '@youj/icons'
import { Button } from '@youj/react/components/ui/button'
import { AsyncButton } from '@youj/react/components/ui/async-button'
import { Kbd, KbdGroup } from '@youj/react/components/ui/kbd'
import { Textarea } from '@youj/react/components/ui/textarea'

/**
 * "Reply to Priya…": a line at the foot of the letter that unfolds into a
 * composer in place. ⌘↵ sends (the button runs through sending to sent, and
 * the letter is filed as done); Escape folds it away.
 */
export function Reply({ to, open, onOpen, onCancel, onSend }: { to: string; open: boolean; onOpen: () => void; onCancel: () => void; onSend: (body: string) => Promise<void> }) {
  const k = useYouj()
  const [body, setBody] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)
  const send = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    // Once the fold has opened, so focus doesn't scroll to a box of no height.
    const id = setTimeout(() => field.current?.focus({ preventScroll: true }), k.reduced ? 0 : k.ms('fast'))
    return () => clearTimeout(id)
  }, [open, k])

  return (
    <div className="mt-8">
      {!open && (
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-line-control px-4 py-3 text-start text-ui-lg text-fg-muted transition-colors yj-duration-fast ease-standard focus-ring hover:border-fg-subtle hover:text-fg"
        >
          Reply to {to}…
          <Kbd className="ms-auto">R</Kbd>
        </button>
      )}
      <Collapse open={open}>
        <form
          aria-label={`Reply to ${to}`}
          className="flex flex-col gap-3 rounded-md border border-line-control bg-canvas p-3 focus-within:border-focus"
          onSubmit={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              send.current?.click()
            } else if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              onCancel()
            }
          }}
        >
          <Textarea
            ref={field}
            aria-label={`Reply to ${to}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            placeholder={`Dear ${to},`}
            // shape: the reply card is the page being written on; the text sits bare on it, as a letter does
            className="min-h-28 resize-none border-0 bg-transparent p-1 text-[1.0625rem] leading-relaxed shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted max-sm:hidden">
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
              </KbdGroup>
              sends it and files the letter
            </span>
            <Button type="button" variant="ghost" size="sm" className="ms-auto" onClick={onCancel}>
              Discard
            </Button>
            <AsyncButton
              ref={send}
              type="submit"
              size="sm"
              pendingLabel="Sending…"
              successLabel="Sent"
              errorLabel="Write something first"
              onAction={async () => {
                if (!body.trim()) throw new Error('empty')
                await onSend(body)
              }}
              data-yj-trigger=""
            >
              <SendIcon size={14} /> Send
            </AsyncButton>
          </div>
        </form>
      </Collapse>
    </div>
  )
}
