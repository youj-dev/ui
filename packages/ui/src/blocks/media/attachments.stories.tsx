import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { AttachmentComposer, type AttachmentComposerFile } from './attachments'

/** A stand-in for your storage: reports progress, then resolves with a key. */
async function demoUpload(_file: File, { onProgress }: { onProgress: (p: number) => void }) {
  for (const p of [30, 70, 100]) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    onProgress(p)
  }
  return { key: 'comments/attachment' }
}

const meta: Meta<typeof AttachmentComposer> = {
  title: 'Blocks/Media/Attachments',
  component: AttachmentComposer,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A reply box that takes files while you write: paste, drop or attach, each uploading with a ring as it goes; arrange them by dragging or with the keyboard; and Send waits for uploads still running instead of sending without them.',
      },
    },
  },
  args: { onUpload: fn(demoUpload) },
}
export default meta
type Story = StoryObj<typeof AttachmentComposer>

export const Default: Story = {}

/** Nothing written or attached yet. */
export const Empty: Story = { args: { defaultValue: '', defaultAttachments: [] } }

/** A file that didn’t upload: it says so, and a press retries it. Send stops on it. */
export const WithFailure: Story = {
  name: 'With a failure',
  args: {
    defaultAttachments: [
      {
        id: 'a',
        name: 'batch-check-lid.webp',
        size: 1.6 * 1024 * 1024,
        type: 'image/webp',
        preview: '/blocks/products/kettle-cream.webp',
        status: 'done',
      },
      { id: 'b', name: 'courier-label.pdf', size: 220 * 1024, type: 'application/pdf', status: 'error', error: 'The connection dropped.' },
    ],
  },
}

/** Its own page: a centered canvas and an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

const STORED: AttachmentComposerFile[] = [{ id: 'spec', name: 'q4-launch-brief.pdf', size: 860 * 1024, type: 'application/pdf', status: 'done' }]

/** Your thread, your rules and your storage: documents only, five at most, sent through your API. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    defaultValue: '',
    defaultAttachments: STORED,
    accept: 'application/pdf,.docx,.xlsx',
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
    copy: {
      title: 'Comment on Q4 launch plan',
      description: 'Visible to the launch team',
      placeholder: 'Add a comment… drop the brief or the budget',
    },
    onUpload: fn(async (_file: File, { onProgress }: { onProgress: (p: number) => void }) => {
      for (const p of [30, 70, 100]) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        onProgress(p)
      }
      return { key: 'comments/attachment' }
    }),
    onSend: fn(),
    onAttachmentsChange: fn(),
    onValueChange: fn(),
  },
}

const KB = 1024
const MBYTE = 1024 * KB

/** A helpdesk reply with logs: text, archives and screenshots only, six at most, a bundle still uploading. */
export const SupportReply: Story = {
  name: 'Support reply',
  args: {
    defaultValue:
      'Thanks for the logs, Marcus. I can see the sync token expiring in the second file; I’m attaching a fixed build and the steps to reset it.',
    defaultAttachments: [
      { id: 'sync', name: 'sync-debug.log', size: 412 * KB, type: 'text/plain', status: 'done' },
      { id: 'har', name: 'network-trace.har', size: 1.8 * MBYTE, type: 'application/json', status: 'done' },
      { id: 'build', name: 'desk-client-4.2.1-fix.zip', size: 18.4 * MBYTE, type: 'application/zip', status: 'uploading', progress: 62 },
    ],
    accept: '.log,.txt,.har,.zip,image/*',
    maxFiles: 6,
    maxSize: 25 * MBYTE,
    copy: {
      title: 'Reply to Marcus Webb',
      description: 'Ticket 7314 · Sync stops after the 4.2 update',
      placeholder: 'Write a reply… attach logs or screenshots',
      noFiles: 'Attach logs, a trace or screenshots',
    },
  },
}
