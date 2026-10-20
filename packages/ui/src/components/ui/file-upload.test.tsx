import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload, formatBytes, type UploadContext } from './file-upload'

const file = (name: string, size = 1000, type = name.endsWith('.png') ? 'image/png' : 'application/pdf') =>
  new File([new Uint8Array(size)], name, { type })

const picker = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type=file]')!

/** An upload the test settles by hand. */
function deferredUploads() {
  const calls: { file: File; ctx: UploadContext; resolve: () => void; reject: (e: Error) => void }[] = []
  const onUpload = vi.fn(
    (f: File, ctx: UploadContext) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ file: f, ctx, resolve, reject })
      }),
  )
  return { calls, onUpload }
}

describe('FileUpload', () => {
  const { createObjectURL, revokeObjectURL } = URL
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => {
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
  })

  test('image previews are released when their file is removed', async () => {
    const user = userEvent.setup()
    const { container } = render(<FileUpload />)
    await user.upload(picker(container), [file('photo.png')])
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:preview')
    await user.click(screen.getByRole('button', { name: 'Remove photo.png' }))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
    expect(screen.getByRole('button', { name: /drop files/i })).toHaveFocus()
  })

  test('the drop zone is a button that opens the picker, described by its rules', async () => {
    const user = userEvent.setup()
    const { container } = render(<FileUpload accept=".png,.pdf" maxSize={5 * 1024 * 1024} maxFiles={3} />)
    const zone = screen.getByRole('button', { name: /drop files here or browse/i })
    expect(zone).toHaveAccessibleDescription('PNG or PDF · up to 5 MB each · 3 files max')
    const click = vi.spyOn(picker(container), 'click')
    zone.focus()
    await user.keyboard('{Enter}')
    expect(click).toHaveBeenCalledOnce()
  })

  test('uploads each accepted file with progress, then marks it uploaded', async () => {
    const user = userEvent.setup()
    const { calls, onUpload } = deferredUploads()
    const { container } = render(<FileUpload onUpload={onUpload} />)
    await user.upload(picker(container), [file('receipt.png'), file('invoice.pdf')])
    const list = screen.getByRole('list', { name: 'Files' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(2))
    expect(calls[0]!.ctx.signal).toBeInstanceOf(AbortSignal)

    act(() => calls[0]!.ctx.onProgress(40))
    expect(screen.getByRole('progressbar', { name: 'receipt.png' })).toHaveAttribute('aria-valuenow', '40')

    await act(async () => calls[0]!.resolve())
    expect(screen.queryByRole('progressbar', { name: 'receipt.png' })).not.toBeInTheDocument()
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent('Uploaded')
    expect(screen.getByText('receipt.png uploaded')).toBeInTheDocument()
  })

  test('explains every rejected file in one alert', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const { container } = render(<FileUpload accept=".png" maxSize={2000} />)
    await user.upload(picker(container), [file('setup.exe', 10, 'application/x-msdownload'), file('huge.png', 5000), file('ok.png')])
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('setup.exe isn’t a supported file type (PNG).')
    expect(alert).toHaveTextContent('huge.png is 4.9 kB; the limit is 2 kB.')
    expect(screen.getAllByRole('listitem').filter((li) => li.closest('[aria-label=Files]'))).toHaveLength(1)
  })

  test('holds to maxFiles and skips duplicates', async () => {
    const user = userEvent.setup()
    const { container } = render(<FileUpload maxFiles={2} />)
    const a = file('a.pdf')
    await user.upload(picker(container), [a])
    await user.upload(picker(container), [a, file('b.pdf'), file('c.pdf')])
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('a.pdf is already added.')
    expect(alert).toHaveTextContent('c.pdf wasn’t added: 2 files at most.')
    expect(screen.getByRole('button', { name: /drop files/i })).toBeDisabled()
  })

  test('removing a file mid-upload aborts it and keeps focus in the list', async () => {
    const user = userEvent.setup()
    const { calls, onUpload } = deferredUploads()
    const { container } = render(<FileUpload onUpload={onUpload} />)
    await user.upload(picker(container), [file('a.pdf'), file('b.pdf')])
    await waitFor(() => expect(calls).toHaveLength(2))
    await user.click(screen.getByRole('button', { name: 'Cancel upload of a.pdf' }))
    expect(calls[0]!.ctx.signal.aborted).toBe(true)
    expect(screen.getByRole('button', { name: 'Cancel upload of b.pdf' })).toHaveFocus()
  })

  test('a failed upload shows its error and retries', async () => {
    const user = userEvent.setup()
    const { calls, onUpload } = deferredUploads()
    const { container } = render(<FileUpload onUpload={onUpload} />)
    await user.upload(picker(container), [file('a.pdf')])
    await waitFor(() => expect(calls).toHaveLength(1))
    await act(async () => calls[0]!.reject(new Error('Connection lost')))
    expect(screen.getByText('Connection lost')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry a.pdf' }))
    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('progressbar', { name: 'a.pdf' })).toBeInTheDocument()
  })

  test('accepts files dropped on the zone', () => {
    render(<FileUpload />)
    const zone = screen.getByRole('button', { name: /drop files/i })
    const dataTransfer = { types: ['Files'], files: [file('dropped.pdf')], dropEffect: 'none' }
    fireEvent.dragEnter(zone, { dataTransfer })
    expect(zone).toHaveAttribute('data-dragging')
    fireEvent.drop(zone, { dataTransfer })
    expect(zone).not.toHaveAttribute('data-dragging')
    expect(screen.getByText('dropped.pdf')).toBeInTheDocument()
  })

  test('the gallery lists images as tiles with the zone last', async () => {
    const user = userEvent.setup()
    const { container } = render(<FileUpload variant="gallery" accept="image/*" />)
    await user.upload(picker(container), [file('one.png'), file('two.png')])
    const grid = screen.getByRole('list', { name: 'Images' })
    expect(within(grid).getAllByRole('listitem')).toHaveLength(2)
    expect(within(grid).getByRole('button', { name: /^Add/ })).toBeInTheDocument()
  })
})

test('formatBytes', () => {
  expect(formatBytes(512)).toBe('512 bytes')
  expect(formatBytes(1536)).toBe('1.5 kB')
  expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB')
  expect(formatBytes(38 * 1024 * 1024)).toBe('38 MB')
})
