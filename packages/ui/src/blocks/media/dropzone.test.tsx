import { act, createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MediaDropzone, MEDIA_DROPZONE_COPY, type MediaDropzoneFile, type MediaDropzoneUploadContext } from './dropzone'
import { GrantApplication } from './dropzone.stories'

const MB = 1024 * 1024
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const zone = () => document.querySelector<HTMLButtonElement>('[data-slot=media-dropzone-zone]')!
const picker = () => document.querySelector<HTMLInputElement>('input[type=file]:not([webkitdirectory])')!
const sized = (file: File, size: number) => Object.defineProperty(file, 'size', { value: size })
const png = (name = 'photo.png') => new File(['png'], name, { type: 'image/png' })
const rows = () => screen.queryAllByRole('listitem').map((li) => li.textContent ?? '')

/** What a drag or drop hands over: files, and their entries when they're folders. */
function transfer(files: File[], entries?: unknown[]) {
  return {
    types: ['Files'],
    files,
    items: (entries ?? files).map((entry, i) => ({ kind: 'file', type: files[i]?.type ?? '', webkitGetAsEntry: () => (entries ? entry : null) })),
    dropEffect: 'none',
  }
}

const fileEntry = (file: File, fullPath: string) => ({
  isFile: true,
  isDirectory: false,
  name: file.name,
  fullPath,
  file: (ok: (f: File) => void) => ok(file),
})
/** A folder whose reader hands its entries over two at a time, then nothing, as Chrome's does in hundreds. */
const dirEntry = (name: string, fullPath: string, children: unknown[]) => ({
  isFile: false,
  isDirectory: true,
  name,
  fullPath,
  createReader: () => {
    let at = 0
    return {
      readEntries: (ok: (batch: unknown[]) => void) => {
        ok(children.slice(at, at + 2))
        at += 2
      },
    }
  },
})

/** An upload you finish by hand. */
function controlled() {
  const calls: { file: File; context: MediaDropzoneUploadContext; resolve: (v?: unknown) => void; reject: (e: unknown) => void }[] = []
  const onUpload = vi.fn(
    (file: File, context: MediaDropzoneUploadContext) => new Promise((resolve, reject) => calls.push({ file, context, resolve, reject })),
  )
  return { calls, onUpload }
}

