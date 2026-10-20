import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Specimen } from '../../../stories/kit'
import { PromptInput, PromptInputCounter, usePromptAttachments, type PromptAttachment, type PromptStatus } from './chat-prompt-input'
import { ComposerToolbar } from './chat.fixtures'
import { ChatSuggestions, type ChatSuggestion } from './chat-suggestions'
import { Button } from '../button'
import { Toggle } from '../toggle'
import { SessionComposer } from './chat-session.fixtures'
import { ImageIcon } from '@youj/icons/components/youj/icons/image'
import { MicIcon } from '@youj/icons/components/youj/icons/mic'
import { SparklesIcon } from '@youj/icons/components/youj/icons/sparkles'

const meta: Meta<typeof PromptInput> = {
  title: 'UI/Chat/PromptInput',
  component: PromptInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The composer: a textarea that grows with the message, Enter to send and Shift+Enter for a new line (never cutting an IME composition short; on touch keyboards Enter is a line break). Attach with the paperclip, or paste and drop files: they sit above the text as chips with previews, each removable, and focus moves to a neighbor when one goes. The bottom bar takes your toolbar (a model select, tool toggles) and a counter; while the assistant works, send morphs into stop with a real path morph, and Escape stops too. Built on InputGroup, so focus, invalid and disabled treatments match every other field.',
      },
    },
  },
}
export default meta

function Composer({ initialStatus = 'idle' }: { initialStatus?: PromptStatus }) {
  const [status, setStatus] = useState<PromptStatus>(initialStatus)
  const [model, setModel] = useState('youj-pro')
  const [sent, setSent] = useState<string | null>(null)
  const files = usePromptAttachments()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <div className="flex w-full max-w-[min(680px,calc(100vw-2rem))] flex-col gap-3">
      <PromptInput
        status={status}
        onSubmit={({ text, attachments }) => {
          setSent(`${text}${attachments.length ? ` (+${attachments.length} attachment${attachments.length > 1 ? 's' : ''})` : ''}`)
          files.clear()
          setStatus('submitted')
          timer.current = setTimeout(() => {
            setStatus('streaming')
            timer.current = setTimeout(() => setStatus('idle'), 2400)
          }, 700)
        }}
        onStop={() => {
          clearTimeout(timer.current)
          setStatus('idle')
        }}
        attachments={files.attachments}
        onAttach={files.add}
        onRemoveAttachment={files.remove}
        accept="image/*,.pdf,.txt,.md,.csv"
        toolbar={<ComposerToolbar model={model} onModelChange={setModel} />}
      />
      <p className="px-1 text-ui-sm text-fg-muted" aria-live="polite">
        {sent ? `Sent: ${sent}` : 'Enter sends, Shift+Enter adds a line. Paste a screenshot to attach it.'}
      </p>
    </div>
  )
}

/** Type and press Enter: send morphs into stop while the reply "runs", and back. Paste or drop an image to attach it. */
export const Hero: StoryObj = {
  render: () => <Composer />,
}

/** A reply is streaming: the button is Stop (and Escape stops); Enter won't send meanwhile. */
export const Generating: StoryObj = {
  render: () => <Composer initialStatus="streaming" />,
}

