import { act, createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { UploadTray, UPLOAD_TRAY_COPY, useUploadTray, type UploadTrayContext } from './upload-tray'
import { FieldPhotos } from './upload-tray.stories'

const MB = 1024 * 1024
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const file = (name: string, size = 4 * MB) => Object.defineProperty(new File(['x'], name, { type: 'image/png' }), 'size', { value: size }) as File
const tray = () => screen.getByRole('region', { name: 'Uploads' })
const header = () => within(tray()).getAllByRole('button')[0]!

/** A page with its own button that sends files to the tray. */
function Page({ files }: { files: File[] }) {
  const { add } = useUploadTray()
  return (
    <button type="button" onClick={() => add(files)}>
      Send
    </button>
  )
}

/** An upload you move and finish by hand. */
function controlled() {
  const calls: { file: File; context: UploadTrayContext; resolve: (v?: unknown) => void; reject: (e: unknown) => void }[] = []
  const onUpload = vi.fn((f: File, context: UploadTrayContext) => new Promise((resolve, reject) => calls.push({ file: f, context, resolve, reject })))
  return { calls, onUpload }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Upload tray block', () => {
  test('shows the demo queue: what moves, what waits to retry, what’s in', () => {
    reduced(<UploadTray />)
    expect(header()).toHaveTextContent('Uploading 5 files')
    expect(header()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    expect(screen.getByText(/^Retrying in 5 sec · try 3 of 4$/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause autumn-campaign-film.mov' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'autumn-campaign-film.mov' })).toHaveAttribute('aria-valuenow', '61')
    expect(screen.getByRole('button', { name: 'Remove ridge-kettle-rose.webp from the list' })).toBeInTheDocument()
  })

  test('files sent from the page upload a few at a time, from their offset, and settle', async () => {
    const { calls, onUpload } = controlled()
    const onComplete = vi.fn()
    reduced(
      <UploadTray defaultItems={[]} concurrency={2} onUpload={onUpload} onComplete={onComplete}>
        <Page files={[file('a.png'), file('b.png'), file('c.png')]} />
      </UploadTray>,
    )
    expect(screen.queryByRole('region', { name: 'Uploads' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[0]!.context).toMatchObject({ offset: 0, attempt: 1 })
    expect(header()).toHaveTextContent('Uploading 3 files')
    act(() => calls[0]!.context.onProgress(2 * MB))
    expect(screen.getByRole('progressbar', { name: 'a.png' })).toHaveAttribute('aria-valuenow', '50')
    await act(async () => calls[0]!.resolve({ key: 'a' }))
    await waitFor(() => expect(calls).toHaveLength(3))
    await act(async () => {
      calls[1]!.resolve()
      calls[2]!.resolve()
    })
    await waitFor(() => expect(header()).toHaveTextContent('3 uploads complete'))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0]![0]).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'a.png', status: 'done', result: { key: 'a' } })]),
    )
  })

  test('pausing aborts the upload; resuming starts again from the bytes stored', async () => {
    const { calls, onUpload } = controlled()
    reduced(
      <UploadTray defaultItems={[]} onUpload={onUpload}>
        <Page files={[file('film.mov', 10 * MB)]} />
      </UploadTray>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    act(() => calls[0]!.context.onProgress(6 * MB))
    fireEvent.click(screen.getByRole('button', { name: 'Pause film.mov' }))
    expect(calls[0]!.context.signal.aborted).toBe(true)
    expect(await screen.findByText(/^Paused · 6 MB of 10 MB$/)).toBeInTheDocument()
    expect(header()).toHaveTextContent('1 upload paused')
    fireEvent.click(screen.getByRole('button', { name: 'Resume film.mov' }))
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1]!.context.offset).toBe(6 * MB)
  })

  test('a failure retries itself with a countdown, then stops with its reason and Retry', async () => {
    const { calls, onUpload } = controlled()
    reduced(
      <UploadTray defaultItems={[]} retryDelays={[60]} onUpload={onUpload}>
        <Page files={[file('a.png')]} />
      </UploadTray>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    await act(async () => calls[0]!.reject(new Error('Gateway timeout')))
    expect(screen.getByText(/^Retrying in 1 sec · try 2 of 2$/)).toBeInTheDocument()
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1]!.context.attempt).toBe(2)
    await act(async () => calls[1]!.reject(new Error('Gateway timeout')))
    expect(screen.getByText('Didn’t upload: Gateway timeout')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry a.png' }))
    await waitFor(() => expect(calls).toHaveLength(3))
    expect(calls[2]!.context.attempt).toBe(1)
  })

  test('offline, what moves waits and says so; back online it carries on', async () => {
    const { calls, onUpload } = controlled()
    const onLine = vi.spyOn(navigator, 'onLine', 'get')
    reduced(
      <UploadTray defaultItems={[]} onUpload={onUpload}>
        <Page files={[file('a.png')]} />
      </UploadTray>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    act(() => calls[0]!.context.onProgress(MB))
    onLine.mockReturnValue(false)
    act(() => void window.dispatchEvent(new Event('offline')))
    expect(calls[0]!.context.signal.aborted).toBe(true)
    expect(header()).toHaveTextContent('Waiting for a connection')
    expect(screen.getByText('You’re offline. Uploads will resume when you’re back.')).toBeInTheDocument()
    onLine.mockReturnValue(true)
    act(() => void window.dispatchEvent(new Event('online')))
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1]!.context.offset).toBe(MB)
  })

  test('files dropped anywhere on the page upload; the veil shows while they’re over it', async () => {
    const { calls, onUpload } = controlled()
    reduced(<UploadTray defaultItems={[]} onUpload={onUpload} copy={{ destination: 'Brand assets' }} />)
    const data = { types: ['Files'], files: [file('logo.png')], items: [{ kind: 'file', type: 'image/png', webkitGetAsEntry: () => null }] }
    const veil = document.querySelector('[data-slot=upload-tray-drop]')!
    fireEvent.dragEnter(document.body, { dataTransfer: data })
    expect(veil).toHaveAttribute('data-state', 'open')
    expect(veil).toHaveTextContent('Files go to Brand assets1 file')
    const drop = createEvent.drop(document.body, { dataTransfer: data })
    fireEvent(document.body, drop)
    expect(drop.defaultPrevented).toBe(true)
    expect(veil).toHaveAttribute('data-state', 'closed')
    await waitFor(() => expect(calls.map((c) => c.file.name)).toEqual(['logo.png']))
  })

  test('closing mid-upload asks first; cancelling stops everything', async () => {
    const user = userEvent.setup()
    const { calls, onUpload } = controlled()
    reduced(
      <UploadTray defaultItems={[]} onUpload={onUpload}>
        <Page files={[file('a.png')]} />
      </UploadTray>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    await user.click(within(tray()).getByRole('button', { name: 'Close' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Cancel 1 upload?' })
    await user.click(within(dialog).getByRole('button', { name: 'Keep uploading' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(calls[0]!.context.signal.aborted).toBe(false)
    await user.click(within(tray()).getByRole('button', { name: 'Close' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancel uploads' }))
    expect(calls[0]!.context.signal.aborted).toBe(true)
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Uploads' })).toBeNull())
  })

  test('the header folds the list away; real files in flight guard the page, the demo’s don’t', async () => {
    const onExpandedChange = vi.fn()
    const { calls, onUpload } = controlled()
    const view = reduced(<UploadTray onExpandedChange={onExpandedChange} />)
    fireEvent.click(header())
    expect(header()).toHaveAttribute('aria-expanded', 'false')
    expect(onExpandedChange).toHaveBeenCalledWith(false)
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(false)
    view.unmount()

    reduced(
      <UploadTray defaultItems={[]} onUpload={onUpload}>
        <Page files={[file('a.png')]} />
      </UploadTray>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    const leave = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(leave)
    expect(leave.defaultPrevented).toBe(true)
  })

  test('copy and locale write its words and numbers; useUploadTray needs the tray', () => {
    reduced(<UploadTray locale="de-DE" copy={{ uploading: (n) => `${n} Dateien werden hochgeladen` }} />)
    expect(header()).toHaveTextContent('5 Dateien werden hochgeladen')
    expect(screen.getByText(/^1,4 GB von|^1,4 GB of 2,3 GB/)).toBeInTheDocument()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Page files={[]} />)).toThrow('useUploadTray() needs an UploadTray around it')
    expect(UPLOAD_TRAY_COPY.allDone(2)).toBe('All 2 uploads complete')
  })
})

describe('Upload tray block: Field photos story', () => {
  test('a site inspector’s queue: its destination, region, slow retries and wording come from props', () => {
    reduced(<UploadTray {...FieldPhotos.args} />)
    expect(screen.getByRole('region', { name: 'Site uploads' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel IMG_2043-rebar-spacing.jpg' })).toBeInTheDocument()
    expect(screen.getByText(/^Retrying in \d+ sec · try 2 of 4$/)).toBeInTheDocument()
    expect(screen.queryByText('Demo data')).not.toBeInTheDocument()
  })
})
