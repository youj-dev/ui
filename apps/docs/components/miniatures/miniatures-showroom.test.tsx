import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { miniatures } from '@youj/miniatures'
import { MiniaturesShowroom } from './miniatures-showroom'
import { MINIATURE_PROPS } from './props'

const scrollIntoView = vi.fn()
beforeAll(() => {
  Element.prototype.scrollIntoView = scrollIntoView
})
beforeEach(() => {
  localStorage.clear()
  scrollIntoView.mockClear()
  window.history.replaceState(null, '', '/miniatures')
})
afterEach(() => {
  vi.restoreAllMocks()
})

function open({ address = '', reduced = 'always' }: { address?: string; reduced?: ReducedMotionSetting } = {}) {
  window.history.replaceState(null, '', `/miniatures${address}`)
  const Wrap = ({ children }: { children: ReactNode }) => (
    <YoujProvider reducedMotion={reduced} timeScale={0.05}>
      {children}
    </YoujProvider>
  )
  return render(<MiniaturesShowroom miniatures={[...miniatures]} props={MINIATURE_PROPS} />, { wrapper: Wrap })
}

const onStage = () => document.getElementById('miniature-name')?.textContent
/** The live miniature on stage, once its chunk has arrived. */
const host = (id: string) => waitFor(() => expect(document.querySelector(`.yjm-${id}`)).not.toBeNull())

