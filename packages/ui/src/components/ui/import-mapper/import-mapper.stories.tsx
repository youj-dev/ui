import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ImportMapper, type ImportField } from './import-mapper'

const meta: Meta<typeof ImportMapper> = {
  title: 'UI/Data/Import mapper',
  component: ImportMapper,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Bring a CSV into an app in two screens: drop a file, then see each column with the field it goes to, fix only the rows with problems and say what happens to duplicates, and import with a button that states what will happen. Ends with what was imported and the skipped rows to download.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ImportMapper>

export const Default: Story = { args: { onImport: fn(), onDone: fn() } }

/* The compact version for a ~520px dialog: the file and the columns with Start over / Continue, then what needs attention. */
export const InADialog: Story = {
  name: 'In a dialog',
  args: {
    variant: 'dialog',
    onImport: fn(),
    onDone: fn(),
    copy: { importMapperTitle: 'Import contacts', importMapperDescription: 'Match the columns of your file to your contact fields.' },
  },
}

/* Orders from a shop's export: other fields, other names. */
const ORDER_FIELDS: ImportField[] = [
  { id: 'number', label: 'Order number', required: true, synonyms: ['order id', 'order #', 'reference'] },
  { id: 'customer', label: 'Customer email', type: 'email', required: true, synonyms: ['buyer', 'email'] },
  { id: 'total', label: 'Total', type: 'number', required: true, synonyms: ['amount', 'order total', 'grand total'] },
  { id: 'placed', label: 'Placed on', type: 'date', synonyms: ['order date', 'date', 'created'] },
  { id: 'status', label: 'Status', synonyms: ['state', 'fulfilment'] },
]

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    fields: ORDER_FIELDS,
    keyField: 'number',
    existing: ['A-1001', 'A-1004'],
    sample: false,
    onImport: fn(),
    copy: {
      importMapperTitle: 'Import orders',
      importMapperDescription: 'Choose the export from your shop to add its orders.',
      importMapperItems: (count) => `${count} ${count === 1 ? 'order' : 'orders'}`,
      importMapperDuplicatesFound: (count) => `${count} ${count === 1 ? 'order already exists' : 'orders already exist'}`,
    },
  },
}

export const Standalone: Story = { args: { embedded: false } }
