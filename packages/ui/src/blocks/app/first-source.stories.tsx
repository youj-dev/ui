import type { Meta, StoryObj } from '@storybook/react-vite'
import { illustrations } from '@youj/illustrations'
import { CameraIcon, CloudIcon, FileSpreadsheetIcon, FolderIcon, MailIcon, UserPlusIcon } from '@youj/icons'
import { fn } from 'storybook/test'
import { FirstSource } from './first-source'

const meta: Meta<typeof FirstSource> = {
  title: 'Blocks/App/First Source',
  component: FirstSource,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment', preset: 'basalt', address: 'console.acme.dev/analytics/warehouse', illustration: true },
    docs: {
      description: {
        component:
          'Guide your users towards adding their first data source with an illustrated empty warehouse.',
      },
    },
  },
  argTypes: { theme: { control: false }, illustration: { control: 'select', options: illustrations.map((i) => i.id) } },
}
export default meta
type Story = StoryObj<typeof FirstSource>

export const Default: Story = { name: 'Data warehouse' }

/** Opened on the event stream: three packets hanging over the bay. */
export const EventStream: Story = { name: 'Event stream', args: { defaultSource: 'stream' } }

/** Any illustration in place of the floor, by id: here the pipeline, for a warehouse fed by streams. */
export const WithIllustration: Story = { name: 'With an illustration', args: { illustration: 'pipeline' } }

/** A photo library: the first album can come from the camera roll, a cloud drive or a folder. */
export const PhotoLibrary: Story = {
  name: 'Photo library',
  args: {
    copy: {
      title: 'Library',
      scope: 'maya.photos · private',
      status: '0 photos',
      heading: 'No photos yet',
      body: 'Add your first album and its photos land on this floor as they import. A camera roll of a few thousand takes about a minute over Wi-Fi.',
      sourceLabel: 'Where your photos come from',
      tier: 'Free · 5 GB',
      connecting: 'Importing',
      connected: 'Album added',
    },
    sources: [
      { id: 'camera', kind: 'stream', icon: CameraIcon, label: 'Camera roll', description: 'iPhone · Android · iPad', action: 'Import camera roll' },
      { id: 'cloud', kind: 'database', icon: CloudIcon, label: 'Cloud drive', description: 'iCloud · Google Drive · Dropbox', action: 'Connect cloud drive' },
      { id: 'folder', kind: 'files', icon: FolderIcon, label: 'Folder', description: 'JPEG · HEIC · RAW', action: 'Choose a folder' },
    ],
    onConnect: fn(),
  },
}

/** A CRM: the first contacts come from a spreadsheet, an inbox or by hand. */
export const CrmImport: Story = {
  name: 'CRM import',
  args: {
    defaultSource: 'inbox',
    copy: {
      title: 'Contacts',
      scope: 'northwind.crm · EU sales',
      status: '0 contacts',
      heading: 'No contacts yet',
      body: 'Bring in your first contacts and they land on this floor as they import. A spreadsheet of a few hundred rows takes under a minute.',
      sourceLabel: 'Where your contacts come from',
      tier: 'Starter · 1,000 contacts',
      connecting: 'Importing',
      connected: 'Contacts imported',
    },
    sources: [
      { id: 'sheet', kind: 'files', icon: FileSpreadsheetIcon, label: 'Spreadsheet', description: 'CSV · XLSX · Google Sheets', action: 'Import spreadsheet' },
      { id: 'inbox', kind: 'stream', icon: MailIcon, label: 'Email', description: 'Gmail · Outlook · IMAP', action: 'Connect inbox' },
      { id: 'manual', kind: 'database', icon: UserPlusIcon, label: 'By hand', description: 'One at a time', action: 'Add a contact' },
    ],
    onConnect: fn(),
  },
}
