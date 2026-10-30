import { act, createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ATTACHMENT_COMPOSER_COPY, AttachmentComposer, type AttachmentComposerFile, type AttachmentComposerUploadContext } from './attachments'
import { SupportReply } from './attachments.stories'

const MB = 1024 * 1024
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const field = () => screen.getByRole('textbox', { name: 'Reply' })
const list = () => screen.getByRole('list', { name: 'Attachments' })
const chip = (name: RegExp) => within(list()).getByRole('button', { name })
const picker = () => document.querySelector<HTMLInputElement>('input[type=file]')!
const send = () => screen.getByRole('button', { name: /^(Send|Sends when|Sending)/ })
const png = (name = 'photo.png') => new File(['x'], name, { type: 'image/png' })

function controlled() {
  const calls: { file: File; context: AttachmentComposerUploadContext; resolve: (v?: unknown) => void; reject: (e: unknown) => void }[] = []
  const onUpload = vi.fn(
    (file: File, context: AttachmentComposerUploadContext) => new Promise((resolve, reject) => calls.push({ file, context, resolve, reject })),
  )
  return { calls, onUpload }
}

const STORED: AttachmentComposerFile[] = [
  { id: 'a', name: 'a.pdf', size: MB, type: 'application/pdf', status: 'done' },
  { id: 'b', name: 'b.pdf', size: MB, type: 'application/pdf', status: 'done' },
  { id: 'c', name: 'c.pdf', size: MB, type: 'application/pdf', status: 'done' },
]

