import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef } from 'react'
import { fn } from 'storybook/test'
import { UploadIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { PlaceholderPage } from '../../docs/placeholder-page'
import { UploadTray, useUploadTray, type UploadTrayContext, type UploadTrayItem } from './upload-tray'

const meta: Meta<typeof UploadTray> = {
  title: 'Blocks/Media/Upload tray',
  component: UploadTray,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'overlay' },
    docs: {
      description: {
        component:
          'Uploads that keep going while people keep working: drop files anywhere on the page, and a tray in the corner runs the queue a few at a time, pauses and resumes each from where it got to, retries with a countdown, waits out a lost connection, and gives an honest time left.',
      },
    },
  },
  // Over a stand-in page, as it floats over yours.
  args: { children: <PlaceholderPage dimmed={false} />, demoMarker: false, onUpload: fn(upload) },
}
export default meta
type Story = StoryObj<typeof UploadTray>

export const Default: Story = {}

/** Folded to its header: the overall progress runs along its foot. */
export const Collapsed: Story = { args: { defaultExpanded: false } }

const MB = 1024 * 1024
const P = '/blocks/products'

/** Settled with two failures: each says why, with Retry. */
export const WithFailures: Story = {
  name: 'With failures',
  args: {
    defaultItems: [
      {
        id: 'a',
        name: 'kettle-sage-front.webp',
        size: 2.4 * MB,
        loaded: 2.4 * MB,
        type: 'image/webp',
        preview: `${P}/kettle-sage.webp`,
        status: 'done',
      },
      {
        id: 'b',
        name: 'kettle-sage-side.webp',
        size: 2.2 * MB,
        loaded: 2.2 * MB,
        type: 'image/webp',
        preview: `${P}/kettle-sage-side.webp`,
        status: 'done',
      },
      {
        id: 'c',
        name: 'mug-white.webp',
        size: 1.1 * MB,
        loaded: 0.4 * MB,
        type: 'image/webp',
        preview: `${P}/mug.webp`,
        status: 'failed',
        error: 'Storage quota reached.',
      },
      {
        id: 'd',
        name: 'lookbook-print.pdf',
        size: 38.2 * MB,
        loaded: 21 * MB,
        type: 'application/pdf',
        status: 'failed',
        error: 'The server took too long to answer.',
      },
    ],
  },
}

/** Your own Upload button anywhere inside sends files with `useUploadTray().add`. */
function UploadButton() {
  const tray = useUploadTray()
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button size="sm" onClick={() => input.current?.click()}>
        <UploadIcon />
        Upload
      </Button>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          tray.add(Array.from(event.currentTarget.files ?? []))
          event.currentTarget.value = ''
        }}
      />
    </>
  )
}

/** Resumes from `offset`, reports bytes, stops on `signal`: the shape a tus or multipart uploader has. */
async function upload(file: File, { signal, offset, onProgress }: UploadTrayContext) {
  for (let loaded = offset; loaded < file.size; loaded = Math.min(file.size, loaded + 512 * 1024)) {
    await new Promise((resolve) => setTimeout(resolve, 120))
    if (signal.aborted) throw new Error('Paused')
    onProgress(loaded)
  }
  return { key: `board-pack/${file.name}` }
}

const STORED: UploadTrayItem[] = [
  { id: 'agenda', name: 'q4-board-agenda.pdf', size: 0.8 * MB, loaded: 0.8 * MB, type: 'application/pdf', status: 'done' },
]

/** Your page, your button, your storage: the page and the Upload button feed one queue. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    children: <PlaceholderPage dimmed={false} action={<UploadButton />} />,
    defaultItems: STORED,
    concurrency: 2,
    copy: { destination: 'Q4 board pack', region: 'Board pack uploads' },
    onUpload: fn(upload),
    onComplete: fn(),
    onItemsChange: fn(),
  },
}

const KB = 1024
const weak = (item: UploadTrayItem): UploadTrayItem => ({ ...item, bandwidth: 120 * KB }) as UploadTrayItem

/** A site inspector on a weak connection: photos creep up at a time, one waits to retry, and retries are spaced out longer. */
export const FieldPhotos: Story = {
  name: 'Field photos',
  args: {
    concurrency: 2,
    retryDelays: [5000, 15_000, 30_000],
    defaultItems: [
      { id: 'p1', name: 'IMG_2041-north-wall.jpg', size: 6.8 * MB, loaded: 6.8 * MB, type: 'image/jpeg', status: 'done' },
      weak({ id: 'p2', name: 'IMG_2042-footing-crack.jpg', size: 7.4 * MB, loaded: 3.1 * MB, type: 'image/jpeg', status: 'uploading' }),
      weak({
        id: 'p3',
        name: 'IMG_2043-rebar-spacing.jpg',
        size: 7.1 * MB,
        loaded: 1.2 * MB,
        type: 'image/jpeg',
        status: 'retrying',
        attempt: 2,
        error: 'Weak signal on site.',
      }),
      weak({ id: 'p4', name: 'IMG_2044-drainage.jpg', size: 6.5 * MB, loaded: 0, type: 'image/jpeg', status: 'queued' }),
      weak({ id: 'p5', name: 'inspection-notes-0412.pdf', size: 1.4 * MB, loaded: 0, type: 'application/pdf', status: 'queued' }),
    ],
    copy: { region: 'Site uploads', destination: 'Inspection · 18 Harbor Street', connectionReset: 'The signal dropped.' },
  },
}
