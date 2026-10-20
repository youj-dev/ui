import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MarketingCta } from './cta'
import { Faq } from './faq'
import { FeatureSpotlight } from './feature-spotlight'
import { MarketingFooter } from './footer'
import { HeroCentered } from './hero-centered'
import { HeroMotion } from './hero-motion'
import { HeroSplit } from './hero-split'
import { MarketingNavbar } from './navbar'
import { NotFound } from './not-found'
import { Pricing } from './pricing'

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n).replace(/\s/g, ' ')
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('marketing blocks', () => {
  test('navbar: a banner with the main navigation, the current page marked, and both calls to action', () => {
    reduced(<MarketingNavbar current="#pricing" />)
    const banner = screen.getByRole('banner')
    const nav = within(banner).getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('button', { name: 'Product' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Pricing' })).toHaveAttribute('aria-current', 'page')
    expect(within(banner).getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '#signup')
    expect(within(banner).getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })

  test('navbar: the Product trigger opens its mega menu', async () => {
    const user = userEvent.setup()
    reduced(<MarketingNavbar />)
    await user.click(screen.getByRole('button', { name: 'Product' }))
    expect(await screen.findByRole('link', { name: /Deployments/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Product' })).toHaveAttribute('aria-expanded', 'true')
  })

  test.each([
    ['centred', <HeroCentered key="c" />, 'Ship the web at the speed of thought', 'Start deploying'],
    ['split', <HeroSplit key="s" />, 'Know how every deploy lands', 'Start for free'],
    ['motion', <HeroMotion key="k" />, 'Interfaces that move with intent.', 'Get started'],
  ])('%s hero: one h1 naming the section, and a primary call to action', (_, ui, title, cta) => {
    reduced(ui)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveAccessibleName(title)
    expect(screen.getByRole('region', { name: title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(cta) })).toBeInTheDocument()
  })

  test('split hero: the product screenshot is inert and hidden from assistive tech', () => {
    const { container } = reduced(<HeroSplit />)
    const shot = container.querySelector('[inert]')
    expect(shot).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('group', { name: 'Visitors' })).not.toBeInTheDocument()
  })

  test('feature spotlight: promoting an older deploy moves the Production badge to it', async () => {
    const user = userEvent.setup()
    reduced(<FeatureSpotlight />)
    for (const name of ['A live URL for every push', 'Undo production in one click', 'See what a deploy did to your numbers'])
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument()
    expect(screen.getAllByText('Production')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Promote dpl_5b90 to production' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Promote dpl_5b90 to production' })).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Promote dpl_8f2a to production' })).toBeInTheDocument()
  })

  test('feature spotlight: switching the metric retitles the chart', async () => {
    const user = userEvent.setup()
    reduced(<FeatureSpotlight />)
    const metric = screen.getByRole('group', { name: 'Metric' })
    await user.click(within(metric).getByRole('button', { name: 'Errors' }))
    expect(within(metric).getByRole('button', { name: 'Errors' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Errors by day')).toBeInTheDocument()
  })

  test('pricing: the period toggle changes every price, and the comparison names what is missing', async () => {
    const user = userEvent.setup()
    reduced(<Pricing />)
    const pro = screen.getByRole('heading', { level: 3, name: 'Pro' }).closest('div.flex.h-full') as HTMLElement
    expect(pro).toHaveTextContent(usd(19))
    expect(pro).toHaveTextContent(`Billed ${usd(228)} yearly`)
    const period = screen.getByRole('group', { name: 'Billing period' })
    await user.click(within(period).getByRole('button', { name: 'Monthly' }))
    expect(pro).toHaveTextContent(usd(24))
    expect(within(pro).getByText('Billed monthly')).toBeInTheDocument()

    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Feature', 'Hobby', 'Pro', 'Scale'])
    const sso = within(table).getByRole('rowheader', { name: 'SSO (SAML)' }).closest('tr') as HTMLElement
    expect(within(sso).getByText('Not included in Pro')).toBeInTheDocument()
    expect(within(sso).getByRole('img', { name: 'Included in Scale' })).toBeInTheDocument()
  })

  test('faq: the first answer is open and the others open on demand', async () => {
    const user = userEvent.setup()
    reduced(<Faq />)
    expect(screen.getByRole('button', { name: 'Is there really a free plan?' })).toHaveAttribute('aria-expanded', 'true')
    const rollback = screen.getByRole('button', { name: 'How does rollback work?' })
    expect(rollback).toHaveAttribute('aria-expanded', 'false')
    await user.click(rollback)
    expect(rollback).toHaveAttribute('aria-expanded', 'true')
  })

  test('cta: a titled region with a primary link', () => {
    reduced(<MarketingCta />)
    expect(screen.getByRole('region', { name: 'Your next deploy could be your first one here' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start deploying/ })).toHaveAttribute('href', '#signup')
  })

  test('footer: a contentinfo landmark, a footer navigation, named social links, and a newsletter that explains a bad address', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn().mockResolvedValue(undefined)
    reduced(<MarketingFooter onSubscribe={onSubscribe} />)
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('navigation', { name: 'Footer' })).toBeInTheDocument()
    for (const name of ['GitHub', 'X', 'LinkedIn']) expect(within(footer).getByRole('link', { name })).toBeInTheDocument()

    const email = within(footer).getByRole('textbox', { name: 'Get the changelog in your inbox' })
    await user.type(email, 'ada')
    await user.click(within(footer).getByRole('button', { name: 'Subscribe' }))
    expect(await screen.findByText('Enter an email like you@company.com.')).toBeInTheDocument()
    expect(onSubscribe).not.toHaveBeenCalled()

    await user.clear(email)
    await user.type(email, 'ada@northwind.dev')
    await user.click(await within(footer).findByRole('button', { name: 'Subscribe' }))
    await waitFor(() => expect(onSubscribe).toHaveBeenCalledWith('ada@northwind.dev'))
    await waitFor(() => expect(email).toHaveValue(''))
  })

  test('not found: a main landmark with one h1, a way home and popular pages', () => {
    reduced(<NotFound />)
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'This page drifted off' })).toBeInTheDocument()
    expect(within(main).getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '#home')
    expect(within(within(main).getByRole('navigation', { name: 'Popular pages' })).getAllByRole('link')).toHaveLength(3)
  })

  test('coming soon: a countdown in named units, and a notify-me form', async () => {
    const user = userEvent.setup()
    const onNotify = vi.fn().mockResolvedValue(undefined)
    const launch = Date.now() + 2 * 86_400_000 + 3 * 3_600_000 + 30_000
    reduced(<NotFound variant="coming-soon" launch={launch} onNotify={onNotify} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Something fast is on its way')
    const countdown = screen.getByLabelText('Time until launch')
    expect(within(countdown).getAllByRole('term').map((t) => t.textContent)).toEqual(['Days', 'Hours', 'Minutes', 'Seconds'])
    expect(within(countdown).getAllByRole('definition')[0]).toHaveTextContent('02')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'grace@northwind.dev')
    await user.click(screen.getByRole('button', { name: 'Notify me' }))
    await waitFor(() => expect(onNotify).toHaveBeenCalledWith('grace@northwind.dev'))
  })
})
