import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { FileUpload, type UploadContext } from './file-upload'

const meta: Meta<typeof FileUpload> = {
  title: 'UI/Inputs/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Files in, with the whole lifecycle shown. The drop zone is a button (Enter or Space opens the picker) and a drop target: a hovering drag turns it accent and motion’s UploadIcon lifts. Files are checked against `accept`, `maxSize`, `maxFiles` and duplicates, with every rejection explained in one alert that grows in. Accepted files join a PresenceList with a thumbnail or type glyph and upload through `onUpload(file, { signal, onProgress })`: Progress glides with each report, the row settles into a drawn check, or shows the error with Retry; removing a file mid-upload aborts it, and focus moves to the next row rather than dropping. `variant="gallery"` is an image grid with the zone as the last tile. Reduced motion: rows appear and go at once and progress jumps.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FileUpload>

const MB = 1024 * 1024

/** A fake network: irregular chunks, a failure every third file, and a real abort. */
let attempts = 0
function fakeUpload(file: File, { signal, onProgress }: UploadContext) {
  const fails = ++attempts % 3 === 0
  return new Promise<void>((resolve, reject) => {
    let progress = 0
    const id = setInterval(() => {
      progress = Math.min(100, progress + 6 + Math.random() * 18)
      if (fails && progress > 55) {
        clearInterval(id)
        reject(new Error('Connection lost'))
        return
      }
      onProgress(progress)
      if (progress >= 100) {
        clearInterval(id)
        resolve()
      }
    }, 280 + (file.size % 5) * 40)
    signal.addEventListener('abort', () => {
      clearInterval(id)
      reject(signal.reason)
    })
  })
}

/** Attach documents: PNG, JPG or PDF up to 5 MB; every third upload fails so Retry shows. */
export const Hero: Story = {
  render: () => (
    <Card className="w-full max-w-[440px]">
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
        <CardDescription>Add receipts or screenshots to this expense.</CardDescription>
      </CardHeader>
      <CardContent>
        <FileUpload accept=".png,.jpg,.jpeg,.pdf" maxSize={5 * MB} maxFiles={6} onUpload={fakeUpload} />
      </CardContent>
    </Card>
  ),
}

export const Playground: Story = {
  args: { accept: 'image/*,.pdf', maxSize: 10 * MB, maxFiles: 5, multiple: true, variant: 'list' },
  render: (args) => (
    <div className="w-full max-w-[440px]">
      <FileUpload {...args} onUpload={fakeUpload} />
    </div>
  ),
}

/** Image-only: square tiles in a grid, with the zone as the last tile. */
export const Gallery: Story = {
  render: () => (
    <div className="w-full max-w-[460px]">
      <FileUpload variant="gallery" accept="image/*" maxSize={8 * MB} maxFiles={8} onUpload={fakeUpload} />
    </div>
  ),
}

/** Without `onUpload`, files are only collected (say, for a form that submits them later). */
export const CollectOnly: Story = {
  render: () => (
    <div className="w-full max-w-[440px]">
      <FileUpload accept=".csv,.xlsx" multiple={false} maxFiles={1} title="Drop a spreadsheet or browse" />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-full max-w-[440px]">
      <FileUpload disabled accept="image/*" maxSize={2 * MB} />
    </div>
  ),
}

/** Reduced motion: rows appear and leave at once, progress jumps, the check is already drawn. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <div className="w-full max-w-[440px]">
        <FileUpload accept="image/*,.pdf" maxSize={5 * MB} onUpload={fakeUpload} />
      </div>
    </YoujProvider>
  ),
}
