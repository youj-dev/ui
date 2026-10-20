import { renderHook } from '@testing-library/react'
import { useTable, type SortingState } from '@tanstack/react-table'
import { csvCell, downloadCsv, dataTableToCsv, toCsv } from './data-table-csv'
import { createDataTableColumnHelper, dataTableFeatures } from './data-table-model'

describe('csvCell', () => {
  test('quotes a value holding a delimiter, a quote or a line break, doubling its quotes', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell('Hopper, Grace')).toBe('"Hopper, Grace"')
    expect(csvCell('Ada "The Countess"')).toBe('"Ada ""The Countess"""')
    expect(csvCell('two\nlines')).toBe('"two\nlines"')
  })

  test('writes numbers raw, dates as ISO and nothing for empty values', () => {
    expect(csvCell(-12.5)).toBe('-12.5')
    expect(csvCell(new Date('2026-09-26T14:00:00Z'))).toBe('2026-09-26T14:00:00.000Z')
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
    expect(csvCell(true)).toBe('true')
  })

  test('defuses text that a spreadsheet would run as a formula', () => {
    expect(csvCell('=HYPERLINK("https://example.com")')).toBe('"\'=HYPERLINK(""https://example.com"")"')
    expect(csvCell('+1')).toBe("'+1")
    expect(csvCell('-2')).toBe("'-2")
    expect(csvCell('@sum')).toBe("'@sum")
    expect(csvCell('\tx')).toBe("'\tx")
  })

  test('joins rows with CRLF under a header', () => {
    expect(toCsv(['a', 'b'], [[1, 'x,y']])).toBe('a,b\r\n1,"x,y"')
  })
})

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

function useItems(sorting: SortingState) {
  return useTable({ features: dataTableFeatures, data: ITEMS, columns: COLUMNS, getRowId: (i) => i.id, state: { sorting } })
}

describe('dataTableToCsv', () => {
  test('exports the rows in view order, with column labels, skipping structural and opted-out columns', () => {
    const { result } = renderHook(() => useItems([{ id: 'price', desc: true }]))
    const table = result.current
    expect(dataTableToCsv(table, table.getPrePaginatedRowModel().rows)).toBe(['Item,Price (USD)', '"Desk, oak",480.00', 'Chair,120.00', 'Lamp,60.00'].join('\r\n'))
  })
})

describe('downloadCsv', () => {
  test('downloadCsv names the file and cleans up its anchor', () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadCsv('a,b', 'report')
    expect(click).toHaveBeenCalledTimes(1)
    expect(document.querySelector('a[download]')).not.toBeInTheDocument()
    create.mockRestore()
    click.mockRestore()
  })
})
