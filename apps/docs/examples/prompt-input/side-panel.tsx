'use client'

import { useRef, useState } from 'react'
import { Button, ChatSuggestions, PromptInput, Toggle, usePromptAttachments, type ChatSuggestion } from '@youj/react'
import { ImageIcon, MicIcon, SparklesIcon } from '@youj/icons'

const PROMPTS: ChatSuggestion[] = [
  { label: 'Summarize this week', icon: <SparklesIcon size={14} strokeWidth={1.75} /> },
  { label: 'Explain the build spike', icon: <SparklesIcon size={14} strokeWidth={1.75} /> },
  { label: 'Draft a status update', icon: <SparklesIcon size={14} strokeWidth={1.75} /> },
]

export default function PromptInputSidePanel() {
  const [value, setValue] = useState('')
  const [dictating, setDictating] = useState(false)
  const files = usePromptAttachments()
  const field = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-line bg-surface p-3">
      <ChatSuggestions
        suggestions={PROMPTS}
        onSelect={(prompt) => {
          setValue(prompt)
          field.current?.focus()
        }}
      />
      <PromptInput
        value={value}
        onValueChange={setValue}
        textareaRef={field}
        placeholder="Ask about this workspace…"
        maxLength={300}
        attachments={files.attachments}
        onAttach={files.add}
        onRemoveAttachment={files.remove}
        onSubmit={() => {
          setValue('')
          files.clear()
        }}
        toolbar={
          <>
            <Button variant="ghost" size="sm">
              <ImageIcon size={14} strokeWidth={1.75} />
              Create
            </Button>
            <Toggle size="sm" pressed={dictating} onPressedChange={setDictating} aria-label="Dictate">
              <MicIcon size={14} strokeWidth={1.75} />
            </Toggle>
          </>
        }
      />
    </div>
  )
}
