import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvatarUpload, cropRegion } from './avatar-upload'

const image = (name = 'me.png', size = 2000, type = 'image/png') => new File([new Uint8Array(size)], name, { type })

describe('cropRegion', () => {
  test('centred at 1× it is the largest centred square', () => {
    expect(cropRegion({ width: 1600, height: 900 }, 240, { x: 0, y: 0, zoom: 1 })).toEqual({ x: 350, y: 0, size: 900 })
  })

  test('zoom narrows it around the centre', () => {
    const r = cropRegion({ width: 1000, height: 1000 }, 200, { x: 0, y: 0, zoom: 2 })
    expect(r).toEqual({ x: 250, y: 250, size: 500 })
  })

  test('moving the photo right shows more of its left side', () => {
    // 1000px image in a 200px circle: 5 source px per screen px.
    const r = cropRegion({ width: 1000, height: 1000 }, 200, { x: 20, y: -10, zoom: 1 })
    expect(r.x).toBeCloseTo(-100)
    expect(r.y).toBeCloseTo(50)
  })
})

describe('AvatarUpload', () => {
  const { createObjectURL, revokeObjectURL } = URL
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:picked')
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => {
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
  })

  const picker = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[type=file]')!

  test('the avatar is a labelled button that opens the picker, described by the rules', async () => {
    const user = userEvent.setup()
    const { container } = render(<AvatarUpload fallback="AL" onSave={() => {}} />)
    const trigger = screen.getByRole('button', { name: 'Upload photo', description: 'PNG, JPG or WebP · up to 10 MB' })
    const click = vi.spyOn(picker(container), 'click')
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(click).toHaveBeenCalledOnce()
  })

  test('with a photo it offers change and remove', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<AvatarUpload src="/me.jpg" name="Ada" onSave={() => {}} onRemove={onRemove} />)
    expect(screen.getAllByRole('button', { name: 'Change photo' })).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  test('a picked image opens the crop dialog with a zoom slider', async () => {
    const user = userEvent.setup()
    const { container } = render(<AvatarUpload onSave={() => {}} />)
    await user.upload(picker(container), image())
    const dialog = await screen.findByRole('dialog', { name: 'Crop your photo' })
    expect(dialog).toContainElement(screen.getByRole('group', { name: 'Photo position and zoom' }))
    // Base UI's range input is visually hidden, so it is found with hidden: true.
    expect(screen.getAllByRole('slider', { hidden: true }).map((s) => s.getAttribute('aria-label'))).toEqual(['Zoom'])
    expect(screen.getByRole('button', { name: 'Save photo' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('rejects the wrong type or an oversized image with an alert, without opening the crop', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const { container } = render(<AvatarUpload onSave={() => {}} maxSize={1000} />)
    await user.upload(picker(container), image('me.gif', 10, 'image/gif'))
    expect(await screen.findByRole('alert')).toHaveTextContent('me.gif isn’t a supported image (PNG, JPG, WebP).')
    await user.upload(picker(container), image('big.png', 5000))
    expect(await screen.findByRole('alert')).toHaveTextContent('big.png is 4.9 kB; the limit is 1,000 bytes.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
