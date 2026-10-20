import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ImportMapper, type ImportMapperProps } from './import-mapper'

const reduced = (props: ImportMapperProps = {}) =>
  render(
    <YoujProvider reducedMotion="always">
      <ImportMapper {...props} />
    </YoujProvider>,
  )
type User = ReturnType<typeof userEvent.setup>
const screenIs = (name: 'choose' | 'map' | 'result') =>
  waitFor(() => expect(document.querySelector(`[data-yj-screen="${name}"]`)).toBeInTheDocument())
const toMap = async (user: User) => {
  await user.click(screen.getByRole('button', { name: 'Use sample' }))
  await screenIs('map')
}
const importButton = (name: string) => screen.getByRole('button', { name })
const upload = (user: User, text: string, name = 'data.csv') =>
  user.upload(document.querySelector('input[type=file]') as HTMLInputElement, new File([text], name, { type: 'text/csv' }))

describe('ImportMapper block', () => {
  test('starts with a drop zone and the sample, no stepper', () => {
    reduced()
    expect(screen.getByRole('heading', { level: 2, name: 'Import data' })).toBeInTheDocument()
    expect(screen.getByText('Drop a CSV file here')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use sample' })).toBeInTheDocument()
    expect(screen.queryByText(/Step \d of/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
  })

  test('reading the file lands on the mapping: the file, each column with a sample, quiet confident matches', async () => {
    const user = userEvent.setup()
    reduced()
    await toMap(user)
    const file = document.querySelector('[data-slot=import-mapper-file]') as HTMLElement
    expect(file).toHaveTextContent('contacts-sample.csv')
    expect(file).toHaveTextContent(/48 rows · 7 columns · \d/)
    expect(screen.getByRole('combobox', { name: 'Full Name' })).toHaveValue('name')
    expect(screen.getByRole('combobox', { name: 'E-mail' })).toHaveValue('email')
    expect(screen.getByRole('combobox', { name: 'Organisation' })).toHaveValue('company')
    expect(screen.getByRole('combobox', { name: 'Notes' })).toHaveValue('')
    expect(screen.getByText('Ada Okafor')).toBeInTheDocument()
    expect(screen.queryByText(/match$/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Check')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  test('the button says what will happen, and the problems are listed in plain words', async () => {
    const user = userEvent.setup()
    reduced()
    await toMap(user)
    expect(importButton('Import 44 contacts')).toBeEnabled()
    expect(screen.getByText('Email is invalid in 1 row')).toBeInTheDocument()
    expect(screen.getByText('Name is missing in 1 row')).toBeInTheDocument()
    expect(screen.getByText('Deal value is invalid in 1 row')).toBeInTheDocument()
    expect(screen.getByText('Customer since is invalid in 1 row')).toBeInTheDocument()
    expect(screen.getByText('4 contacts already exist')).toBeInTheDocument()
    expect(screen.queryByText(/detect/i)).not.toBeInTheDocument()
  })

  test('a required field with no column is called out, with a picker, and the button says why it is off', async () => {
    const user = userEvent.setup()
    reduced()
    await toMap(user)
    await user.selectOptions(screen.getByRole('combobox', { name: 'E-mail' }), '')
    expect(screen.getByText('Email isn’t matched yet')).toBeInTheDocument()
    expect(screen.getByText('Match Email to import.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Import/ })).toBeDisabled()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Column for Email' }), 'E-mail')
    expect(screen.queryByText('Email isn’t matched yet')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'E-mail' })).toHaveValue('email')
    expect(screen.getByRole('button', { name: /^Import/ })).toBeEnabled()
  })

  test('choosing a field already taken moves it from the other column', async () => {
    const user = userEvent.setup()
    reduced()
    await toMap(user)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Notes' }), 'email')
    expect(screen.getByRole('combobox', { name: 'E-mail' })).toHaveValue('')
  })

  test('only a guessed match is marked "Check"', async () => {
    const user = userEvent.setup()
    reduced()
    await upload(user, 'Customer name,Reach,Joined\nAda,ada@x.io,2026-01-02\nGrace,grace@x.io,2026-02-03\n')
    await screenIs('map')
    expect(screen.getByRole('combobox', { name: 'Reach' })).toHaveValue('email')
    expect(screen.getByRole('combobox', { name: 'Reach' })).toHaveAccessibleDescription(/Check/)
    expect(screen.getByRole('combobox', { name: 'Joined' })).not.toHaveAccessibleDescription(/Check/)
  })

  test('Skip them takes a problem out of the list and the rows out of the import, and Undo brings them back', async () => {
    const user = userEvent.setup()
    reduced()
    await toMap(user)
    const line = screen.getByText('Email is invalid in 1 row').closest('li') as HTMLElement
    await user.click(within(line).getByRole('button', { name: 'Skip it' }))
    expect(screen.queryByText('Email is invalid in 1 row')).not.toBeInTheDocument()
    expect(screen.getByText('1 row skipped')).toBeInTheDocument()
    expect(importButton('Import 44 contacts')).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('Email is invalid in 1 row')).toBeInTheDocument()
  })

  test('Review lists only those rows with the one wrong value; fixing it updates the count and the button', async () => {
    const user = userEvent.setup()
    reduced()
    await toMap(user)
    const line = screen.getByText('Email is invalid in 1 row').closest('li') as HTMLElement
    await user.click(within(line).getByRole('button', { name: 'Review' }))
    const sheet = await screen.findByRole('dialog', { name: 'Email is invalid in 1 row' })
    expect(within(sheet).getAllByRole('textbox')).toHaveLength(1)
    expect(within(sheet).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(within(sheet).getByText('Row 7')).toBeInTheDocument()
    const bad = within(sheet).getByRole('textbox', { name: 'Email, row 7' })
    expect(bad).toBeInvalid()
    expect(bad).toHaveAccessibleDescription('Enter a valid email address.')
    expect(within(sheet).getByText('1 row left to fix')).toBeInTheDocument()
    await user.clear(bad)
    await user.type(bad, 'sam.ortiz@example.com')
    expect(within(sheet).getByRole('textbox', { name: 'Email, row 7' })).toBeValid()
    expect(within(sheet).getByText('Looks good')).toBeInTheDocument()
    expect(within(sheet).getAllByText('Everything looks good.').length).toBeGreaterThan(0)
    await user.click(within(sheet).getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Email is invalid in 1 row')).not.toBeInTheDocument()
    expect(importButton('Import 45 contacts')).toBeEnabled()
    expect(document.activeElement).toHaveAttribute('data-yj-review')
  })

  test('a row can be skipped from the review, and the card keeps its place', async () => {
    const user = userEvent.setup()
    reduced()
    await toMap(user)
    const line = screen.getByText('Name is missing in 1 row').closest('li') as HTMLElement
    await user.click(within(line).getByRole('button', { name: 'Review' }))
    const sheet = await screen.findByRole('dialog')
    await user.click(within(sheet).getByRole('button', { name: 'Skip this row' }))
    expect(within(sheet).getByText('Skipped')).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Undo' }))
    expect(within(sheet).getByRole('textbox', { name: 'Name, row 15' })).toBeInvalid()
    await user.click(within(sheet).getByRole('button', { name: 'Skip this row' }))
    await user.click(within(sheet).getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('1 row skipped')).toBeInTheDocument()
  })

  test('duplicates are a question with a sensible default, and the key lives under More options', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn()
    reduced({ onImport })
    await toMap(user)
    expect(screen.getByRole('button', { name: 'Update' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(importButton('Import 40 contacts')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add as new' }))
    expect(importButton('Import 44 contacts')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await user.click(screen.getByRole('button', { name: 'More options' }))
    expect(await screen.findByRole('combobox', { name: 'Existing contacts are recognized by' })).toHaveValue('email')
    await user.click(importButton('Import 44 contacts'))
    await waitFor(() => expect(onImport).toHaveBeenCalled())
    const rows = onImport.mock.calls[0]![0] as { row: number; action: string; values: Record<string, string> }[]
    expect(rows).toHaveLength(44)
    expect(rows.filter((r) => r.action === 'update')).toHaveLength(4)
    expect(rows.every((r) => !([7, 15, 23, 31] as number[]).includes(r.row))).toBe(true)
    expect(rows[0]!.values).toMatchObject({ name: 'Ada Okafor', email: 'ada.okafor@northgate.example' })
    expect(onImport.mock.calls[0]![1]).toMatchObject({ keyField: 'email', policy: 'update' })
  })

  test('without duplicates or problems the summary is one calm line', async () => {
    const user = userEvent.setup()
    reduced()
    await upload(user, 'Name,Email\nAda,ada@x.io\nGrace,grace@x.io\n')
    await screenIs('map')
    expect(screen.getByText('Everything looks good.')).toBeInTheDocument()
    expect(screen.queryByText(/already exist/)).not.toBeInTheDocument()
    expect(importButton('Import 2 contacts')).toBeEnabled()
  })

  test('ends with what was imported and skipped, the skipped rows to download, another file and Done', async () => {
    const user = userEvent.setup()
    const create = vi.fn(() => 'blob:report')
    URL.createObjectURL = create
    URL.revokeObjectURL = vi.fn()
    const onDone = vi.fn()
    reduced({ onImport: () => ({ created: 30, updated: 10, skipped: 8 }), onDone })
    await toMap(user)
    await user.click(importButton('Import 44 contacts'))
    await screenIs('result')
    expect(await screen.findByRole('heading', { name: '40 contacts imported' })).toBeInTheDocument()
    expect(screen.getByText('10 updated · 8 skipped')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Download skipped rows' }))
    const blob = (create.mock.calls[0] as unknown as [Blob])[0]
    expect(await blob.text()).toContain('Row,Field,Value,Problem')
    expect(await blob.text()).toContain('7,Email,sam.ortiz@,Enter a valid email address.')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onDone).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Import another file' }))
    await screenIs('choose')
    expect(screen.getByRole('button', { name: 'Use sample' })).toBeInTheDocument()
  })

  test('a failed import says so and goes back to the mapping with everything kept', async () => {
    const user = userEvent.setup()
    reduced({ onImport: () => Promise.reject(new Error('server down')) })
    await toMap(user)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Notes' }), 'phone')
    await user.click(importButton('Import 44 contacts'))
    expect(await screen.findByText('The import stopped: server down')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await screenIs('map')
    expect(screen.getByRole('combobox', { name: 'Notes' })).toHaveValue('phone')
  })

  test('Remove returns to the drop zone', async () => {
    const user = userEvent.setup()
    reduced()
    await toMap(user)
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    await screenIs('choose')
    expect(screen.getByText('Drop a CSV file here')).toBeInTheDocument()
  })

  test('moves focus into each screen and announces the counts after a fix', async () => {
    const user = userEvent.setup()
    reduced()
    await toMap(user)
    await waitFor(() => expect(document.querySelector('[data-yj-screen="map"] [data-slot=import-mapper-file]')).toHaveFocus())
    await waitFor(() => expect(screen.getAllByRole('status').some((s) => /contacts-sample\.csv: 48 rows/.test(s.textContent ?? ''))).toBe(true))
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    await waitFor(() => expect(screen.getAllByRole('status').some((s) => s.textContent === '40 contacts will be imported. Skipped: 8.')).toBe(true))
  })

  test('a file with an unclosed quote stays on the drop zone with the problem', async () => {
    const user = userEvent.setup()
    reduced()
    await upload(user, 'name,email\nAda,"a@x.io\nGrace,g@x.io\n')
    expect(await screen.findByText('Line 2: a quoted value is never closed.')).toBeInTheDocument()
    expect(document.querySelector('[data-yj-screen="choose"]')).toBeInTheDocument()
  })

  test('refuses a file over the limit', async () => {
    const user = userEvent.setup({ applyAccept: false })
    reduced({ maxSize: 10 })
    await upload(user, 'name,email\nAda,a@x.io\n', 'big.csv')
    expect(await screen.findByText(/That file is 22.?B\. The limit is 10.?B\./)).toBeInTheDocument()
  })

  test('the app’s fields, key, existing values and copy drive the block', async () => {
    const user = userEvent.setup()
    const onImport = vi.fn()
    reduced({
      fields: [
        { id: 'sku', label: 'SKU', required: true, synonyms: ['item code'] },
        { id: 'qty', label: 'Quantity', type: 'number' },
      ],
      keyField: 'sku',
      existing: ['A1'],
      onImport,
      copy: { importMapperTitle: 'Import stock', importMapperItems: (n) => `${n} ${n === 1 ? 'item' : 'items'}` },
    })
    expect(screen.getByRole('heading', { name: 'Import stock' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Use sample' })).not.toBeInTheDocument()
    await upload(user, 'Item Code;Qty\nA1;5\nB2;x\nC3;7')
    await screenIs('map')
    expect(screen.getByRole('combobox', { name: 'Item Code' })).toHaveValue('sku')
    expect(screen.getByRole('combobox', { name: 'Qty' })).toHaveValue('qty')
    expect(screen.getByText('Quantity is invalid in 1 row')).toBeInTheDocument()
    expect(screen.getByText('1 contact already exists')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    await user.click(importButton('Import 1 item'))
    await waitFor(() => expect(onImport).toHaveBeenCalled())
    expect((onImport.mock.calls[0]![0] as { row: number }[]).map((r) => r.row)).toEqual([3])
  })

  describe('variant="dialog"', () => {
    const footer = () => document.querySelector('[data-slot=import-mapper-footer]') as HTMLElement

    test('shows the file and the column list with one footer, and no problems yet', async () => {
      const user = userEvent.setup()
      reduced({ variant: 'dialog' })
      await toMap(user)
      expect(document.querySelector('[data-slot=import-mapper-file]')).toHaveTextContent('contacts-sample.csv')
      expect(screen.getByRole('combobox', { name: 'E-mail' })).toHaveValue('email')
      expect(within(footer()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Start over', 'Continue'])
      expect(screen.queryByText('Email is invalid in 1 row')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Import/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    })

    test('Continue leads to the problems and the import, and Back returns to the columns', async () => {
      const user = userEvent.setup()
      const onImport = vi.fn()
      reduced({ variant: 'dialog', onImport })
      await toMap(user)
      await user.click(within(footer()).getByRole('button', { name: 'Continue' }))
      expect(screen.getByText('Email is invalid in 1 row')).toBeInTheDocument()
      expect(screen.getByText('4 contacts already exist')).toBeInTheDocument()
      expect(screen.queryByRole('combobox', { name: 'E-mail' })).not.toBeInTheDocument()
      expect(within(footer()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Back', 'Import 44 contacts'])
      await waitFor(() => expect(importButton('Import 44 contacts')).toHaveFocus())
      await user.click(within(footer()).getByRole('button', { name: 'Back' }))
      expect(screen.getByRole('combobox', { name: 'E-mail' })).toHaveValue('email')
      await user.click(within(footer()).getByRole('button', { name: 'Continue' }))
      await user.click(importButton('Import 44 contacts'))
      await waitFor(() => expect(onImport).toHaveBeenCalled())
      await screenIs('result')
    })

    test('Continue waits for a required field, and Start over goes back to choosing a file', async () => {
      const user = userEvent.setup()
      reduced({ variant: 'dialog' })
      await toMap(user)
      await user.selectOptions(screen.getByRole('combobox', { name: 'E-mail' }), '')
      expect(screen.getByText('Email isn’t matched yet')).toBeInTheDocument()
      expect(within(footer()).getByRole('button', { name: 'Continue' })).toBeDisabled()
      await user.selectOptions(screen.getByRole('combobox', { name: 'Column for Email' }), 'E-mail')
      expect(within(footer()).getByRole('button', { name: 'Continue' })).toBeEnabled()
      await user.click(within(footer()).getByRole('button', { name: 'Start over' }))
      await screenIs('choose')
    })
  })
})
