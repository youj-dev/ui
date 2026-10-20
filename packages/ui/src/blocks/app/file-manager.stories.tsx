import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { FileManager } from './file-manager'

const stash = defineTheme({ accent: 'oklch(0.66 0.14 230)' }) // youj-allow: theme accent

const meta: Meta<typeof FileManager> = {
  title: 'Blocks/App/File Manager',
  component: FileManager,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: stash },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Help your team browse, upload and preview files with folders and a choice of grid or list views.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FileManager>

export const Grid: Story = {}

/** Its own page, for an app without the frame: the top bar with search and Upload over full-height folder and file panes. */
export const Standalone: Story = { args: { embedded: false } }

export const List: Story = { args: { defaultView: 'list' } }

const QUARRY_NOW = Date.UTC(2027, 0, 10, 12)
const DAY = 86_400_000
const GB = 1024 ** 3

/** A data team’s bucket: its own folders, files, storage split and API callbacks. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Quarry' },
    now: QUARRY_NOW,
    defaultView: 'list',
    folders: [
      { id: 'raw', name: 'Raw exports' },
      { id: 'models', name: 'Models', children: [{ id: 'churn', name: 'Churn' }, { id: 'ltv', name: 'Lifetime value' }] },
      { id: 'reports', name: 'Reports' },
    ],
    files: [
      { id: 'q1', name: 'orders_2026.csv', folder: 'raw', kind: 'sheet', size: 412 * 1024 ** 2, modified: QUARRY_NOW - 0.1 * DAY, owner: 'Rui Costa' },
      { id: 'q2', name: 'events.parquet', folder: 'raw', kind: 'archive', size: 2.4 * GB, modified: QUARRY_NOW - DAY, owner: 'Rui Costa' },
      { id: 'q3', name: 'customers.csv', folder: 'raw', kind: 'sheet', size: 38 * 1024 ** 2, modified: QUARRY_NOW - 5 * DAY, owner: 'Lena Ott' },
      { id: 'q4', name: 'churn.ipynb', folder: 'churn', kind: 'doc', size: 1.2 * 1024 ** 2, modified: QUARRY_NOW - 2 * DAY, owner: 'Lena Ott' },
      { id: 'q5', name: 'Q4 board pack.pdf', folder: 'reports', kind: 'pdf', size: 8.8 * 1024 ** 2, modified: QUARRY_NOW - 40 * DAY, owner: 'Ayo Bello' },
    ],
    storage: [
      { label: 'Tables', bytes: 31 * GB, tone: 'bg-accent' },
      { label: 'Notebooks', bytes: 4 * GB, tone: 'bg-success' },
    ],
    quota: 250 * GB,
    onFolderChange: fn(),
    onViewChange: fn(),
    onDelete: fn(),
    onRestore: fn(),
    onDownload: fn(),
    onCopyLink: fn(),
    onOpen: fn(),
    getShareUrl: (file) => `https://quarry.app/f/${file.id}`,
    copy: { upload: 'Add data', files: 'Datasets', emptyDescription: 'Drop CSV or Parquet files here, or use Add data.' },
  },
}
