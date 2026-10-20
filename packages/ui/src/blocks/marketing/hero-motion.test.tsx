import { forwardRef } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { HeroMotion } from './hero-motion'

const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

function allInView() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe = (el: Element) => this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      unobserve() {}
      disconnect() {}
    },
  )
}

describe('HeroMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  test('copy sets the headline and calls to action, and facts fill the figures', () => {
    const { container } = reduced(
      <HeroMotion
        copy={{ headlineLead: 'Books that' }}
        accents={['close themselves.']}
        facts={[{ value: '4,800', label: 'businesses' }]}
        primaryCta={{ label: 'Open an account', href: '/signup' }}
        secondaryCta={null}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Books that close themselves.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open an account' })).toHaveAttribute('href', '/signup')
    expect(screen.getAllByRole('link')).toHaveLength(1)
    const figures = container.querySelector('dl')!
    expect(within(figures).getByText('businesses')).toBeInTheDocument()
    expect(within(figures).queryByText('components')).not.toBeInTheDocument()
  })

  test('empty facts and shortcut hide their rows', () => {
    const { container } = reduced(<HeroMotion facts={[]} shortcut={[]} />)
    expect(container.querySelector('dl')).not.toBeInTheDocument()
    expect(container.querySelector('kbd')).not.toBeInTheDocument()
  })

  test('the calls to action fire their onClick through linkComponent', async () => {
    const user = userEvent.setup()
    const onPrimary = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const onSecondary = vi.fn((e: React.MouseEvent) => e.preventDefault())
    reduced(
      <HeroMotion
        primaryCta={{ label: 'Get started', href: '/start', onClick: onPrimary }}
        secondaryCta={{ label: 'Browse components', href: '/components', onClick: onSecondary }}
        linkComponent={RouterLink}
      />,
    )
    await user.click(screen.getByRole('link', { name: 'Get started' }))
    await user.click(screen.getByRole('link', { name: 'Browse components' }))
    expect(onPrimary).toHaveBeenCalledTimes(1)
    expect(onSecondary).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('data-router')
  })
  test('the headline reads as one sentence for assistive tech while the second line rotates', () => {
    vi.useFakeTimers()
    allInView()
    const { container, unmount } = render(
      <YoujProvider reducedMotion="never">
        <HeroMotion />
      </YoujProvider>,
    )
    const h1 = screen.getByRole('heading', { level: 1, name: 'Interfaces that move with intent.' })
    expect(h1.querySelector('[aria-hidden]')).toHaveTextContent('move with intent.')
    act(() => vi.advanceTimersByTime(4_000))
    expect(h1).toHaveTextContent('respond to touch.')
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName('Interfaces that move with intent.')
    expect(container.querySelector('h1 [aria-hidden]')).toHaveTextContent('respond to touch.')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('reduced motion and a single accent leave the headline still', () => {
    vi.useFakeTimers()
    allInView()
    const { container } = reduced(<HeroMotion />)
    act(() => vi.advanceTimersByTime(20_000))
    expect(container.querySelector('h1 [aria-hidden]')).toHaveTextContent('move with intent.')
  })

  test('the checklist answers: ticking updates the counts, the filter narrows, and a task can be added', async () => {
    const user = userEvent.setup()
    reduced(<HeroMotion />)
    const panel = screen.getByRole('region', { name: 'Try the contract' })
    const filter = within(panel).getByRole('group', { name: 'Show' })
    expect(within(filter).getByRole('button', { name: /^Done 1$/ })).toBeInTheDocument()
    await user.click(within(panel).getByRole('checkbox', { name: 'Run the visual tests' }))
    expect(within(filter).getByRole('button', { name: /^Done 2$/ })).toBeInTheDocument()
    await user.click(within(filter).getByRole('button', { name: /^Open/ }))
    await waitFor(() => expect(within(panel).queryByRole('checkbox', { name: 'Review the pull request' })).not.toBeInTheDocument())
    expect(within(panel).getByRole('checkbox', { name: 'Write the release notes' })).toBeInTheDocument()
    await user.click(within(filter).getByRole('button', { name: /^All/ }))
    await user.click(within(panel).getByRole('button', { name: 'Add a task' }))
    expect(within(panel).getByRole('checkbox', { name: 'Check the rollout in Frankfurt' })).toBeInTheDocument()
  })

  test('the Reduced motion switch and the Speed control reach the nested provider', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <YoujProvider reducedMotion="never">
        <HeroMotion />
      </YoujProvider>,
    )
    const stage = container.querySelector('[data-slot=motion-stage]')!
    const scope = () => stage.closest('[data-yj-reduced]')
    expect(scope()).toBeNull()
    await user.click(screen.getByRole('switch', { name: 'Reduced motion' }))
    expect(scope()).not.toBeNull()
    await user.click(screen.getByRole('button', { name: '2×' }))
    expect(screen.getByRole('button', { name: '2×' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('your tasks drive the checklist, and tuner={false} removes the panel', () => {
    const { rerender } = reduced(<HeroMotion tasks={[{ id: 'a', label: 'Sign the lease', done: false }]} moreTasks={[]} />)
    expect(screen.getByRole('checkbox', { name: 'Sign the lease' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Add a task' })).toBeDisabled()
    rerender(
      <YoujProvider reducedMotion="always">
        <HeroMotion tuner={false} />
      </YoujProvider>,
    )
    expect(screen.queryByRole('region', { name: 'Try the contract' })).not.toBeInTheDocument()
  })

  test('Ship it calls onShip when it is wired', async () => {
    const user = userEvent.setup()
    const onShip = vi.fn(() => Promise.resolve())
    reduced(<HeroMotion onShip={onShip} />)
    await user.click(screen.getByRole('button', { name: 'Ship it' }))
    expect(onShip).toHaveBeenCalledTimes(1)
  })

  test('Ship it runs its demo action and shows it working', async () => {
    const user = userEvent.setup()
    reduced(<HeroMotion />)
    const ship = screen.getByRole('button', { name: 'Ship it' })
    await user.click(ship)
    await waitFor(() => expect(ship).toHaveAttribute('aria-busy', 'true'))
    await waitFor(() => expect(ship).not.toHaveAttribute('aria-busy', 'true'), { timeout: 3000 })
  })
})
