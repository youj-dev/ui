import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MediaDropzone, type MediaDropzoneFile } from './dropzone'

/** A stand-in for your storage: reports progress, then resolves with a URL. */
async function demoUpload(_file: File, { onProgress }: { onProgress: (percent: number) => void }) {
  for (const percent of [20, 55, 80, 100]) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    onProgress(percent)
  }
  return { url: 'https://files.example.com/uploads/new' }
}

const meta: Meta<typeof MediaDropzone> = {
  title: 'Blocks/Media/Drop zone',
  component: MediaDropzone,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A drop zone that takes files every way people have them: dropped or picked whole folders (read recursively, system files left out), pasted screenshots, and plain picks from the keyboard. It wakes when files are dragged over the page, says how many are coming and whether they’re accepted, explains every refusal, and uploads with real thumbnails, progress and Retry.',
      },
    },
  },
  args: { onUpload: fn(demoUpload) },
}
export default meta
type Story = StoryObj<typeof MediaDropzone>

export const Default: Story = {}

/** Nothing added yet. */
export const Empty: Story = { args: { defaultFiles: [] } }

const MB = 1024 * 1024
const P = '/blocks/products'

/** Product photos: images only, at least 1200 px square, eight at most. A smaller photo is refused with its size. */
export const ProductPhotos: Story = {
  name: 'Product photos',
  args: {
    accept: 'image/jpeg,image/png,image/webp',
    minDimensions: { width: 1200, height: 1200 },
    maxFiles: 8,
    maxSize: 20 * MB,
    maxTotalSize: 100 * MB,
    folders: false,
    copy: { title: 'Product photos', description: 'Square, 1200 px or larger. The first one is the cover.', drop: 'Drop photos here' },
    defaultFiles: [
      {
        id: 'sage',
        name: 'ridge-kettle-sage.webp',
        size: 1.4 * MB,
        type: 'image/webp',
        preview: `${P}/kettle-sage.webp`,
        width: 2400,
        height: 3000,
        status: 'done',
      },
      {
        id: 'side',
        name: 'ridge-kettle-side.webp',
        size: 1.3 * MB,
        type: 'image/webp',
        preview: `${P}/kettle-sage-side.webp`,
        width: 2400,
        height: 3000,
        status: 'done',
      },
      {
        id: 'rose',
        name: 'ridge-kettle-rose.webp',
        size: 1.5 * MB,
        type: 'image/webp',
        preview: `${P}/kettle-rose.webp`,
        width: 2400,
        height: 3000,
        status: 'done',
      },
    ],
  },
}

/** Its own page: a centered canvas and an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

const STORED: MediaDropzoneFile[] = [
  { id: 'msa', name: 'master-services-agreement.pdf', size: 2.1 * MB, type: 'application/pdf', path: 'contracts/2026', status: 'done' },
  { id: 'dpa', name: 'data-processing-addendum.pdf', size: 0.6 * MB, type: 'application/pdf', path: 'contracts/2026', status: 'done' },
]

/** Your files, rules and storage: contracts only, uploaded and removed through your API. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    defaultFiles: STORED,
    accept: '.pdf,.docx',
    maxSize: 10 * MB,
    maxFiles: 10,
    maxTotalSize: 50 * MB,
    copy: { title: 'Contract documents', description: 'Signed PDFs or Word files, filed under the client.', drop: 'Drop contracts or a folder' },
    onUpload: fn(async (_file: File, { onProgress }: { onProgress: (percent: number) => void }) => {
      for (const percent of [20, 55, 80, 100]) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        onProgress(percent)
      }
      return { url: 'https://files.example.com/contracts/new.pdf' }
    }),
    onRemove: fn(async () => {}),
    onReject: fn(),
    onFilesChange: fn(),
  },
}

/** A nonprofit's grant application: PDFs and budget sheets only, five MB each, six at most. */
export const GrantApplication: Story = {
  name: 'Grant application',
  args: {
    accept: '.pdf,.xlsx,.csv',
    maxSize: 5 * MB,
    maxFiles: 6,
    maxTotalSize: 20 * MB,
    folders: false,
    copy: {
      title: 'Application documents',
      description: 'Spring Community Fund · due March 14. PDFs for the narrative and letters, a spreadsheet for the budget.',
      drop: 'Drop your PDFs and budget here',
    },
    defaultFiles: [
      { id: 'narrative', name: 'project-narrative.pdf', size: 1.2 * MB, type: 'application/pdf', status: 'done', progress: 100 },
      {
        id: 'budget',
        name: 'budget-2027.xlsx',
        size: 84 * 1024,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        status: 'done',
        progress: 100,
      },
      { id: 'letters', name: 'letters-of-support.pdf', size: 3.9 * MB, type: 'application/pdf', status: 'uploading', progress: 41 },
    ],
  },
}
