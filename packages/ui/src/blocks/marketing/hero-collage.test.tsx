import { forwardRef } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { basalt } from '@youj/core'
import { HeroCollage } from './hero-collage'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'Ship together, and watch every release land'

/** Every observed element reports as in view. */
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

/** Stands in for the Web Animations API: each stage's progress line becomes a clock the test can finish. */
function fakeClock() {
  const clocks: { el: Element; finish: () => void; cancelled: boolean; paused: boolean }[] = []
  Element.prototype.animate = function (this: Element) {
    let finish!: () => void
    const finished = new Promise<void>((resolve) => (finish = resolve))
    const clock = { el: this, finish, cancelled: false, paused: false }
    clocks.push(clock)
    return { finished, cancel: () => (clock.cancelled = true), pause: () => (clock.paused = true), play: () => (clock.paused = false) } as unknown as Animation
  }
  /** Only the tour's own clocks. */
  return { all: clocks, tour: () => clocks.filter((c) => c.el.hasAttribute('data-progress')) }
}

describe('HeroCollage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete (Element.prototype as { animate?: unknown }).animate
  })

  test('names the section by its h1 and leads with the trial', () => {
    reduced(<HeroCollage />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start a team trial/ })).toHaveAttribute('href', '#trial')
  })

  test('the cards are a picture: inert, hidden, and none of their controls reach assistive tech', () => {
    const { container } = reduced(<HeroCollage />)
    const layer = container.querySelector('[inert]')!
    expect(layer).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(layer).toHaveTextContent('Queued')
  })

  test('the stages are named buttons; picking one changes the caption, the cards and the current step', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = reduced(<HeroCollage onValueChange={onValueChange} />)
    const group = screen.getByRole('group', { name: 'A release, stage by stage' })
    const review = within(group).getByRole('button', { name: '1 Review, stage 1 of 4' })
    expect(review).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText(/Teammates comment on the live preview/)).toBeInTheDocument()
    await user.click(within(group).getByRole('button', { name: '4 Live, stage 4 of 4' }))
    expect(onValueChange).toHaveBeenCalledWith('live')
    expect(within(group).getByRole('button', { name: '4 Live, stage 4 of 4' })).toHaveAttribute('aria-current', 'step')
    expect(review).not.toHaveAttribute('aria-current')
    expect(screen.getByText(/Everyone is on the new build/)).toBeInTheDocument()
    expect(screen.getByText(/Everyone is on the new build/)).toHaveAttribute('aria-live', 'polite')
    expect(container.querySelector('[inert]')).toHaveTextContent('Deployed to production')
    expect(container.querySelector('[inert]')).toHaveTextContent('Ready')
  })

  test('with motion the tour moves on when a stage’s clock finishes, pauses on request, and stops once a stage is picked', async () => {
    const user = userEvent.setup()
    allInView()
    const clocks = fakeClock()
    render(
      <YoujProvider reducedMotion="never">
        <HeroCollage />
      </YoujProvider>,
    )
    const group = screen.getByRole('group', { name: 'A release, stage by stage' })
    await waitFor(() => expect(clocks.tour().length).toBeGreaterThan(0))
    expect(clocks.tour().at(-1)!.el).toHaveAttribute('data-progress', 'review')
    await act(async () => clocks.tour().at(-1)!.finish())
    await waitFor(() => expect(within(group).getByRole('button', { name: '2 Build, stage 2 of 4' })).toHaveAttribute('aria-current', 'step'))
    await user.click(screen.getByRole('button', { name: 'Pause the tour' }))
    expect(clocks.tour().at(-1)!.paused).toBe(true)
    expect(screen.getByRole('button', { name: 'Play the tour' })).toBeInTheDocument()
    await user.click(within(group).getByRole('button', { name: '1 Review, stage 1 of 4' }))
    expect(screen.queryByRole('button', { name: /the tour/ })).not.toBeInTheDocument()
    expect(clocks.tour().at(-1)!.cancelled).toBe(true)
  })

  test('reduced motion: no tour clock and no play button', () => {
    allInView()
    const clocks = fakeClock()
    reduced(<HeroCollage />)
    expect(clocks.tour()).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /the tour/ })).not.toBeInTheDocument()
  })

  test('the shown stage can be controlled, and your own stages replace the demo’s', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const stages = [
      { id: 'draft', label: 'Draft', caption: 'Write it.' },
      { id: 'send', label: 'Send', caption: 'Ship it.' },
    ]
    reduced(<HeroCollage stages={stages} value="send" onValueChange={onValueChange} />)
    expect(screen.getByText('Ship it.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '1 Draft, stage 1 of 2' }))
    expect(onValueChange).toHaveBeenCalledWith('draft')
    expect(screen.getByRole('button', { name: '2 Send, stage 2 of 2' })).toHaveAttribute('aria-current', 'step')
  })

  test('embedded, the title is an h2 and the host lays it out; a theme wraps it in a ThemeScope', () => {
    const { container } = reduced(<HeroCollage embedded theme={basalt} />)
    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toBeInTheDocument()
    expect(container.querySelector('section')).not.toHaveClass('bg-canvas')
    expect(container.querySelector('[data-yj-theme] > section')).toBeInTheDocument()
  })

  test('copy and the calls to action replace the demo, through linkComponent; rest props reach the section', async () => {
    const user = userEvent.setup()
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const { container } = reduced(
      <HeroCollage
        id="hero"
        copy={{ headline: 'Your whole studio, in one place', eyebrow: '', note: '', stagesLabel: 'Steps' }}
        primaryCta={{ label: 'Book a tour', href: '/tour', onClick }}
        secondaryCta={null}
        linkComponent={RouterLink}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Your whole studio, in one place' })).toBeInTheDocument()
    expect(container.querySelector('section')).toHaveAttribute('id', 'hero')
    expect(screen.getAllByRole('link')).toHaveLength(1)
    const link = screen.getByRole('link', { name: 'Book a tour' })
    expect(link).toHaveAttribute('data-router')
    await user.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('group', { name: 'Steps' })).toBeInTheDocument()
    expect(screen.queryByText('Northwind for teams')).not.toBeInTheDocument()
  })
})
