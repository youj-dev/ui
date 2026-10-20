import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FileManager } from './file-manager'
import { formatSize, MB } from './file-manager/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

beforeAll(() => {
  Element.prototype.scrollIntoView ??= () => {}
})

describe('file manager block', () => {
  test('names its landmarks: folders tree, breadcrumb, files and storage', () => {
    reduced(<FileManager embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /Stash/ })).toBeInTheDocument()
    expect(screen.getByRole('tree', { name: 'Folders' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Autumn 26')
    expect(screen.getByRole('region', { name: 'Storage' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Files' })).getAllByRole('listitem')).toHaveLength(8)
  })

  test('by default, a page of the app’s frame: the shared page header holds the title, search and Upload, with no top bar of its own', () => {
    const { container } = reduced(<FileManager />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: /Stash/ }))
    expect(header).toContainElement(screen.getByRole('button', { name: /Upload/ }))
    expect(header).toContainElement(screen.getByRole('searchbox', { name: 'Search this folder' }))
    expect(screen.getByRole('tree', { name: 'Folders' })).toBeInTheDocument()
  })

  test('each tile shows a decorative scene picked for its file, with its type or running time', () => {
    reduced(<FileManager />)
    const tiles = within(screen.getByRole('list', { name: 'Files' })).getAllByRole('listitem')
    const hero = tiles.find((t) => t.textContent?.includes('Hero, dusk.jpg'))!
    expect(hero.querySelector('[data-illustration="mountain"]')).toHaveAttribute('aria-hidden', 'true')
    expect(hero).toHaveTextContent('JPG')
    const clip = tiles.find((t) => t.textContent?.includes('Cutdown 15s.mp4'))!
    expect(clip.querySelector('[data-illustration="video"]')).not.toBeNull()
    expect(clip).toHaveTextContent('0:15')
  })

  test('selecting files raises the bulk bar, and deleting removes them', async () => {
    const user = userEvent.setup()
    reduced(<FileManager />)
    // Hidden, the bar is inert: out of the tab order and the accessibility tree.
    const bar = document.querySelector<HTMLElement>('[aria-label="Selection"]')!
    expect(bar).toHaveAttribute('inert')
    await user.click(screen.getByRole('checkbox', { name: 'Select Scripts.docx' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select Storyboard.pdf' }))
    expect(bar).not.toHaveAttribute('inert')
    expect(screen.getByRole('region', { name: 'Selection' })).toBe(bar)
    expect(bar).toHaveTextContent('2 selected')
    await user.click(within(bar).getByRole('button', { name: 'Delete selected' }))
    await waitFor(() => expect(screen.queryByText('Scripts.docx')).not.toBeInTheDocument())
    expect(within(screen.getByRole('list', { name: 'Files' })).getAllByRole('listitem')).toHaveLength(6)
  })

  test('opening a file shows its preview with a share link', async () => {
    const user = userEvent.setup()
    reduced(<FileManager defaultView="list" />)
    await user.click(screen.getByRole('button', { name: 'Media plan.xlsx' }))
    const sheet = await screen.findByRole('dialog', { name: 'Media plan.xlsx' })
    expect(within(sheet).getByText('Noor Haddad')).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Copy link' }))
    expect(within(sheet).getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })
})

describe('file manager block: your data', () => {
  const now = Date.UTC(2027, 0, 10, 12)
  const folders = [
    { id: 'raw', name: 'Raw exports' },
    { id: 'models', name: 'Models', children: [{ id: 'churn', name: 'Churn' }] },
  ]
  const files = [
    { id: 'a', name: 'orders.csv', folder: 'raw', kind: 'sheet' as const, size: 2_000_000, modified: now, owner: 'Rui Costa' },
    { id: 'b', name: 'events.parquet', folder: 'raw', kind: 'archive' as const, size: 9_000_000, modified: now - 86_400_000, owner: 'Rui Costa' },
    { id: 'c', name: 'churn.ipynb', folder: 'churn', kind: 'doc' as const, size: 300_000, modified: now, owner: 'Lena Ott' },
  ]
  const yours = { brand: { name: 'Quarry' }, folders, files, now, storage: [{ label: 'Tables', bytes: 5 * 1024 ** 3, tone: 'bg-accent' }], quota: 20 * 1024 ** 3 }

  test('files, folders, brand and copy drive what renders', () => {
    reduced(<FileManager embedded={false} {...yours} defaultView="list" copy={{ files: 'Datasets', storageOf: (gb) => `/ ${gb} GB` }} />)
    expect(screen.getByRole('heading', { level: 1, name: /Quarry/ })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Raw exports')
    expect(within(screen.getByRole('list', { name: 'Datasets' })).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('yesterday')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Storage' })).toHaveTextContent('/ 20 GB')
  })

  test('the folder is controllable, and opening one reports it', async () => {
    const user = userEvent.setup()
    const onFolderChange = vi.fn()
    const { rerender } = reduced(<FileManager {...yours} folder="churn" onFolderChange={onFolderChange} />)
    expect(screen.getByText('churn.ipynb')).toBeInTheDocument()
    await user.click(within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('button', { name: 'Quarry' }))
    expect(onFolderChange).toHaveBeenCalledWith('raw')
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Churn')
    rerender(
      <YoujProvider reducedMotion="always">
        <FileManager {...yours} folder="raw" onFolderChange={onFolderChange} />
      </YoujProvider>,
    )
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Raw exports')
    expect(screen.getByText('orders.csv')).toBeInTheDocument()
  })

  test('onDelete gets the files; a rejection puts them back', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn(() => Promise.reject(new Error('Read-only bucket')))
    reduced(<FileManager {...yours} onDelete={onDelete} />)
    await user.click(screen.getByRole('checkbox', { name: 'Select orders.csv' }))
    await user.click(screen.getByRole('button', { name: 'Delete selected' }))
    expect(onDelete).toHaveBeenCalledWith([files[0]])
    expect(await screen.findByText('Read-only bucket')).toBeInTheDocument()
    expect(screen.getByText('orders.csv')).toBeInTheDocument()
  })

  test('onUpload receives the file and folder; what it resolves with lands in the list', async () => {
    const user = userEvent.setup()
    const stored = { id: 'd', name: 'refunds.csv', folder: 'raw', kind: 'sheet' as const, size: 4096, modified: now, owner: 'Quarry bot' }
    const onUpload = vi.fn(async (_file: File, _folder: string, progress: (p: number) => void) => {
      progress(50)
      return stored
    })
    const { container } = reduced(<FileManager {...yours} onUpload={onUpload} />)
    const file = new File(['id,amount'], 'refunds.csv', { type: 'text/csv' })
    await user.upload(container.querySelector<HTMLInputElement>('input[type=file]')!, file)
    expect(onUpload).toHaveBeenCalledWith(file, 'raw', expect.any(Function))
    expect(await screen.findByRole('button', { name: 'refunds.csv' })).toBeInTheDocument()
  })

  test('loading shows skeletons; an error offers a retry; empty replaces an empty folder', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<FileManager {...yours} loading />)
    expect(screen.queryByRole('list', { name: 'Files' })).not.toBeInTheDocument()
    const again = (props: Partial<React.ComponentProps<typeof FileManager>>) =>
      rerender(
        <YoujProvider reducedMotion="always">
          <FileManager {...yours} {...props} />
        </YoujProvider>,
      )
    again({ error: 'The bucket is unreachable.', onRetry })
    expect(screen.getByText('The bucket is unreachable.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
    again({ files: [], empty: <p>Connect a source to begin</p> })
    expect(screen.getByText('Connect a source to begin')).toBeInTheDocument()
  })
})

describe('file manager locale', () => {
  test('sizes follow the app locale: a German app reads 18,2 MB', () => {
    expect(formatSize(18.2 * MB, 'en-US')).toBe('18.2 MB')
    expect(formatSize(18.2 * MB, 'de-DE')).toBe('18,2 MB')
    expect(formatSize(0.04 * MB, 'de-DE')).toBe('41 kB')
    expect(formatSize(2.5 * 1024 * MB, 'de-DE')).toMatch(/^2,5\sGB$/)
  })

  test('tiles show German sizes under a German provider', () => {
    render(
      <YoujProvider locale="de-DE" reducedMotion="always">
        <FileManager />
      </YoujProvider>,
    )
    expect(within(screen.getByRole('list', { name: 'Files' })).getAllByText(/\d,\d MB/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/\d\.\d MB/)).toBeNull()
  })
})
