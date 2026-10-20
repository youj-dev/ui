import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { RefreshIcon } from '@youj/icons/components/youj/icons/refresh'
import { Specimen } from '../../../stories/kit'
import { Button } from '../button'
import { ChatToolCall, type ChatToolStatus } from './chat-tool-call'

const meta: Meta<typeof ChatToolCall> = {
  title: 'UI/Chat/ToolCall',
  component: ChatToolCall,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A tool the assistant called, built from Card, Collapsible and Badge. At rest it is one calm line: a status mark (a spinner, then a check that draws itself in or a warning that rocks once), the tool, a short read of its arguments and a badge whose label crossfades while its box morphs. When the result arrives, a two-line preview unfolds under it; opening the card shows the arguments and the full result, highlighted. Each status change is announced once. Reduced motion: every swap and fold is instant.',
      },
    },
  },
}
export default meta

const DEPLOYMENTS = [
  { id: 'dpl_8f2a91c', state: 'READY', regions: ['iad1', 'fra1'], age: '4m', commit: 'Tighten pricing grid on mobile' },
  { id: 'dpl_7c1e0b2', state: 'READY', regions: ['iad1', 'fra1'], age: '2d', commit: 'Move checkout to the edge' },
  { id: 'dpl_6a93d77', state: 'ERROR', regions: ['iad1'], age: '3d', commit: 'Upgrade the analytics client' },
]

function Live() {
  const [status, setStatus] = useState<ChatToolStatus>('pending')
  const [run, setRun] = useState(0)
  useEffect(() => {
    setStatus('pending')
    const timers = [setTimeout(() => setStatus('running'), 700), setTimeout(() => setStatus('success'), 2100)]
    return () => timers.forEach(clearTimeout)
  }, [run])
  return (
    <div className="flex w-full max-w-[min(560px,calc(100vw-2rem))] flex-col gap-3">
      <ChatToolCall
        name="get_deployments"
        args={{ project: 'orion', target: 'production', limit: 3 }}
        status={status}
        result={status === 'success' ? DEPLOYMENTS : undefined}
        duration={1400}
      />
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setRun((n) => n + 1)}>
          <RefreshIcon size={14} strokeWidth={1.75} />
          Run again
        </Button>
      </div>
    </div>
  )
}

/** Queued, running, done: the mark and badge change in place and the result's preview unfolds. Open it for the full exchange. */
export const Hero: StoryObj = {
  render: () => <Live />,
}

/** Every state at rest, and one opened. */
export const States: StoryObj = {
  render: () => (
    <div className="grid w-full max-w-[min(560px,calc(100vw-2rem))] gap-5">
      <Specimen label="pending">
        <ChatToolCall name="search_docs" args={{ query: 'youj 2.0 upgrade' }} status="pending" />
      </Specimen>
      <Specimen label="running">
        <ChatToolCall name="query_metrics" args={{ metric: ['cold_start', 'p95'], window: '7d' }} status="running" />
      </Specimen>
      <Specimen label="success">
        <ChatToolCall name="search_docs" args={{ query: 'youj 2.0 upgrade' }} status="success" duration={820} result='2 results: "Youj 2.0 is here", "Upgrading to 2.0"' />
      </Specimen>
      <Specimen label="error">
        <ChatToolCall name="rollback" args={{ deployment: 'dpl_7c1e0b2' }} status="error" error="403: this token can't promote deployments in production." duration={310} />
      </Specimen>
      <Specimen label="opened">
        <ChatToolCall name="get_deployments" args={{ project: 'orion', target: 'production', limit: 3 }} status="success" duration={1400} result={DEPLOYMENTS} defaultOpen />
      </Specimen>
    </div>
  ),
}
