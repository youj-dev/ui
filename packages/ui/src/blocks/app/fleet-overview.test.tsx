import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { FleetOverview } from './fleet-overview'

const reduced = (ui: React.ReactNode, motion: ReducedMotionSetting = 'always') => render(<YoujProvider reducedMotion={motion}>{ui}</YoujProvider>)

beforeAll(() => {
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

/** A desktop window: the map with floating panels. */
function wide() {
  const original = window.matchMedia
  window.matchMedia = (query: string) =>
    ({
      matches: /min-width/.test(query),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
  return () => {
    window.matchMedia = original
  }
}

const voyage = () => screen.getByRole('complementary', { name: 'Voyage' })

describe('FleetOverview', () => {
  let restore: (() => void) | undefined
  afterEach(() => {
    restore?.()
    restore = undefined
  })

  test('the map opens on a held ship, and picking another eases to its voyage', async () => {
    restore = wide()
    const user = userEvent.setup()
    reduced(<FleetOverview embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Fleet' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /8 ships at sea on their lanes, 2 holding for a storm/ })).toBeInTheDocument()
    expect(within(voyage()).getByRole('heading', { level: 2, name: 'Nordic Tern' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Holding/ })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('tab', { name: /Sailing/ }))
    await user.click(screen.getByRole('button', { name: /^Halcyon Bay/ }))
    expect(within(voyage()).getByRole('heading', { level: 2, name: 'Halcyon Bay' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Halcyon Bay/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('img', { name: /Showing Halcyon Bay, New York to Rotterdam/ })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(voyage()).toHaveAttribute('data-open', 'false')
    expect(voyage()).toHaveAttribute('inert')
  })

  test('by default, a page of the app’s frame: the shared page header names the map, with no main of its own', () => {
    restore = wide()
    const { container } = reduced(<FleetOverview />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot=app-page-header]')).toContainElement(screen.getByRole('heading', { level: 1, name: 'Fleet overview' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Fleet' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Ships' })).toBeInTheDocument()
  })

  test('rerouting clears the storm: the ships sail, their ETAs move, and the alert goes', async () => {
    restore = wide()
    const user = userEvent.setup()
    reduced(<FleetOverview />)
    expect(within(voyage()).getByText(/31\.5/, { selector: '.sr-only' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Reroute 2 ships/ }))

    expect(await screen.findByText('2 ships rerouted', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Holding/ })).toHaveTextContent('0')
    expect(screen.getByText('Nothing holding')).toBeInTheDocument()
    expect(within(voyage()).getByText('Rerouted')).toBeInTheDocument()
    expect(within(voyage()).getByText(/32\.9/, { selector: '.sr-only' })).toBeInTheDocument()
    expect(within(voyage()).getByText(/Rerouted west of the storm cell, ETA \+1\.4 days/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /8 ships at sea on their lanes\./ })).toBeInTheDocument()
    // Once its button has said so, the alert goes, and focus moves to the search rather than the page.
    await waitFor(() => expect(screen.queryByText('Storm cell over the Bay of Biscay')).not.toBeInTheDocument(), { timeout: 6000 })
    expect(screen.getByRole('textbox', { name: 'Search ships' })).toHaveFocus()
  }, 20_000)

  test('rerouting runs onReroute with the held ships before the lanes change', async () => {
    restore = wide()
    const user = userEvent.setup()
    const onReroute = vi.fn()
    reduced(<FleetOverview onReroute={onReroute} />)
    await user.click(screen.getByRole('button', { name: /Reroute 2 ships/ }))
    expect(await screen.findByText('2 ships rerouted', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(onReroute).toHaveBeenCalledTimes(1)
    expect(onReroute.mock.calls[0]![0].map((s: { id: string }) => s.id)).toEqual(['nordic-tern', 'cape-lumen'])
  }, 20_000)

  test('J steps through the list, / searches, and a search can come up empty', async () => {
    restore = wide()
    const user = userEvent.setup()
    reduced(<FleetOverview />)
    await user.keyboard('j')
    expect(within(voyage()).getByRole('heading', { level: 2, name: 'Cape Lumen' })).toBeInTheDocument()
    await user.keyboard('/')
    const search = screen.getByRole('textbox', { name: 'Search ships' })
    expect(search).toHaveFocus()
    await user.type(search, 'busan')
    expect(screen.getByText('No ships match')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Sailing/ }))
    expect(screen.getByRole('button', { name: /^Orient Pearl/ })).toBeInTheDocument()
  })

  test('the map stops its clock when it unmounts', () => {
    restore = wide()
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const clear = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = reduced(<FleetOverview />, 'never')
    unmount()
    expect(cancel).toHaveBeenCalled()
    expect(clear).toHaveBeenCalled()
    cancel.mockRestore()
    clear.mockRestore()
  })
})