describe('Attachments block', () => {
  test('a reply with its attachments: pictures, a file uploading, the count and the shortcut', () => {
    reduced(<AttachmentComposer />)
    expect(screen.getByRole('heading', { level: 2, name: 'Reply to Priya Raman' })).toBeInTheDocument()
    expect(ATTACHMENT_COMPOSER_COPY.send).toBe('Send')
    expect(field()).toHaveValue(
      'Sorry about the lid, Priya. A replacement is on its way today; photos from the batch check and the order are attached.',
    )
    expect(
      within(list())
        .getAllByRole('button', { name: /^(batch|replacement)/ })
        .map((b) => b.getAttribute('aria-label')),
    ).toEqual([
      'batch-check-lid.webp, 1.6 MB',
      'batch-check-side.webp, 1.5 MB',
      expect.stringMatching(/^replacement-order-4821\.pdf, 410 kB, uploading, \d+%$/),
    ])
    // Off a Mac, the modifier is Alt.
    expect(chip(/^batch-check-lid/)).toHaveAccessibleDescription('Alt and the arrow keys move it, Delete removes it, Enter opens it.')
    expect(screen.getByText(/^3 of 10 files · /)).toBeInTheDocument()
  })

  test('files attached, pasted or dropped upload at once; the rules say why one wasn’t attached', async () => {
    const { calls, onUpload } = controlled()
    reduced(<AttachmentComposer defaultValue="" defaultAttachments={STORED.slice(0, 1)} maxFiles={3} maxSize={5 * MB} onUpload={onUpload} />)
    fireEvent.change(picker(), {
      target: {
        files: [
          png(),
          new File(['x'], 'tool.exe', { type: 'application/x-msdownload' }),
          Object.defineProperty(png('huge.png'), 'size', { value: 8 * MB }),
        ],
      },
    })
    await waitFor(() => expect(calls.map((c) => c.file.name)).toEqual(['photo.png']))
    // The reasons take the count's place in the toolbar, and describe the field.
    expect(field()).toHaveAccessibleDescription('tool.exe isn’t a file you can attach here. huge.png is 8 MB, over the 5 MB limit.')
    act(() => calls[0]!.context.onProgress(40))
    expect(chip(/^photo\.png/)).toHaveAccessibleName('photo.png, 1 byte, uploading, 40%')
    const pasted = createEvent.paste(field(), { clipboardData: { files: [png('image.png')] } })
    fireEvent(field(), pasted)
    expect(pasted.defaultPrevented).toBe(true)
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls[1]!.file.name).toMatch(/^Pasted image \d{4}-\d{2}-\d{2} \d{2}\.\d{2}\.\d{2}\.png$/)
    fireEvent.drop(screen.getByRole('group'), { dataTransfer: { types: ['Files'], files: [png('dropped.png')] } })
    await waitFor(() => expect(field()).toHaveAccessibleDescription('You can attach 3 files at most.'))
  })

  test('the keyboard moves a chip along the order and Delete removes it, focus moving on', async () => {
    const user = userEvent.setup()
    const onAttachmentsChange = vi.fn()
    reduced(<AttachmentComposer defaultAttachments={STORED} onAttachmentsChange={onAttachmentsChange} />)
    act(() => chip(/^a\.pdf/).focus())
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}')
    expect(onAttachmentsChange.mock.lastCall![0].map((f: AttachmentComposerFile) => f.id)).toEqual(['b', 'a', 'c'])
    await waitFor(() => expect(chip(/^a\.pdf/)).toHaveFocus())
    await user.keyboard('{Alt>}{End}{/Alt}')
    expect(onAttachmentsChange.mock.lastCall![0].map((f: AttachmentComposerFile) => f.id)).toEqual(['b', 'c', 'a'])
    expect(await screen.findByText('a.pdf moved to 3 of 3')).toBeInTheDocument()
    await user.keyboard('{Delete}')
    expect(onAttachmentsChange.mock.lastCall![0].map((f: AttachmentComposerFile) => f.id)).toEqual(['b', 'c'])
    await waitFor(() => expect(chip(/^c\.pdf/)).toHaveFocus())
  })

  test('Send waits for uploads still running, then sends the text and the files in order, and clears', async () => {
    const user = userEvent.setup()
    const { calls, onUpload } = controlled()
    const onSend = vi.fn()
    reduced(<AttachmentComposer defaultValue="Here it is" defaultAttachments={STORED.slice(0, 1)} onUpload={onUpload} onSend={onSend} />)
    fireEvent.change(picker(), { target: { files: [png()] } })
    await waitFor(() => expect(calls).toHaveLength(1))
    await user.click(send())
    expect(await screen.findByRole('button', { name: /Sends when 1 file finishes/ })).toBeInTheDocument()
    expect(onSend).not.toHaveBeenCalled()
    await act(async () => calls[0]!.resolve({ key: 'k' }))
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1))
    const message = onSend.mock.calls[0]![0]
    expect(message.text).toBe('Here it is')
    expect(message.attachments.map((f: AttachmentComposerFile) => [f.name, f.status])).toEqual([
      ['a.pdf', 'done'],
      ['photo.png', 'done'],
    ])
    await waitFor(() => expect(field()).toHaveValue(''))
    expect(screen.queryByRole('list', { name: 'Attachments' })).toBeNull()
  })

  test('a failed upload stops Send, says so and takes focus; a press retries it; ⌘↵ sends', async () => {
    const user = userEvent.setup()
    const { calls, onUpload } = controlled()
    const onSend = vi.fn()
    reduced(<AttachmentComposer defaultValue="Logs attached" defaultAttachments={[]} onUpload={onUpload} onSend={onSend} />)
    fireEvent.change(picker(), { target: { files: [png('log.png')] } })
    await waitFor(() => expect(calls).toHaveLength(1))
    await act(async () => calls[0]!.reject(new Error('Quota exceeded')))
    expect(chip(/^log\.png/)).toHaveAccessibleName('log.png, Retry, 1 byte, didn’t upload: Quota exceeded')
    field().focus()
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(await screen.findByText('1 file didn’t upload. Retry or remove it to send.')).toBeInTheDocument()
    await waitFor(() => expect(chip(/^log\.png/)).toHaveFocus())
    expect(onSend).not.toHaveBeenCalled()
    await user.click(chip(/^log\.png/))
    await waitFor(() => expect(calls).toHaveLength(2))
  })

  test('a picture opens large; copy and locale write its words and sizes', async () => {
    const user = userEvent.setup()
    reduced(<AttachmentComposer locale="de-DE" copy={{ title: 'Antworten', send: 'Senden' }} />)
    expect(screen.getByRole('heading', { name: 'Antworten' })).toBeInTheDocument()
    expect(chip(/^batch-check-lid/)).toHaveAccessibleName('batch-check-lid.webp, 1,6 MB')
    await user.click(chip(/^batch-check-lid/))
    expect(await screen.findByRole('dialog', { name: 'batch-check-lid.webp' })).toBeInTheDocument()
  })
})

describe('Attachments block: Support reply story', () => {
  test('a helpdesk reply: its ticket, logs and rules come from props', () => {
    reduced(<AttachmentComposer {...SupportReply.args} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Reply to Marcus Webb' })).toBeInTheDocument()
    expect(screen.getByText('Ticket 7314 · Sync stops after the 4.2 update')).toBeInTheDocument()
    expect(list()).toHaveTextContent('sync-debug.log')
    expect(list()).toHaveTextContent('network-trace.har')
    expect(screen.getByText(/^3 of 6 files · /)).toBeInTheDocument()
    expect(picker()).toHaveAttribute('accept', '.log,.txt,.har,.zip,image/*')
  })
})
