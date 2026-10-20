import type { Meta, StoryObj } from '@storybook/react-vite'
import { Specimen } from '../../../stories/kit'
import { ChatCitation, ChatSources, type ChatSource } from './chat-citation'
import { ChatMessage } from './chat-message'
import { ANSWERS } from './chat.fixtures'

const meta: Meta<typeof ChatCitation> = {
  title: 'UI/Chat/Citation',
  component: ChatCitation,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Where an answer came from. `[1]` in the markdown becomes a numbered chip that links to its source and previews it on hover or focus (HoverCard: a beat of intent, yj-pop out of the chip, and it stays while the pointer travels onto it). ChatSources repeats them as a row of chips under the answer. The link is the accessible interface ("1, Regions and pricing"); the preview is a sighted convenience, and a source whose URL isn\'t http(s) shows but doesn\'t link.',
      },
    },
  },
}
export default meta

const SOURCES: ChatSource[] = [
  { title: 'Regions and pricing', url: 'https://youj.io/docs/regions', snippet: 'Per-region pricing for functions: requests, duration and bandwidth, updated monthly.' },
  { title: 'Measuring cold starts', url: 'https://youj.io/blog/cold-starts', snippet: 'How we measure cold starts: 1 GB functions, 15 minutes idle, p50 and p95 over 7 days.' },
]

/** An answer that cites its sources: hover or focus a number for its preview, or use the chips below. */
export const Hero: StoryObj = {
  render: () => (
    <div className="w-full max-w-[min(680px,calc(100vw-2rem))]">
      <ChatMessage role="assistant" name="Youj" timestamp={new Date('2026-01-15T09:41:00Z')} content={ANSWERS.regions} sources={SOURCES} />
    </div>
  ),
}

/** The preview itself, held open, and the pieces on their own. */
export const Pieces: StoryObj = {
  render: () => (
    <div className="grid w-full max-w-[520px] gap-10 pt-40">
      <Specimen label="inline citation, preview open">
        <p className="text-ui-lg leading-6 text-fg">
          fra1 is the cheapest at that volume
          <ChatCitation index={1} source={SOURCES[0]!} defaultOpen />.
        </p>
      </Specimen>
      <Specimen label="source chips">
        <ChatSources sources={[...SOURCES, { title: 'Internal runbook', url: 'file:///runbooks/regions.md' }]} />
      </Specimen>
    </div>
  ),
}