describe('the miniatures page', () => {
  it('puts the turntable on stage when the address names none: the real component, in the site’s scheme', async () => {
    open()
    expect(onStage()).toBe('Record turntable')
    const at = miniatures.findIndex((m) => m.id === 'turntable') + 1
    expect(screen.getByText(`Record turntable, ${at} of ${miniatures.length}`)).toBeInTheDocument()
    await host('turntable')
    expect(document.querySelector('.yjm-turntable')).toHaveAttribute('data-mode', 'light')
    expect(screen.getByRole('option', { name: 'Record turntable' })).toHaveAttribute('aria-selected', 'true')
  })

  it('opens on the miniature the address names, and drops a name it doesn’t know', async () => {
    const { unmount } = open({ address: '?item=hourglass' })
    expect(onStage()).toBe('Hourglass')
    await host('hourglass')
    expect(document.querySelector('.yjm-turntable')).toBeNull()
    unmount()
    open({ address: '?item=nope' })
    expect(onStage()).toBe('Record turntable')
    expect(window.location.search).toBe('')
  })

  it('lists every miniature under the hero, the strip in a bar there when the address asks for one', () => {
    const { unmount } = open({ address: '?strip=bar' })
    expect(screen.getByRole('region', { name: `All miniatures ${miniatures.length}` })).toBeInTheDocument()
    expect(screen.getAllByRole('listbox', { name: 'Miniatures' })).toHaveLength(1)
    expect(screen.getByRole('listbox', { name: 'Miniatures' }).closest('.sticky')).not.toBeNull()
    expect(window.location.search).toBe('?strip=bar')
    unmount()
    open({ address: '?strip=sideways' })
    expect(screen.getByRole('listbox', { name: 'Miniatures' }).closest('.sticky')).toBeNull()
  })

  it('heads its panel with what it is, the description up top and its docs a link away', () => {
    open()
    const name = screen.getByRole('heading', { level: 2, name: 'Record turntable' })
    const header = name.closest('header')!
    expect(header).toHaveTextContent('TAVREN R–12·Study 021')
    expect(within(header).getByText(/^Walnut plinth/)).toBeInTheDocument()
    expect(header).toHaveTextContent('R–12 / DIRECT DRIVE')
    expect(within(header).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs/miniatures')
  })

  it('prints its readout on the stage, from the catalogue at first, and opens its keys from the toolbar: a two-column legend, a switch’s pressed while on; neither the stage nor the panel lists them', async () => {
    open()
    const readout = screen.getByRole('group', { name: 'Readout' })
    expect(readout).toHaveTextContent('33.3 rpm · A1 · 04:16')
    expect(readout).toHaveTextContent('PLAYING · TRACK 1 · LOW SUN')
    expect(screen.queryByRole('button', { name: 'Press Space, start / stop' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Keys' })).toBeNull()
    const bar = screen.getByRole('toolbar', { name: 'Record turntable: view' })
    fireEvent.click(within(bar).getByRole('button', { name: 'Keys' }))
    const keys = await screen.findByRole('dialog', { name: 'Record turntable: keys' })
    expect(within(keys).getAllByRole('listitem')).toHaveLength(miniatures.find((m) => m.id === 'turntable')!.keys.length)
    expect(within(keys).getByRole('button', { name: 'Press Space, start / stop' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(keys).getByRole('button', { name: 'Press C, cue' })).not.toHaveAttribute('aria-pressed')
    expect(within(keys).getByRole('button', { name: 'Press ↑, pitch' })).toBeInTheDocument()
  })

  it('presses a key in the miniature from its keycap, and the readout follows the miniature', async () => {
    open()
    await host('turntable')
    fireEvent.click(within(screen.getByRole('toolbar', { name: 'Record turntable: view' })).getByRole('button', { name: 'Keys' }))
    const space = await screen.findByRole('button', { name: 'Press Space, start / stop' })
    await waitFor(() => expect(space).not.toHaveAttribute('aria-disabled'))
    fireEvent.click(space)
    await waitFor(() => expect(space).toHaveAttribute('aria-pressed', 'false'))
    await waitFor(() => expect(screen.getByRole('group', { name: 'Readout' })).toHaveTextContent(/STOPP(ING|ED)/))
  })

  it('opens the code of the miniature on show from Use it, in the large modal, and gives focus back', async () => {
    open({ address: '?item=3d-printer' })
    const use = screen.getByRole('button', { name: 'Use it' })
    fireEvent.click(use)
    const dialog = await screen.findByRole('dialog', { name: 'Cartesian 3D printer' })
    expect(within(within(dialog).getByRole('tablist', { name: 'The code' })).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Use it', 'Props'])
    // Use it: 1 the package, in the reader's package manager (npm until they choose), 2 the code. A miniature has no copy to choose.
    expect(within(dialog).queryByRole('group', { name: 'Take it as' })).toBeNull()
    expect(within(dialog).getByRole('group', { name: 'Package install command' })).toHaveTextContent('npm i @youj/miniatures')
    expect(within(dialog).getByRole('group', { name: 'On its own' })).toHaveTextContent("import { MiniatureThreeDPrinter } from '@youj/miniatures/3d-printer'")
    // Its readout and keys, as this page draws them: its meta's first readout and its first key pressed through its handle.
    fireEvent.click(within(dialog).getByRole('tab', { name: 'With its readout and keys' }))
    expect(within(dialog).getByRole('group', { name: 'With its readout and keys' })).toHaveTextContent('import { MiniatureThreeDPrinter, threeDPrinter }')
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Props' }))
    expect(within(dialog).getByRole('table', { name: 'MiniatureProps props' })).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Cartesian 3D printer' })).toBeNull())
    expect(use).toHaveFocus()
  })

  it('copies the miniature on its paper, with its import, from Copy code', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    open({ address: '?item=hourglass' })
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("import { MiniatureHourglass } from '@youj/miniatures/hourglass'\n\n<MiniatureHourglass stage />"))
    Reflect.deleteProperty(navigator, 'clipboard')
  })

  it('finds a miniature by what it is, its maker or its keys, and puts it on stage from the search', async () => {
    open()
    act(() => void document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true })))
    const field = await screen.findByRole('combobox', { name: 'Search miniatures' })
    fireEvent.change(field, { target: { value: 'lighthouse' } })
    const results = screen.getByRole('listbox', { name: /^\d+ miniatures?$/ })
    const first = within(results).getAllByRole('option')[0]!
    expect(first).toHaveTextContent('Lighthouse')
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(field).toHaveAttribute('aria-activedescendant', first.id)
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(onStage()).toBe('Lighthouse')
    expect(window.location.search).toBe('?item=lighthouse')
    await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull())
    await host('lighthouse')
  })

  it('steps with Next and the page’s arrows, round from the last to the first', () => {
    open({ address: `?item=${miniatures.at(-1)!.id}` })
    fireEvent.click(screen.getByRole('button', { name: `Next: ${miniatures[0]!.name}` }))
    expect(onStage()).toBe(miniatures[0]!.name)
    act(() => void document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })))
    expect(onStage()).toBe(miniatures.at(-1)!.name)
  })

  it('switches the stage to dark from its toolbar, and passes reduced motion on', async () => {
    open()
    await host('turntable')
    fireEvent.click(screen.getByRole('button', { name: 'Show it on dark' }))
    expect(document.querySelector('.yjm-turntable')).toHaveAttribute('data-mode', 'dark')
    fireEvent.click(screen.getByRole('button', { name: 'Reduced motion' }))
    expect(screen.getByRole('button', { name: 'Reduced motion' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Turn sound on' }))
    expect(screen.getByRole('button', { name: 'Turn sound off' })).toHaveAttribute('aria-pressed', 'true')
  })
})
