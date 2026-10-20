import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { IllustratedState, type IllustratedStateKind } from './illustrated-states'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const setOnline = (online: boolean) => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online })
  act(() => void window.dispatchEvent(new Event(online ? 'online' : 'offline')))
}
afterEach(() => setOnline(true))

const TITLES: Record<IllustratedStateKind, string> = {
  welcome: 'Good to have you here, Maya',
  empty: 'Nothing here yet',
  'not-found': 'We can’t find that page',
  maintenance: 'Back in a little while',
  success: 'You’re all set',
  offline: 'You’re offline',
}

describe('illustrated states block', () => {
  test.each(Object.entries(TITLES))('%s: a page named by its title, with its scene', (state, title) => {
    const { container } = reduced(<IllustratedState state={state as IllustratedStateKind} />)
    expect(screen.getByRole('main', { name: title })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(container.querySelector('[data-illustration]')).not.toBeNull()
  })

  test('each state gets a scene that fits it, which illustration swaps or removes', () => {
    const { container, rerender } = reduced(<IllustratedState state="not-found" />)
    expect(container.querySelector('[data-illustration]')).toHaveAttribute('data-illustration', 'not-found')
    rerender(
      <YoujProvider reducedMotion="always">
        <IllustratedState state="not-found" illustration="compass" />
      </YoujProvider>,
    )
    expect(container.querySelector('[data-illustration]')).toHaveAttribute('data-illustration', 'compass')
    rerender(
      <YoujProvider reducedMotion="always">
        <IllustratedState state="not-found" illustration={null} />
      </YoujProvider>,
    )
    expect(container.querySelector('[data-slot="state-illustration"]')).toBeNull()
  })

  test('404 shows the address that missed and where to go instead', () => {
    reduced(<IllustratedState state="not-found" path="/old/pricing" />)
    expect(screen.getByText('/old/pricing')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Popular pages' })
    expect(nav.querySelectorAll('a')).toHaveLength(4)
  })

  test('copy overrides any string, and the actions call back', async () => {
    const user = userEvent.setup()
    const onPrimary = vi.fn()
    const onSecondary = vi.fn()
    const onTemplate = vi.fn()
    reduced(<IllustratedState state="empty" copy={{ title: 'No boards yet', primary: 'New board' }} onPrimary={onPrimary} onSecondary={onSecondary} onTemplate={onTemplate} />)
    expect(screen.getByRole('heading', { level: 1, name: 'No boards yet' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'New board' }))
    await user.click(screen.getByRole('button', { name: 'Import from a file' }))
    await user.click(screen.getByRole('button', { name: 'Bug tracker' }))
    expect(onPrimary).toHaveBeenCalledOnce()
    expect(onSecondary).toHaveBeenCalledOnce()
    expect(onTemplate).toHaveBeenCalledWith('Bug tracker')
  })

  test('the maintenance window reports its progress and each step’s state', () => {
    reduced(<IllustratedState state="maintenance" />)
    expect(screen.getByRole('progressbar', { name: 'Maintenance progress' })).toHaveAttribute('aria-valuenow', '64')
    expect(screen.getByText('(done)')).toBeInTheDocument()
    expect(screen.getByText('(in progress)')).toBeInTheDocument()
  })

  test('offline: Try again says so when still offline, and the panel follows the connection', async () => {
    const user = userEvent.setup()
    setOnline(false)
    reduced(<IllustratedState state="offline" onPrimary={() => Promise.reject(new Error('offline'))} />)
    expect(screen.getByText('Waiting for a connection')).toHaveAttribute('role', 'status')
    await user.click(screen.getByRole('button', { name: /Try again/ }))
    // The label morphs letter by letter once motion's features load, so read the button's name, not a text node.
    expect(await screen.findByRole('button', { name: /Still offline/ })).toBeInTheDocument()
    setOnline(true)
    expect(screen.getByText(/Your connection is back/)).toBeInTheDocument()
  })

  test('embedded, it is a section named by an h2', () => {
    reduced(<IllustratedState state="success" embedded />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'You’re all set' })).toBeInTheDocument()
  })
})