const thumbnail = (from: string, to: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="48" height="48" fill="url(#g)"/><circle cx="34" cy="14" r="6" fill="#fff" fill-opacity=".7"/><path d="M0 40 L16 24 L28 34 L36 28 L48 38 V48 H0 Z" fill="#000" fill-opacity=".25"/></svg>`,
  )}`

const SAMPLE_ATTACHMENTS: PromptAttachment[] = [
  { id: 'a1', name: 'checkout-p95.png', type: 'image/png', size: 184_320, url: thumbnail('#6366f1', '#0ea5e9') },
  { id: 'a2', name: 'dashboard.png', type: 'image/png', size: 96_256, url: thumbnail('#f97316', '#db2777'), status: 'uploading' },
  { id: 'a3', name: 'incident-2026-01-13.pdf', type: 'application/pdf', size: 2_411_724 },
  { id: 'a4', name: 'traces.csv', type: 'text/csv', size: 48_120, status: 'error' },
]

function WithAttachments() {
  const [attachments, setAttachments] = useState(SAMPLE_ATTACHMENTS)
  return (
    <div className="w-full max-w-[min(680px,calc(100vw-2rem))]">
      <PromptInput
        defaultValue="Why did p95 jump on these two dashboards?"
        attachments={attachments}
        onAttach={() => {}}
        onRemoveAttachment={(id) => setAttachments((list) => list.filter((a) => a.id !== id))}
        onSubmit={() => {}}
      />
    </div>
  )
}

/** Images show a thumbnail, files a name and size. One is still uploading (sending waits for it), one failed. Hover a chip to remove it; removing moves focus to the next. */
export const Attachments: StoryObj = {
  render: () => <WithAttachments />,
}

/** A character limit: the count appears near it, turns amber in the last 5% and red past it, where sending is blocked and the field is invalid. A token count can replace it through `counter`. */
export const Counter: StoryObj = {
  render: () => (
    <div className="grid w-full max-w-[min(680px,calc(100vw-2rem))] gap-5">
      <Specimen label="maxLength={280}, near the limit">
        <PromptInput maxLength={280} defaultValue={'Summarize the incident for the status page. '.repeat(6).trim()} onSubmit={() => {}} />
      </Specimen>
      <Specimen label="over the limit">
        <PromptInput maxLength={120} defaultValue={'Summarize the incident for the status page, with a timeline and the fix. '.repeat(2).trim()} onSubmit={() => {}} />
      </Specimen>
      <Specimen label="counter slot: tokens">
        <PromptInput defaultValue="Draft the postmortem." counter={<PromptInputCounter value={7_620} max={8_000} unit="tokens" />} onSubmit={() => {}} />
      </Specimen>
    </div>
  ),
}

const PANEL_PROMPTS: ChatSuggestion[] = [
  { label: 'Summarize this week', icon: <SparklesIcon size={14} strokeWidth={1.75} /> },
  { label: 'Explain the build spike', icon: <SparklesIcon size={14} strokeWidth={1.75} /> },
  { label: 'Draft a status update', icon: <SparklesIcon size={14} strokeWidth={1.75} /> },
]

function SidePanelComposer() {
  const [value, setValue] = useState('')
  const [dictating, setDictating] = useState(false)
  const files = usePromptAttachments()
  const field = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="flex w-full max-w-[min(380px,calc(100vw-2rem))] flex-col gap-3 rounded-2xl border border-line bg-surface p-3">
      <ChatSuggestions
        suggestions={PANEL_PROMPTS}
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

/**
 * An assistant in a side panel: suggestion chips above a narrow composer whose bar holds attach (built in),
 * a Create button and a dictation toggle as toolbar slots. The count shows near the 300-character limit,
 * and sending past it is blocked. Pick a chip: it fills the composer and focus moves there.
 */
export const SidePanel: StoryObj = {
  render: () => <SidePanelComposer />,
}

/**
 * Session details under the composer, as a composition: a property list for context (tokens used of the window, with a tick meter that turns amber past 80%),
 * reasoning, tools, MCP and skills, and a status dot, then a footer with workspace and permission selects and a spinner while a reply runs.
 * Send a message: Status flips to Running, the spinner turns, and the context grows by a turn.
 */
export const SessionDetails: StoryObj = {
  name: 'Session details',
  render: () => <SessionComposer />,
}

/** Disabled: the whole frame grays, and nothing can be typed, attached or sent. */
export const Disabled: StoryObj = {
  render: () => (
    <div className="w-full max-w-[min(680px,calc(100vw-2rem))]">
      <PromptInput disabled placeholder="You've reached today's limit. It resets at 09:00." onAttach={() => {}} onSubmit={() => {}} />
    </div>
  ),
}
