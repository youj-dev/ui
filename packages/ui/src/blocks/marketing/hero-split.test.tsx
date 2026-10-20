import { forwardRef } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { HeroSplit } from './hero-split'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const moving = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="never">{ui}</YoujProvider>)
const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)

const points = () => within(screen.getByRole('list', { name: 'What you get' })).getAllByRole('button')

describe('HeroSplit', () => {
  test('copy, points, calls to action and media replace the demo', () => {
    const { container } = reduced(
      <HeroSplit
        copy={{ headline: 'Get paid without chasing anyone', badge: '', url: 'app.ledgerly.com' }}
        points={['Reminders that sound like you']}
        media={<img src="/invoices.png" alt="Invoices this week" />}
        primaryCta={{ label: 'Send an invoice', href: '/invoices/new' }}
        secondaryCta={null}
        headingLevel={2}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Get paid without chasing anyone' })).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Send an invoice' })).toHaveAttribute('href', '/invoices/new')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.queryByText('Analytics, now in every plan')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Invoices this week' })).toBeInTheDocument()
    expect(screen.getByText('app.ledgerly.com')).toBeInTheDocument()
    expect(container.querySelector('[inert]')).not.toBeInTheDocument()
  })

  test('a point without a focus is plain text: no buttons and no tour', () => {
    moving(<HeroSplit points={['Card, bank and wallet payments', 'Payouts in two business days']} media={<img src="/x.png" alt="" />} />)
    expect(within(screen.getByRole('list', { name: 'What you get' })).queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /the tour/ })).not.toBeInTheDocument()
  })

  test('the demo window is hidden decoration; its points are buttons, the first on show', () => {
    const { container } = reduced(<HeroSplit />)
    const picture = container.querySelector('[inert]')!
    expect(picture).toHaveAttribute('aria-hidden', 'true')
    expect(points().map((b) => b.textContent)).toEqual(['Previews on every pull request', 'Rollbacks in under a second', 'Analytics without cookies'])
    expect(points()[0]).toHaveAttribute('aria-current', 'true')
    // Reduced motion: no tour, and the camera rests on the whole window.
    expect(screen.queryByRole('button', { name: /the tour/ })).not.toBeInTheDocument()
    expect(container.querySelector<HTMLElement>('[data-slot="camera"] > div')!.style.transform).not.toMatch(/scale\((?!1\))/)
  })

  test('picking a point shows it, reports it and stops the tour; Play starts it again', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    moving(<HeroSplit onValueChange={onValueChange} />)
    expect(screen.getByRole('button', { name: 'Pause the tour' })).toBeInTheDocument()
    await user.click(points()[1]!)
    expect(onValueChange).toHaveBeenCalledWith('rollbacks')
    expect(points()[1]).toHaveAttribute('aria-current', 'true')
    expect(points()[0]).not.toHaveAttribute('aria-current')
    await user.click(screen.getByRole('button', { name: 'Play the tour' }))
    expect(screen.getByRole('button', { name: 'Pause the tour' })).toBeInTheDocument()
  })

  test('when the line under the point fills, the next point is shown', async () => {
    const animations: { finish: () => void; pause: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn> }[] = []
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      value: vi.fn(() => {
        let finish = () => {}
        const finished = new Promise<void>((resolve) => (finish = resolve))
        const animation = { finished, finish, pause: vi.fn(), play: vi.fn(), cancel: vi.fn() }
        animations.push(animation)
        return animation as unknown as Animation
      }),
    })
    try {
      const onValueChange = vi.fn()
      moving(<HeroSplit onValueChange={onValueChange} />)
      // The camera hasn't settled in yet, so the tour's clock waits.
      expect(animations[0]!.pause).toHaveBeenCalled()
      await act(async () => animations[0]!.finish())
      expect(onValueChange).toHaveBeenLastCalledWith('rollbacks')
      expect(points()[1]).toHaveAttribute('aria-current', 'true')
    } finally {
      delete (Element.prototype as { animate?: unknown }).animate
    }
  })

  test('the app can own the point on show', () => {
    moving(<HeroSplit value="analytics" />)
    expect(points()[2]).toHaveAttribute('aria-current', 'true')
  })

  test('your points can steer your own picture', async () => {
    const user = userEvent.setup()
    moving(
      <HeroSplit
        media={<img src="/invoices.png" alt="Invoices this week" />}
        points={[
          { id: 'paid', label: 'See who has paid', focus: { x: 0.8, y: 0.3, zoom: 2 } },
          { id: 'due', label: 'See what is due', focus: { x: 0.8, y: 0.7 } },
        ]}
      />,
    )
    await user.click(points()[1]!)
    expect(points()[1]).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('img', { name: 'Invoices this week' })).toBeInTheDocument()
  })

  test('each call to action fires its onClick through linkComponent; rest props reach the root', async () => {
    const user = userEvent.setup()
    const onPrimary = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const onSecondary = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const { container } = reduced(
      <HeroSplit
        id="pitch"
        primaryCta={{ label: 'Start for free', href: '/signup', onClick: onPrimary }}
        secondaryCta={{ label: 'Book a demo', href: '/demo', onClick: onSecondary }}
        linkComponent={RouterLink}
      />,
    )
    await user.click(screen.getByRole('link', { name: 'Start for free' }))
    await user.click(screen.getByRole('link', { name: 'Book a demo' }))
    expect(onPrimary).toHaveBeenCalledTimes(1)
    expect(onSecondary).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Book a demo' })).toHaveAttribute('data-router')
    expect(container.querySelector('section')).toHaveAttribute('id', 'pitch')
  })

  test('embedded: an h2 laid out by the host; theme: rendered in a ThemeScope', () => {
    const { container, unmount } = reduced(<HeroSplit embedded />)
    expect(screen.getByRole('heading', { level: 2, name: 'Know how every deploy lands' })).toBeInTheDocument()
    expect(screen.getByRole('region').className).not.toMatch(/bg-canvas/)
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
    unmount()
    const themed = reduced(<HeroSplit theme={brutal} />)
    expect(themed.container.querySelector('[data-yj-theme]')).toContainElement(screen.getByRole('region'))
  })
})
