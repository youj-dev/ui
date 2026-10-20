import type { Meta, StoryObj } from '@storybook/react-vite'
import { SpreadsheetTable } from './spreadsheet'
import type { SpreadsheetTableRow } from './spreadsheet/data'

const meta: Meta<typeof SpreadsheetTable> = {
  title: 'Blocks/Tables/Spreadsheet',
  component: SpreadsheetTable,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Rows that work like a spreadsheet (the demo: a stock sheet): edit any cell in place, read the active cell in the name box and formula bar, paste a block of cells from Excel or Google Sheets (checked per column), undo and redo with ⌘Z and ⇧⌘Z, and keep the totals in view as you scroll.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SpreadsheetTable>

/** The block as it installs: 32 lines of outdoor gear, a few running low. */
export const Default: Story = { name: 'Stock sheet' }

const ROWS: SpreadsheetTableRow[] = [
  { id: 'b1', ref: 'BN-0101', name: 'Sourdough loaf', category: 'Bread', location: 'R-01', quantity: 42, threshold: 20, unitValue: 2.1 },
  { id: 'b2', ref: 'BN-0102', name: 'Rye sandwich loaf', category: 'Bread', location: 'R-01', quantity: 12, threshold: 15, unitValue: 2.4 },
  { id: 'b3', ref: 'PS-0201', name: 'Almond croissant', category: 'Pastry', location: 'F-02', quantity: 64, threshold: 30, unitValue: 0.95 },
  { id: 'b4', ref: 'PS-0202', name: 'Cardamom bun', category: 'Pastry', location: 'F-02', quantity: 38, threshold: 24, unitValue: 0.8 },
  { id: 'b5', ref: 'DR-0301', name: 'Oat milk, 1 L', category: 'Dairy-free', location: 'C-04', quantity: 9, threshold: 12, unitValue: 1.6 },
]

/** A bakery's stock in euros, with its own categories and strings. */
export const WithYourData: Story = {
  args: { rows: ROWS, categories: ['Bread', 'Pastry', 'Dairy-free'], currency: 'EUR', copy: { title: 'Bakery stock', noun: 'lines' } },
}

/** The first load: skeleton rows in each column's shape. */
export const Loading: Story = { args: { rows: [], loading: true } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. */
export const Standalone: Story = { args: { embedded: false } }

const supply = (id: string, ref: string, name: string, category: string, location: string, quantity: number, threshold: number, unitValue: number): SpreadsheetTableRow => ({ id, ref, name, category, location, quantity, threshold, unitValue })

const SUPPLIES: SpreadsheetTableRow[] = [
  supply('s1', 'PA-101', 'Copy paper, ream', 'Paper', 'Cupboard 1', 24, 10, 5.2),
  supply('s2', 'PA-102', 'Construction paper', 'Paper', 'Cupboard 1', 6, 8, 3.4),
  supply('s3', 'PA-103', 'Graph paper pad', 'Paper', 'Cupboard 1', 31, 12, 2.1),
  supply('s4', 'AR-201', 'Watercolor set', 'Art', 'Cupboard 2', 14, 6, 7.9),
  supply('s5', 'AR-202', 'Glue sticks, box of 30', 'Art', 'Cupboard 2', 9, 10, 6.5),
  supply('s6', 'AR-203', 'Safety scissors', 'Art', 'Cupboard 2', 40, 15, 1.4),
  supply('s7', 'WR-301', 'Pencils, box of 12', 'Writing', 'Cupboard 3', 55, 20, 2.8),
  supply('s8', 'WR-302', 'Dry-erase markers', 'Writing', 'Cupboard 3', 7, 12, 8.6),
  supply('s9', 'SC-401', 'Magnifying glasses', 'Science', 'Lab shelf', 18, 6, 3.9),
  supply('s10', 'SC-402', 'Plastic beakers, set', 'Science', 'Lab shelf', 4, 5, 11.5),
]

/** Education: a teacher's supply cupboard in dollars, with its own types, cupboards and column names. */
export const ClassroomSupplies: Story = {
  name: 'Classroom supplies',
  args: {
    rows: SUPPLIES,
    categories: ['Paper', 'Art', 'Writing', 'Science'],
    copy: {
      title: 'Classroom supplies',
      description: (rows, units, value) => `${rows} supplies · ${units} in stock · ${value} of materials`,
      noun: 'supplies',
      columns: { row: 'Row', ref: 'Code', name: 'Supply', category: 'Type', location: 'Shelf', quantity: 'In stock', threshold: 'Reorder at', unitValue: 'Price', value: 'Value' },
      low: 'Running low',
      emptyTitle: 'No supplies yet',
    },
  },
}

const reagent = (id: string, ref: string, name: string, category: string, location: string, quantity: number, threshold: number, unitValue: number): SpreadsheetTableRow => ({ id, ref, name, category, location, quantity, threshold, unitValue })

const REAGENTS: SpreadsheetTableRow[] = [
  reagent('r1', 'AC-1001', 'Hydrochloric acid 1 M', 'Acids', 'Shelf A2', 12, 4, 18.5),
  reagent('r2', 'AC-1002', 'Sulfuric acid 0.5 M', 'Acids', 'Shelf A2', 3, 4, 21),
  reagent('r3', 'AC-1003', 'Acetic acid, glacial', 'Acids', 'Shelf A3', 8, 3, 16.2),
  reagent('r4', 'BU-2001', 'Tris-HCl pH 7.5', 'Buffers', 'Fridge 1', 20, 8, 12.4),
  reagent('r5', 'BU-2002', 'PBS 10x', 'Buffers', 'Fridge 1', 6, 8, 9.8),
  reagent('r6', 'BU-2003', 'HEPES 1 M', 'Buffers', 'Fridge 2', 14, 5, 24),
  reagent('r7', 'SO-3001', 'Ethanol, absolute', 'Solvents', 'Cabinet S1', 30, 10, 34.9),
  reagent('r8', 'SO-3002', 'Acetone', 'Solvents', 'Cabinet S1', 9, 10, 27.5),
  reagent('r9', 'ST-4001', 'Crystal violet', 'Stains', 'Shelf B1', 5, 3, 15.6),
  reagent('r10', 'ST-4002', 'Coomassie blue', 'Stains', 'Shelf B1', 2, 3, 41),
]

/** A research lab: reagents by kind, shelf or fridge, bottles in stock and a minimum, with its own column names. */
export const LabReagents: Story = {
  name: 'Lab reagents',
  args: {
    rows: REAGENTS,
    categories: ['Acids', 'Buffers', 'Solvents', 'Stains'],
    copy: {
      title: 'Reagent stock',
      description: (rows, units, value) => `${rows} reagents · ${units} bottles · ${value} in stock`,
      noun: 'reagents',
      columns: { row: 'Row', ref: 'Catalog no.', name: 'Reagent', category: 'Kind', location: 'Where', quantity: 'Bottles', threshold: 'Minimum', unitValue: 'Price', value: 'Value' },
      low: 'Below minimum',
      lowCount: (count) => `${count} below minimum`,
      total: 'Totals',
      emptyTitle: 'No reagents yet',
    },
  },
}
