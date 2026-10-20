'use client'

import { useEffect, useRef, useState } from 'react'
import {
  PromptInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Toggle,
  type PromptStatus,
} from '@youj/react'
import { GlobeIcon } from '@youj/icons'

const MODELS = [
  { value: 'pro', label: 'Youj Pro' },
  { value: 'fast', label: 'Youj Fast' },
]

export default function PromptInputDemo() {
  const [model, setModel] = useState('pro')
  const [search, setSearch] = useState(true)
  const [status, setStatus] = useState<PromptStatus>('idle')
  const [sent, setSent] = useState<string>()
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // A pretend reply: submitted, then streaming, then done. Send turns into stop meanwhile.
  const send = (text: string) => {
    setSent(text)
    setStatus('submitted')
    timers.current = [setTimeout(() => setStatus('streaming'), 600), setTimeout(() => setStatus('idle'), 3200)]
  }
  const stop = () => {
    timers.current.forEach(clearTimeout)
    setStatus('idle')
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <PromptInput
        status={status}
        onStop={stop}
        onSubmit={({ text }) => send(text)}
        toolbar={
          <>
            <Select items={MODELS} value={model} onValueChange={(value) => value && setModel(value)}>
              <SelectTrigger size="sm" variant="ghost" aria-label="Model" className="shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} side="top">
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Toggle size="sm" pressed={search} onPressedChange={setSearch} aria-label="Search the web">
              <GlobeIcon size={16} strokeWidth={1.75} />
              Search
            </Toggle>
          </>
        }
      />
      <p className="min-h-5 text-center text-ui-sm text-fg-muted" aria-live="polite">
        {status === 'idle' ? (sent ? `Sent “${sent}”` : 'Enter sends, Shift+Enter adds a line.') : 'Replying… press Escape or the stop button.'}
      </p>
    </div>
  )
}
