import { forwardRef } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BellIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { HeroProduct } from './hero-product'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
const TITLE = 'See every deploy. Undo any of them.'

describe('HeroProduct', () => {
  test('names the section by its h1, with both calls to action and three callouts', () => {
    reduced(<HeroProduct />)
    const section = screen.getByRole('region', { name: TITLE })
    expect(within(section).getByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()
    expect(within(section).getByRole('link', { name: 'Start deploying' })).toHaveAttribute('href', '#signup')
    expect(within(section).getByRole('link', { name: /Watch the 2-minute tour/ })).toBeInTheDocument()
    const callouts = within(section).getAllByRole('listitem')
    expect(callouts).toHaveLength(3)
    expect(callouts[0]).toHaveTextContent('Roll back in 0.8 seconds')
    expect(callouts[2]).toHaveTextContent('Health in 38 regions')
  })

  test('the product screenshot is inert, hidden from assistive tech and flat under reduced motion', () => {
    const { container } = reduced(<HeroProduct />)
    const shot = container.querySelector('[inert]') as HTMLElement
    expect(shot).toHaveAttribute('aria-hidden', 'true')
    expect(shot).toHaveTextContent('Checkout: remember the last shipping method')
    expect(shot.style.transform).toBe('')
    // Its buttons are part of the picture, not controls.
    expect(screen.queryByRole('button', { name: /Deploy/ })).not.toBeInTheDocument()
  })

  test('embedded, the title is an h2 and the host lays it out; a theme wraps it in a ThemeScope', () => {
    const { container } = reduced(<HeroProduct embedded theme={brutal} />)
    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(container.querySelector('section')).not.toHaveClass('bg-canvas')
    expect(container.querySelector('[data-yj-theme] > section')).toBeInTheDocument()
  })

  test('copy, callouts and media replace the demo; your media keeps its semantics', () => {
    reduced(
      <HeroProduct
        copy={{ headline: 'Every invoice, paid and matched.', url: 'app.ledgerly.com' }}
        callouts={[{ icon: BellIcon, title: 'Reminders that sound like you', description: 'Polite, then firmer.' }]}
        media={<img src="/invoices.png" alt="The invoices view" />}
        mediaSize={{ width: 880, height: 420 }}
        announcement={null}
        secondaryCta={null}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Every invoice, paid and matched.' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByRole('img', { name: 'The invoices view' })).toBeInTheDocument()
    expect(screen.getByText('app.ledgerly.com')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  test('the calls to action fire their onClick through linkComponent; rest props reach the root', async () => {
    const user = userEvent.setup()
    const onPrimary = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const onAnnouncement = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const { container } = reduced(
      <HeroProduct
        id="product"
        headingLevel={2}
        primaryCta={{ label: 'Open an account', href: '/signup', onClick: onPrimary }}
        announcement={{ label: 'Reminders are here', href: '/changelog', onClick: onAnnouncement }}
        linkComponent={RouterLink}
      />,
    )
    await user.click(screen.getByRole('link', { name: 'Open an account' }))
    await user.click(screen.getByRole('link', { name: /Reminders are here/ }))
    expect(onPrimary).toHaveBeenCalledTimes(1)
    expect(onAnnouncement).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('link').every((l) => l.hasAttribute('data-router'))).toBe(true)
    expect(container.querySelector('section')).toHaveAttribute('id', 'product')
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })
})
