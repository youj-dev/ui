'use client'

import { useState } from 'react'
import { PromptInput, usePromptAttachments } from '@youj/react'

export default function PromptInputAttachments() {
  const files = usePromptAttachments()
  const [last, setLast] = useState<string>()

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <PromptInput
        placeholder="Attach a screenshot or a log, then ask…"
        attachments={files.attachments}
        onAttach={files.add}
        onRemoveAttachment={files.remove}
        accept="image/*,.pdf,.txt,.log,.csv"
        onSubmit={({ text, attachments }) => {
          setLast(`${text || 'No text'} · ${attachments.length} ${attachments.length === 1 ? 'file' : 'files'}`)
          files.clear()
        }}
      />
      <p className="min-h-5 text-center text-ui-sm text-fg-muted" aria-live="polite">
        {last ? `Sent: ${last}` : 'Use the paperclip, paste an image or drop files on the field.'}
      </p>
    </div>
  )
}
