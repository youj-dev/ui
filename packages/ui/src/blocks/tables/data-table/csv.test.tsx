import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { createDataTableColumnHelper } from '../../../components/ui/data-table'
import { DataTable } from '../data-table'

interface Item {
  id: string
  name: string
  price: number
  secret: string
}
const ITEMS: Item[] = [
  { id: '1', name: 'Chair', price: 120, secret: 's1' },
  { id: '2', name: 'Desk, oak', price: 480, secret: 's2' },
  { id: '3', name: 'Lamp', price: 60, secret: 's3' },
]
const col = createDataTableColumnHelper<Item>()
const COLUMNS = col.columns([
  col.accessor('name', { header: 'Item' }),
  col.accessor('price', { header: 'Price', meta: { numeric: true, label: 'Price (USD)', exportValue: (v) => (v as number).toFixed(2) } }),
  col.accessor('secret', { header: 'Secret', meta: { exportable: false } }),
])

function Harness() {
  return (
    <YoujProvider reducedMotion="always">
      <DataTable<Item> label="Items" rows={ITEMS} columns={COLUMNS} getRowId={(i) => i.id} paginated={false} showDensityToggle={false} enableRowSelection exportable={{ filename: 'items' }} />
    </YoujProvider>
  )
}

describe('export buttons', () => {
  test('the toolbar exports every row and the selection bar exports the selection, as a UTF-8 CSV with a BOM', async () => {
    const user = userEvent.setup()
    const blobs: Blob[] = []
    const names: string[] = []
    const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return 'blob:csv'
    })
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download)
    })
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Export' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select Lamp' }))
    const bar = screen.getByRole('group', { name: 'Selection actions' })
    await user.click(within(bar).getByRole('button', { name: 'Export' }))
    expect(names).toEqual(['items.csv', 'items.csv'])
    // text() drops a BOM while decoding, so the bytes are read directly.
    const bytes = new Uint8Array(await blobs[0]!.arrayBuffer())
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    const [all, selected] = await Promise.all(blobs.map((b) => b.text()))
    expect(all!.split('\r\n')).toHaveLength(4)
    expect(selected).toBe('Item,Price (USD)\r\nLamp,60.00')
    expect(blobs[0]!.type).toBe('text/csv;charset=utf-8')
    create.mockRestore()
    revoke.mockRestore()
    click.mockRestore()
  })
})
