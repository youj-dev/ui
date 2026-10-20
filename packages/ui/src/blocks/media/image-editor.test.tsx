import { createEvent, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { IMAGE_EDITOR_COPY, ImageEditor, type ImageEditorResult } from './image-editor'
import { RealEstateListingPhoto } from './image-editor.stories'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const stage = () => screen.getByRole('group', { name: 'Image' })
const picker = () => document.querySelector<HTMLInputElement>('input[type=file]')!

/* jsdom loads no images and lays nothing out: images load at once at 1200 × 800 (or what a test sets), and the stage is 640 × 420. */
let size = { width: 1200, height: 800 }
beforeEach(() => {
  size = { width: 1200, height: 800 }
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockImplementation(() => size.width)
  vi.spyOn(HTMLImageElement.prototype, 'naturalHeight', 'get').mockImplementation(() => size.height)
  vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (this: HTMLImageElement) {
    queueMicrotask(() => this.onload?.(new Event('load')))
  })
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(640)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(420)
})
afterEach(() => vi.restoreAllMocks())

describe('Image editor block', () => {
  test('frames the photo under a crop area with its keys, a focal point, previews and alt text', async () => {
    reduced(<ImageEditor />)
    expect(screen.getByRole('heading', { level: 2, name: 'Edit image' })).toBeInTheDocument()
    expect(await screen.findByRole('group', { name: 'Image' })).toHaveAttribute('aria-roledescription', 'crop area')
    expect(stage()).toHaveAccessibleDescription(/arrow keys to move it.*\[ and \] to straighten, R to turn, H and V to flip/)
    expect(screen.getByRole('button', { name: 'Focal point' })).toHaveAccessibleDescription(/% from the left, \d+% from the top\. Drag it/)
    expect(screen.getByRole('button', { name: '16:9' })).toHaveAttribute('aria-pressed', 'true')
    // Base UI's range input is visually hidden, so it's found with `hidden`.
    const straighten = screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === 'Straighten')
    expect(straighten).toHaveAttribute('aria-valuetext', '-2°')
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Card', 'Grid', 'Story', 'Banner'])
    expect(screen.getByRole('textbox', { name: 'Alt text' })).toHaveValue('Three white ceramic bud vases in a row on a pale grey surface.')
    expect(screen.getByText(/^Saves \d+ × \d+ JPG$/)).toBeInTheDocument()
  })

  test('the crop area takes keys: move, zoom, straighten, turn, flip and reset', async () => {
    const onEditChange = vi.fn()
    reduced(<ImageEditor src="/photo.jpg" onEditChange={onEditChange} />)
    const area = await screen.findByRole('group', { name: 'Image' })
    const last = () => onEditChange.mock.calls.at(-1)![0]
    fireEvent.keyDown(area, { key: '+' })
    expect(last().zoom).toBeCloseTo(1.1)
    // The arrows move the photo, as a drag would: moving it right brings more of its left side into the frame.
    fireEvent.keyDown(area, { key: 'ArrowRight', shiftKey: true })
    expect(last().center.x).toBeLessThan(0.5)
    fireEvent.keyDown(area, { key: ']' })
    expect(last().rotation).toBe(0.5)
    fireEvent.keyDown(area, { key: 'r' })
    expect(last().rotation).toBe(90.5)
    // A flip mirrors what's on screen: after a quarter turn that's the image's own height, and the straightening mirrors too.
    fireEvent.keyDown(area, { key: 'h' })
    expect(last()).toMatchObject({ flipX: false, flipY: true, rotation: 89.5 })
    fireEvent.keyDown(area, { key: '0' })
    expect(last()).toMatchObject({ rotation: 0, zoom: 1, flipX: false, flipY: false, center: { x: 0.5, y: 0.5 } })
  })

  test('a new crop keeps the frame on the image; the focal point moves with arrows and says where it is', async () => {
    const onEditChange = vi.fn()
    reduced(<ImageEditor src="/photo.jpg" onEditChange={onEditChange} />)
    await screen.findByRole('group', { name: 'Image' })
    await userEvent.setup().click(screen.getByRole('button', { name: 'Square' }))
    expect(onEditChange).toHaveBeenLastCalledWith(expect.objectContaining({ aspect: 'square' }))
    const focal = screen.getByRole('button', { name: 'Focal point' })
    expect(focal).toHaveAccessibleDescription(/^50% from the left, 50% from the top/)
    fireEvent.keyDown(focal, { key: 'ArrowRight', shiftKey: true })
    const edit = onEditChange.mock.calls.at(-1)![0]
    expect(edit.focal.x).toBeGreaterThan(0.5)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Focal point' })).toHaveAccessibleDescription(/^60% from the left, 50% from the top/),
    )
  })

  test('Save draws the framing and hands over the file, its region, focal point and alt text', async () => {
    const user = userEvent.setup()
    const context = {
      fillRect: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: '',
      imageSmoothingQuality: '',
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((done, type) => done(new Blob(['x'], { type })))
    const onSave = vi.fn<(result: ImageEditorResult) => void>()
    reduced(<ImageEditor onSave={onSave} />)
    await screen.findByRole('group', { name: 'Image' })
    await user.clear(screen.getByRole('textbox', { name: 'Alt text' }))
    await user.type(screen.getByRole('textbox', { name: 'Alt text' }), 'Three vases')
    await user.click(screen.getByRole('button', { name: 'Save image' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    const result = onSave.mock.calls[0]![0]
    expect(result.file.name).toBe('bud-vases-edited.jpg')
    expect(result.file.type).toBe('image/jpeg')
    expect(result.alt).toBe('Three vases')
    expect(result.region).toMatchObject({ rotation: -2, flipX: false, flipY: false })
    expect(result.region.width / result.region.height).toBeCloseTo(16 / 9)
    expect(result.focal.x).toBeGreaterThan(0)
    expect(result.edit.aspect).toBe('wide')
    expect(context.fillRect).toHaveBeenCalled()
    expect(context.drawImage).toHaveBeenCalled()
  })

  test('an avatar is round, with no focal point or alt text; a cover has one crop', async () => {
    const view = reduced(<ImageEditor variant="avatar" />)
    expect(await screen.findByRole('heading', { name: 'Profile photo' })).toBeInTheDocument()
    await screen.findByRole('group', { name: 'Image' })
    expect(screen.queryByRole('button', { name: 'Focal point' })).toBeNull()
    expect(screen.queryByRole('textbox', { name: 'Alt text' })).toBeNull()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Profile', 'Comment', 'Mention'])
    expect(screen.getByText('Saves 512 × 512 JPG')).toBeInTheDocument()
    view.unmount()
    reduced(<ImageEditor variant="cover" />)
    await screen.findByRole('group', { name: 'Image' })
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.queryByRole('button', { name: '16:9' })).toBeNull()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Desktop', 'Tablet', 'Phone'])
  })

  test('empty, it takes a picked or pasted image and explains a refusal', async () => {
    const onFileChange = vi.fn()
    URL.createObjectURL = vi.fn(() => 'blob:photo')
    URL.revokeObjectURL = vi.fn()
    reduced(<ImageEditor src={null} variant="cover" onFileChange={onFileChange} />)
    expect(screen.getByRole('button', { name: /Drop an image here/ })).toBeInTheDocument()
    expect(screen.getByText(/JPG, PNG, WebP, AVIF · up to 20 MB · at least 1200 × 400 px/)).toBeInTheDocument()
    fireEvent.change(picker(), { target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } })
    expect(await screen.findByText('notes.txt isn’t an image this takes.')).toHaveAttribute('role', 'alert')
    expect(screen.getByRole('button', { name: /Drop an image here/ })).toHaveAccessibleDescription('notes.txt isn’t an image this takes.')
    size = { width: 640, height: 480 }
    fireEvent.change(picker(), { target: { files: [new File(['x'], 'small.png', { type: 'image/png' })] } })
    expect(await screen.findByText('small.png is 640 × 480 px; it needs at least 1200 × 400 px.')).toBeInTheDocument()
    size = { width: 3000, height: 1000 }
    const pasted = createEvent.paste(document.querySelector('article')!, {
      clipboardData: { files: [new File(['x'], 'header.png', { type: 'image/png' })] },
    })
    fireEvent(document.querySelector('article')!, pasted)
    expect(pasted.defaultPrevented).toBe(true)
    await waitFor(() => expect(onFileChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'header.png' })))
    expect(await screen.findByRole('group', { name: 'Image' })).toBeInTheDocument()
    expect(screen.getByText('Saves 3000 × 1000 JPG')).toBeInTheDocument()
  })

  test('Remove empties it after onRemove; copy and locale write its words and numbers', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    reduced(<ImageEditor locale="de-DE" onRemove={onRemove} copy={{ title: 'Bild bearbeiten', remove: 'Entfernen' }} />)
    expect(screen.getByRole('heading', { name: 'Bild bearbeiten' })).toBeInTheDocument()
    await screen.findByRole('group', { name: 'Image' })
    expect(screen.getByText('112 %')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Entfernen' }))
    expect(onRemove).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: /Drop an image here/ })).toBeInTheDocument()
    expect(await within(document.querySelector('article')!).findByText('Image removed')).toBeInTheDocument()
    expect(IMAGE_EDITOR_COPY.degrees('−2')).toBe('−2°')
  })
})

describe('Image editor block: Real estate listing photo story', () => {
  test('a listing photo: its crops, places it appears and copy come from props', async () => {
    reduced(<ImageEditor {...RealEstateListingPhoto.args} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Listing photo' })).toBeInTheDocument()
    expect(await screen.findByRole('group', { name: 'Image' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '16:9' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '2:1' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Search results', 'Listing header', 'Email alert'])
    expect(screen.getByRole('textbox', { name: 'Alt text' })).toHaveValue('A two-story cream house with a brown roof, blue front door and a lawn.')
    expect(screen.getByText(/^Saves \d+ × \d+ WebP$/)).toBeInTheDocument()
  })
})