describe('Drop zone block', () => {
  test('is a card named by its title; the zone is a button described by its rules', () => {
    reduced(<MediaDropzone />)
    expect(screen.getByRole('heading', { level: 2, name: 'Upload files' })).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /Drop files or folders here/ })
    expect(button).toBe(zone())
    expect(button).toHaveAccessibleDescription('JPG, PNG, WebP, MP4, MOV or PDF · up to 50 MB each · 200 MB in all')
    expect(rows().some((r) => r.includes('ridge-kettle-sage.webp') && r.includes('Uploaded'))).toBe(true)
    expect(rows().some((r) => r.includes('tea-set-on-tray.webp') && r.includes('Failed: The connection dropped at 58%.'))).toBe(true)
  })

  test('picking files adds the ones the rules take and gives each refusal its reason', async () => {
    const { calls, onUpload } = controlled()
    const onReject = vi.fn()
    reduced(<MediaDropzone defaultFiles={[]} onUpload={onUpload} onReject={onReject} />)
    fireEvent.change(picker(), {
      target: { files: [png(), new File(['x'], 'notes.pages'), sized(new File(['x'], 'huge.mp4', { type: 'video/mp4' }), 60 * MB)] },
    })
    const alert = (await screen.findByText('2 files weren’t added')).closest<HTMLElement>('[role=alert]')!
    expect(within(alert).getByText('notes.pages isn’t accepted. Use JPG, PNG, WebP, MP4, MOV or PDF.')).toBeInTheDocument()
    expect(within(alert).getByText('huge.mp4 is 60 MB, over the 50 MB limit.')).toBeInTheDocument()
    expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ name: 'notes.pages' }), expect.objectContaining({ name: 'huge.mp4' })])
    expect(zone().getAttribute('aria-describedby')).toContain(alert.id)
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0]!.file.name).toBe('photo.png')
    act(() => calls[0]!.context.onProgress(40))
    expect(screen.getByRole('progressbar', { name: 'Uploading photo.png, 40%' })).toBeInTheDocument()
    await act(async () => calls[0]!.resolve({ url: '/photo.png' }))
    expect(await screen.findByText('Uploaded')).toBeInTheDocument()
  })

  test('a pasted screenshot is named by the moment; a paste of text is left alone', async () => {
    const { calls, onUpload } = controlled()
    reduced(<MediaDropzone defaultFiles={[]} onUpload={onUpload} />)
    const pasted = createEvent.paste(zone(), { clipboardData: { files: [png('image.png')] } })
    fireEvent(zone(), pasted)
    expect(pasted.defaultPrevented).toBe(true)
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0]!.file.name).toMatch(/^Pasted image \d{4}-\d{2}-\d{2} \d{2}\.\d{2}\.\d{2}\.png$/)
    const text = createEvent.paste(zone(), { clipboardData: { files: [] } })
    fireEvent(zone(), text)
    expect(text.defaultPrevented).toBe(false)
  })

  test('a drag over the zone says how many files are coming and whether they’re accepted', () => {
    reduced(<MediaDropzone defaultFiles={[]} />)
    const zip = new File(['x'], 'a.zip', { type: 'application/zip' })
    fireEvent.dragEnter(zone(), { dataTransfer: transfer([png(), png('b.png')]) })
    expect(zone()).toHaveAttribute('data-state', 'over')
    expect(zone()).toHaveTextContent('Drop 2 filesLet go to add them')
    fireEvent.dragLeave(zone(), { dataTransfer: transfer([png(), png('b.png')]) })
    expect(zone()).toHaveTextContent('Drop files or folders here')
    fireEvent.dragEnter(zone(), { dataTransfer: transfer([png(), zip]) })
    expect(zone()).toHaveTextContent('Drop 2 files1 isn’t a type this accepts')
    fireEvent.dragLeave(zone(), { dataTransfer: transfer([png(), zip]) })
    fireEvent.dragEnter(zone(), { dataTransfer: transfer([zip]) })
    expect(zone()).toHaveAttribute('data-state', 'refused')
    expect(zone()).toHaveTextContent('These files aren’t accepted hereOnly JPG, PNG, WebP, MP4, MOV or PDF')
  })

  test('a dragged folder is read whole, in batches, keeping paths and leaving out system files', async () => {
    const { calls, onUpload } = controlled()
    reduced(<MediaDropzone defaultFiles={[]} onUpload={onUpload} />)
    const folder = dirEntry('shoot', '/shoot', [
      fileEntry(png('a.png'), '/shoot/a.png'),
      fileEntry(new File(['x'], '.DS_Store'), '/shoot/.DS_Store'),
      dirEntry('day-2', '/shoot/day-2', [fileEntry(png('b.png'), '/shoot/day-2/b.png')]),
    ])
    fireEvent.drop(zone(), { dataTransfer: transfer([], [folder]) })
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls.map((c) => [c.file.name, c.context.path])).toEqual([
      ['a.png', 'shoot'],
      ['b.png', 'shoot/day-2'],
    ])
    expect(await screen.findByText('Skipped 1 system file (like .DS_Store).')).toBeInTheDocument()
    expect(rows().some((r) => r.includes('shoot/day-2'))).toBe(true)
  })

  test('a drop that misses the zone never opens the file in the tab', () => {
    reduced(<MediaDropzone />)
    const drop = createEvent.drop(document.body, { dataTransfer: transfer([png()]) })
    fireEvent(document.body, drop)
    expect(drop.defaultPrevented).toBe(true)
  })

  test('removing cancels an upload in flight, and waits for onRemove on a stored file, moving focus on', async () => {
    const user = userEvent.setup()
    const { calls, onUpload } = controlled()
    let finish: () => void = () => {}
    const onRemove = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    const stored: MediaDropzoneFile[] = [
      { id: 'a', name: 'a.pdf', size: MB, type: 'application/pdf', status: 'done' },
      { id: 'b', name: 'b.pdf', size: MB, type: 'application/pdf', status: 'done' },
    ]
    reduced(<MediaDropzone defaultFiles={stored} onUpload={onUpload} onRemove={onRemove} />)
    fireEvent.change(picker(), { target: { files: [png()] } })
    await waitFor(() => expect(calls).toHaveLength(1))
    await user.click(screen.getByRole('button', { name: 'Cancel uploading photo.png' }))
    expect(calls[0]!.context.signal.aborted).toBe(true)
    await waitFor(() => expect(screen.queryByText('photo.png')).toBeNull())

    await user.click(screen.getByRole('button', { name: 'Remove a.pdf' }))
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
    expect(await screen.findByText('Removing…')).toBeInTheDocument()
    await act(async () => finish())
    await waitFor(() => expect(screen.queryByText('a.pdf')).toBeNull())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove b.pdf' })).toHaveFocus())
  })

  test('a failed upload says why, and Retry tries again', async () => {
    const user = userEvent.setup()
    const { calls, onUpload } = controlled()
    reduced(<MediaDropzone defaultFiles={[]} onUpload={onUpload} />)
    fireEvent.change(picker(), { target: { files: [png()] } })
    await waitFor(() => expect(calls).toHaveLength(1))
    await act(async () => calls[0]!.reject(new Error('Quota exceeded')))
    expect(await screen.findByText('Failed: Quota exceeded')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry photo.png' }))
    await waitFor(() => expect(calls).toHaveLength(2))
    await act(async () => calls[1]!.resolve())
    expect(await screen.findByText('Uploaded')).toBeInTheDocument()
  })

  test('your own check runs before the upload, and its reason is the refusal', async () => {
    const { calls, onUpload } = controlled()
    const validate = vi.fn(async (file: File) => (file.name.includes(' ') ? 'Names can’t have spaces.' : null))
    reduced(<MediaDropzone defaultFiles={[]} onUpload={onUpload} validate={validate} />)
    fireEvent.change(picker(), { target: { files: [png('my photo.png'), png('ok.png')] } })
    expect(await screen.findByText('Names can’t have spaces.')).toBeInTheDocument()
    await waitFor(() => expect(calls.map((c) => c.file.name)).toEqual(['ok.png']))
  })

  test('copy rewrites its strings and the locale writes its sizes; at maxFiles the zone says it’s full', () => {
    reduced(<MediaDropzone locale="de-DE" maxFiles={4} copy={{ title: 'Dateien', full: (max) => `${max} von ${max}` }} />)
    expect(screen.getByRole('heading', { name: 'Dateien' })).toBeInTheDocument()
    expect(rows().some((r) => r.includes('1,4 MB'))).toBe(true)
    expect(zone()).toBeDisabled()
    expect(zone()).toHaveTextContent('4 von 4')
  })

  test('gives back every preview it made and stops its uploads when it goes', async () => {
    const created: string[] = []
    const revoke = vi.fn()
    const restore = { create: URL.createObjectURL, revoke: URL.revokeObjectURL, decode: HTMLImageElement.prototype.decode }
    URL.createObjectURL = () => created[created.push(`blob:${created.length}`) - 1]!
    URL.revokeObjectURL = revoke
    HTMLImageElement.prototype.decode = () => Promise.resolve()
    try {
      const { calls, onUpload } = controlled()
      const view = reduced(<MediaDropzone defaultFiles={[]} accept="image/*" onUpload={onUpload} />)
      fireEvent.change(picker(), { target: { files: [new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' })] } })
      await waitFor(() => expect(calls).toHaveLength(1))
      await waitFor(() => expect(created).toHaveLength(1))
      view.unmount()
      expect(calls[0]!.context.signal.aborted).toBe(true)
      expect(revoke).toHaveBeenCalledWith(created[0])
    } finally {
      URL.createObjectURL = restore.create
      URL.revokeObjectURL = restore.revoke
      HTMLImageElement.prototype.decode = restore.decode
    }
  })

  test('its rules line states every rule it holds files to', () => {
    reduced(<MediaDropzone accept="image/png,image/webp" minDimensions={{ width: 1200, height: 1200 }} maxSize={20 * MB} maxTotalSize={100 * MB} />)
    expect(zone()).toHaveAccessibleDescription('PNG or WebP · at least 1200 × 1200 px · up to 20 MB each · 100 MB in all')
  })

  test('its strings are all in copy', () => {
    expect(MEDIA_DROPZONE_COPY.title).toBe('Upload files')
    expect(MEDIA_DROPZONE_COPY.refusedTitle(1)).toBe('1 file wasn’t added')
  })
})

describe('Drop zone block: Grant application story', () => {
  test('a grant application: its title, files and size limits come from props', () => {
    reduced(<MediaDropzone {...GrantApplication.args} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Application documents' })).toBeInTheDocument()
    expect(screen.getByText(/Spring Community Fund · due March 14/)).toBeInTheDocument()
    expect(screen.getByText('Drop your PDFs and budget here')).toBeInTheDocument()
    expect(rows().join(' ')).toMatch(/project-narrative\.pdf.*budget-2027\.xlsx.*letters-of-support\.pdf/)
    expect(picker()).toHaveAttribute('accept', '.pdf,.xlsx,.csv')
    expect(document.body).toHaveTextContent(/up to 5 MB each/)
  })
})
