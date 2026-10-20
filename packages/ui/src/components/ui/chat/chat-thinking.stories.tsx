import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { RefreshIcon } from '@youj/icons/components/youj/icons/refresh'
import { Specimen } from '../../../stories/kit'
import { Button } from '../button'
import { ChatMessage } from './chat-message'
import { ChatReasoning, ChatTypingIndicator } from './chat-thinking'
import { createTextStream } from './chat-text-stream'
import { ANSWERS, feed, tokenize, wait } from './chat.fixtures'

const meta: Meta<typeof ChatReasoning> = {
  title: 'UI/Chat/Thinking',
  component: ChatReasoning,
  tags: ['autodocs'],
  parameters: {
    // Top-aligned, as in a conversation: a centered story would re-center as the block folds.
    layout: 'padded',
    docs: {
      description: {
        component:
          'The assistant at work. ChatTypingIndicator says "Thinking…" with a band of light sweeping across the letters (transform only, paused offscreen) or three dots in a wave. ChatReasoning streams the model\'s reasoning into a block that folds away with motion\'s Collapse once the thinking is done, leaving "Thought for 8s"; it stays the way the reader leaves it. Reduced motion: nothing sweeps or waves, and the block opens and closes at once.',
      },
    },
  },
}
export default meta

const REASONING = `The user wants to ship **orion** safely. First check the latest deployments, so the steps match its real state.

- The last build passed and runs in iad1 and fra1.
- Rollbacks keep their builds, so promoting an older one is instant.

Then list the checks, the command and where rollbacks live.`

function Thinking({ tokensPerSecond = 70 }: { tokensPerSecond?: number }) {
  const [thoughts] = useState(() => createTextStream())
  const [answer] = useState(() => createTextStream())
  const [phase, setPhase] = useState<'waiting' | 'thinking' | 'answering' | 'done'>('waiting')
  const [took, setTook] = useState(0)
  const [run, setRun] = useState(0)
  const started = useRef(0)
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    thoughts.set('')
    answer.set('')
    setPhase('waiting')
    wait(900, signal)
      .then(() => {
        setPhase('thinking')
        started.current = Date.now()
        return feed(tokenize(REASONING), (t) => thoughts.append(t), { tokensPerSecond, signal })
      })
      .then(() => {
        setTook((Date.now() - started.current) / 1000)
        setPhase('answering')
        return feed(tokenize(ANSWERS.short), (t) => answer.append(t), { tokensPerSecond, signal })
      })
      .then(
        () => setPhase('done'),
        () => {},
      )
    return () => controller.abort()
  }, [thoughts, answer, tokensPerSecond, run])

  return (
    <div className="flex w-full max-w-[min(640px,calc(100vw-2rem))] flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setRun((n) => n + 1)}>
          <RefreshIcon size={14} strokeWidth={1.75} />
          Replay
        </Button>
      </div>
      <ChatMessage
        role="assistant"
        name="Youj"
        timestamp={new Date('2026-01-15T09:41:00Z')}
        streaming={phase !== 'done'}
        content={phase === 'answering' || phase === 'done' ? answer : undefined}
      >
        {phase === 'waiting' ? (
          <ChatTypingIndicator />
        ) : (
          <ChatReasoning content={thoughts} streaming={phase === 'thinking'} duration={took} />
        )}
      </ChatMessage>
    </div>
  )
}

/** The whole arc: "Thinking…" sweeps, the reasoning streams in, folds away to "Thought for 3s" as the answer starts. Replay it. */
export const Hero: StoryObj = {
  render: () => <Thinking />,
}

/** Both indicators. The dots are motion's LoaderDotsIcon; the sweep is a masked copy of the label riding a band of light. */
export const TypingIndicators: StoryObj = {
  render: () => (
    <div className="grid w-full max-w-[420px] grid-cols-2 gap-8">
      <Specimen label="shimmer (default)">
        <ChatTypingIndicator />
      </Specimen>
      <Specimen label="dots">
        <ChatTypingIndicator variant="dots" />
      </Specimen>
      <Specimen label="custom label">
        <ChatTypingIndicator label="Searching the docs…" />
      </Specimen>
    </div>
  ),
}

/** Finished reasoning, folded (the default once done) and opened by the reader. */
export const Reasoning: StoryObj = {
  render: () => (
    <div className="grid w-full max-w-[min(640px,calc(100vw-2rem))] gap-6">
      <Specimen label="done, folded">
        <ChatReasoning content={REASONING} duration={8} />
      </Specimen>
      <Specimen label="done, opened">
        <ChatReasoning content={REASONING} duration={74} open />
      </Specimen>
    </div>
  ),
}
