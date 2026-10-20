import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core'
import { RefreshIcon } from '@youj/icons/components/youj/icons/refresh'
import { Note, Specimen } from '../../../stories/kit'
import { Button } from '../button'
import { ChatMarkdown } from './chat-markdown'
import { ANSWERS, useFakeStream } from './chat.fixtures'

const meta: Meta = {
  title: 'UI/Chat/Markdown',
  component: ChatMarkdown,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Streamed markdown for chat answers: paragraphs, headings, lists, fenced code with highlighting and a copy button, inline code, links, tables, blockquotes and numbered citations. It renders a parsed tree, never HTML, so raw HTML stays text and only http(s) and mailto URLs link. While streaming, each word fades up once as it arrives, a caret marks where writing happens (solid while tokens flow, blinking when the stream pauses), and unfinished syntax renders optimistically so nothing flickers from asterisks into bold. Blocks are memoised by their source, and a ChatTextSource as `content` re-renders only this component per token. Reduced motion: no fades and no blink, and the text arrives in whole sentences and lines.',
      },
    },
  },
}
export default meta

interface StreamArgs {
  /** Tokens per second from the fake model. */
  tokensPerSecond: number
}

function Streamed({ tokensPerSecond, text = ANSWERS.deploy }: StreamArgs & { text?: string }) {
  const { stream, streaming, restart } = useFakeStream(text, { tokensPerSecond })
  return (
    <div className="flex w-full max-w-[min(640px,calc(100vw-2rem))] flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-ui-sm text-fg-muted" aria-live="off">
          {streaming ? 'Streaming…' : 'Done'}
        </span>
        <Button variant="ghost" size="sm" onClick={restart}>
          <RefreshIcon size={14} strokeWidth={1.75} />
          Replay
        </Button>
      </div>
      <ChatMarkdown content={stream} streaming={streaming} className="text-ui-lg leading-6" />
    </div>
  )
}

/** A full answer streaming in at a model's pace: words fade up, the table and code block fill in, the caret leads. Replay it, or change the rate. */
export const Hero: StoryObj<StreamArgs> = {
  args: { tokensPerSecond: 45 },
  argTypes: { tokensPerSecond: { control: { type: 'range', min: 5, max: 400, step: 5 } } },
  render: (args) => <Streamed {...args} />,
}

const KITCHEN_SINK = `# Heading one
## Heading two
### Heading three

A paragraph with **strong**, *emphasis*, ***both***, ~~strikethrough~~, \`inline code\`, a [link](https://youj.io) and a bare URL: https://youj.io/docs. Line breaks
are kept, as chat text means them.

- Bullets
  - nest
    - deeper
- with \`code\` inside

3. Ordered lists
4. keep their start

> A quote, with **formatting**,
> across two lines.

---

| Left | Center | Right |
| :--- | :----: | ----: |
| a    |   b    |     1 |
| long cell that wraps onto a second line when space runs out | c | 22 |

\`\`\`json
{ "plan": "pro", "seats": 12, "sso": true }
\`\`\`

\`\`\`diff
@@ pricing.ts @@
- const seats = 10
+ const seats = 12
\`\`\``

/** Everything the subset supports, finished (no streaming). */
export const KitchenSink: StoryObj = {
  render: () => (
    <div className="w-full max-w-[min(640px,calc(100vw-2rem))]">
      <ChatMarkdown content={KITCHEN_SINK} className="text-ui-lg leading-6" />
    </div>
  ),
}

const ATTACKS = `A model's answer is untrusted input. Each line below tries to inject markup or script; each renders as text.

<script>alert('pwned')</script>

<img src=x onerror="alert('pwned')">

[A javascript: link](javascript:alert('pwned')) · [a data: link](data:text/html,<script>alert(1)</script>) · [a relative link](/account/delete)

![a tracking pixel](https://tracker.example/pixel.gif)

<a href="https://evil.example" onclick="alert(1)">raw anchor</a>`

/** Script tags, event handlers and script URLs stay inert text. Images become links rather than loading. */
export const Sanitised: StoryObj = {
  render: () => (
    <div className="w-full max-w-[min(640px,calc(100vw-2rem))]">
      <ChatMarkdown content={ATTACKS} className="text-ui-lg leading-6" />
    </div>
  ),
}

/** Reduced motion, forced for this story: no word fades, no blink, and the answer arrives a sentence or a line at a time. */
export const ReducedMotion: StoryObj<StreamArgs> = {
  args: { tokensPerSecond: 45 },
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="flex flex-col gap-4">
        <Note>Forced to reduced motion here, whatever the toolbar says.</Note>
        <Streamed {...args} />
      </div>
    </YoujProvider>
  ),
}

/** Long words, URLs and code never widen the column: text wraps, code and tables scroll on their own. */
export const LongContent: StoryObj = {
  render: () => (
    <div className="grid w-full max-w-[420px] grid-cols-[minmax(0,1fr)] gap-6">
      <Specimen label="unbroken strings">
        <ChatMarkdown
          className="text-ui-lg leading-6"
          content={
            'Supercalifragilisticexpialidocious-and-then-some-more-without-spaces and https://youj.io/a/really/long/path/that/keeps/going/and/going?with=query&params=true'
          }
        />
      </Specimen>
      <Specimen label="wide code">
        <ChatMarkdown
          className="text-ui-lg leading-6"
          content={'```ts\nexport const config = { runtime: "edge", regions: ["iad1", "fra1", "hnd1", "syd1"], maxDuration: 30, memory: 1024 }\n```'}
        />
      </Specimen>
    </div>
  ),
}
