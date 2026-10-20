'use client'

import { useRef, useState } from 'react'
import { ChatSuggestions, PromptInput } from '@youj/react'

const FOLLOW_UPS = [
  { label: 'Show the diff' },
  { label: 'Is a rollback safe?', prompt: 'Is rolling back to dpl_7c1e0b2 safe?' },
  { label: 'Compare regions' },
  { label: 'Draft a status update' },
]

export default function SuggestionsDemo() {
  const [draft, setDraft] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      {/* Picking one fills the composer and focuses it, ready to edit or send. */}
      <ChatSuggestions
        suggestions={FOLLOW_UPS}
        onSelect={(prompt) => {
          setDraft(prompt)
          field.current?.focus()
        }}
      />
      <PromptInput value={draft} onValueChange={setDraft} textareaRef={field} onSubmit={() => setDraft('')} />
    </div>
  )
}
