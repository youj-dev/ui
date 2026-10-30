import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MEDIA_LIBRARY_COPY, MediaLibrary } from './library'
import { BrandKit, CourseMaterials } from './library.stories'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const box = () => screen.getByRole('listbox', { name: 'Media' })
const options = () => within(box()).getAllByRole('option')
const option = (name: string) => within(box()).getByRole('option', { name: (accessible) => accessible.replace(/^\d+ /, '').startsWith(name) })
const footer = () => document.querySelector('footer')!

describe('Media library block', () => {
  test('lists the library as a multi-select listbox, the picked ones numbered in order', () => {
    reduced(<MediaLibrary />)
    expect(screen.getByRole('heading', { level: 2, name: 'Choose media' })).toBeInTheDocument()
    expect(box()).toHaveAttribute('aria-multiselectable', 'true')
    expect(options()).toHaveLength(15)
    expect(option('ridge-kettle-sage.webp')).toHaveAttribute('aria-selected', 'true')
    expect(option('ridge-kettle-sage.webp')).toHaveAccessibleName(/Selected 1$/)
    expect(option('ridge-kettle-rose.webp')).toHaveAccessibleName(/Selected 2$/)
    expect(footer()).toHaveTextContent('2 of 4 selected')
    expect(within(footer()).getByRole('button', { name: 'Insert 2' })).toBeEnabled()
  })

  test('a click picks or drops; past the maximum it says so instead', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    reduced(<MediaLibrary onSelectionChange={onSelectionChange} />)
    await user.click(option('tea-set-on-tray.webp'))
    await user.click(option('white-mug.webp'))
    expect(onSelectionChange).toHaveBeenLastCalledWith(['sage', 'rose', 'tea', 'mug'])
    await user.click(option('bud-vases.webp'))
    expect(option('bud-vases.webp')).toHaveAttribute('aria-selected', 'false')
    expect(footer()).toHaveTextContent('That’s 4, the most you can pick. Deselect one to swap it.')
    await user.click(option('ridge-kettle-sage.webp'))
    expect(onSelectionChange).toHaveBeenLastCalledWith(['rose', 'tea', 'mug'])
    expect(option('ridge-kettle-rose.webp')).toHaveAccessibleName(/Selected 1$/)
  })

  test('the keyboard moves, picks, picks a run, picks all and clears', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    reduced(<MediaLibrary defaultSelection={[]} max={Infinity} onSelectionChange={onSelectionChange} />)
    act(() => options()[0]!.focus())
    expect(options()[0]).toHaveAttribute('tabindex', '0')
    await user.keyboard('{ArrowRight}')
    expect(options()[1]).toHaveFocus()
    expect(options()[0]).toHaveAttribute('tabindex', '-1')
    await user.keyboard(' ')
    expect(onSelectionChange).toHaveBeenLastCalledWith(['sage-side'])
    await user.keyboard('{Shift>}{ArrowRight}{ArrowRight}{/Shift}')
    expect(onSelectionChange).toHaveBeenLastCalledWith(['sage-side', 'rose', 'rose-side'])
    await user.keyboard('{Escape}')
    expect(onSelectionChange).toHaveBeenLastCalledWith([])
    await user.keyboard('{Control>}a{/Control}')
    expect(onSelectionChange.mock.lastCall![0]).toHaveLength(15)
    await user.keyboard('{End}')
    expect(options().at(-1)).toHaveFocus()
  })

  test('search, type and folder narrow what’s shown, and a search with nothing says so', async () => {
    const user = userEvent.setup()
    reduced(<MediaLibrary />)
    await user.type(screen.getByRole('searchbox', { name: 'Search by name or description' }), 'side')
    expect(options().map((o) => o.getAttribute('aria-label')!.split(' ')[0])).toEqual([
      'ridge-kettle-sage-side.webp',
      'ridge-kettle-rose-side.webp',
      'ridge-kettle-sky-side.webp',
      'stovetop-kettle-cream-side.webp',
    ])
    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'zebra')
    expect(screen.getByText('Nothing matches “zebra”')).toBeInTheDocument()
    // The search field's own clear button, and the empty state's.
    await user.click(screen.getAllByRole('button', { name: 'Clear search' }).at(-1)!)
    await user.click(screen.getByRole('button', { name: 'Video' }))
    expect(options()).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'All' }))
    await user.click(screen.getByRole('button', { name: /^(?:\d+ )?Tableware/ }))
    expect(options()).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'All media' }))
    expect(options()).toHaveLength(15)
  })

  test('Enter opens the lightbox; it steps, picks from there and hands focus back', async () => {
    const user = userEvent.setup()
    reduced(<MediaLibrary defaultSelection={[]} />)
    act(() => options()[0]!.focus())
    await user.keyboard('{Enter}')
    const dialog = await screen.findByRole('dialog', { name: 'ridge-kettle-sage.webp' })
    expect(dialog).toHaveTextContent('1 of 15')
    expect(dialog).toHaveTextContent('Sage enamel kettle, front.')
    await user.click(within(dialog).getByRole('button', { name: 'Next' }))
    expect(await screen.findByRole('dialog', { name: 'ridge-kettle-sage-side.webp' })).toHaveTextContent('2 of 15')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Select' }))
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Selected' })).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(option('ridge-kettle-sage-side.webp')).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(option('ridge-kettle-sage-side.webp')).toHaveFocus())
  })

  test('an upload lands in the open folder, filling as it goes, and is picked while there’s room', async () => {
    const onSelectionChange = vi.fn()
    let finish: (stored: object) => void = () => {}
    let report: (percent: number) => void = () => {}
    const onUpload = vi.fn((_file: File, context: { onProgress: (p: number) => void; folder?: string }) => {
      report = context.onProgress
      return new Promise<object>((resolve) => (finish = resolve))
    })
    reduced(<MediaLibrary defaultSelection={[]} onUpload={onUpload} onSelectionChange={onSelectionChange} />)
    fireEvent.click(screen.getByRole('button', { name: /^(?:\d+ )?Kettles/ }))
    fireEvent.change(document.querySelector<HTMLInputElement>('input[type=file]')!, {
      target: { files: [new File(['x'], 'new-kettle.png', { type: 'image/png' })] },
    })
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(expect.any(File), expect.objectContaining({ folder: 'kettles' })))
    act(() => report(40))
    expect(options()[0]).toHaveAttribute('aria-disabled', 'true')
    expect(options()[0]).toHaveTextContent('Uploading, 40%')
    await act(async () => finish({ id: 'stored-1', preview: '/new.png' }))
    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith(['stored-1']))
  })

  test('Insert hands over the picked files in order; loading and failing have their states', async () => {
    const user = userEvent.setup()
    const onInsert = vi.fn()
    const view = reduced(<MediaLibrary onInsert={onInsert} />)
    await user.click(within(footer()).getByRole('button', { name: 'Insert 2' }))
    await waitFor(() => expect(onInsert).toHaveBeenCalledTimes(1))
    expect(onInsert.mock.calls[0]![0].map((a: { id: string }) => a.id)).toEqual(['sage', 'rose'])
    view.unmount()
    const onRetry = vi.fn()
    const failed = reduced(<MediaLibrary error="Timed out." onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
    failed.unmount()
    reduced(<MediaLibrary loading locale="de-DE" />)
    expect(screen.getByRole('status', { name: 'Loading media…' })).toBeInTheDocument()
    expect(MEDIA_LIBRARY_COPY.selected(1, 4)).toBe('1 of 4 selected')
  })
})

describe('Media library block: other worlds', () => {
  test('course materials: slides, recordings and readings in their units, with their own labels', () => {
    reduced(<MediaLibrary {...CourseMaterials.args} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Add materials to Week 4' })).toBeInTheDocument()
    expect(options()).toHaveLength(8)
    expect(option('cell-structure-slides.pdf')).toHaveAttribute('aria-selected', 'true')
    expect(footer()).toHaveTextContent('2 of 6 selected')
    expect(within(footer()).getByRole('button', { name: 'Add 2 to the week' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Recordings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Slides & readings' })).toBeInTheDocument()
  })

  test('brand kit: logos, typefaces and film with no limit on what to pick', () => {
    reduced(<MediaLibrary {...BrandKit.args} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Tidewater Coffee brand kit' })).toBeInTheDocument()
    expect(options()).toHaveLength(8)
    expect(footer()).toHaveTextContent('2 selected')
    expect(within(footer()).getByRole('button', { name: 'Add 2 to the press pack' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Logos' })).toBeInTheDocument()
  })
})
