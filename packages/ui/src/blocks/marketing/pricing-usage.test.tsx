import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { PricingUsage, type PricingUsageMeter, type PricingUsagePlans } from './pricing-usage'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

/* jsdom has no layout, so Base UI keeps thumbs hidden: find them by their aria-label. */
const slider = (name: string) => screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === name)!
const total = () => screen.getByText('Per month').nextElementSibling!.querySelector('.sr-only')!.textContent

describe('pricing usage block', () => {
  test('names the section, and each meter announces its value with units', () => {
    reduced(<PricingUsage />)
    expect(screen.getByRole('region', { name: 'Pay for what you serve, not for what you might' })).toBeInTheDocument()
    expect(slider('Edge requests a month')).toHaveAttribute('aria-valuetext', '18 million')
    expect(slider('Bandwidth a month')).toHaveAttribute('aria-valuetext', '1.6 terabytes')
    expect(slider('Build minutes a month')).toHaveAttribute('aria-valuetext', '9,000 minutes')
  })

  test('the receipt adds Pro’s base to each meter’s overage', () => {
    reduced(<PricingUsage />)
    // $24 base + 8M requests × $2 + 600 GB × $0.15 + 3,000 minutes × $0.01
    expect(total()).toBe('$160')
    expect(screen.getByText('Fits Pro')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start a Pro trial/ })).toHaveAttribute('href', '#signup-pro')
  })

  test('stepping a meter with the keyboard re-prices it', async () => {
    const user = userEvent.setup()
    reduced(<PricingUsage />)
    slider('Edge requests a month').focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(slider('Edge requests a month')).toHaveAttribute('aria-valuetext', '20 million')
    expect(total()).toBe('$164')
  })

  test('small usage fits Hobby for free; heavy usage points at Scale and sales', () => {
    const { unmount } = reduced(<PricingUsage defaultUsage={{ requests: 1_000_000, bandwidth: 0.1, minutes: 500 }} />)
    expect(total()).toBe('$0')
    expect(screen.getByText('Fits Hobby')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start free on Hobby/ })).toBeInTheDocument()
    unmount()
    reduced(<PricingUsage defaultUsage={{ requests: 82_000_000, bandwidth: 3.4, minutes: 21_000 }} />)
    expect(screen.getByText('Fits Scale')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Talk to sales/ })).toHaveAttribute('href', '#sales')
  })

  test('announces the settled estimate once, not every step, and clears its timer on unmount', () => {
    vi.useFakeTimers()
    try {
      const { unmount } = reduced(<PricingUsage />)
      const status = screen.getByRole('status')
      expect(status).toHaveTextContent('')
      act(() => vi.advanceTimersByTime(1000))
      expect(status).toHaveTextContent('Estimated $160 a month on Pro.')
      unmount()
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  const meters: PricingUsageMeter[] = [
    { id: 'gb', label: 'Storage', unit: 'stored', min: 0, max: 1000, step: 10, free: 10, included: 100, perStep: 1, rate: '€1 per 10 GB', format: {}, show: (v) => `${v} GB` },
  ]
  const plans: PricingUsagePlans = {
    free: { id: 'free', name: 'Free', note: 'Nothing to pay.', cta: { label: 'Sign up', href: '/signup' } },
    base: { id: 'team', name: 'Team', note: 'Monthly invoice.', cta: { label: 'Start Team', href: '/team' } },
    committed: { id: 'org', name: 'Org', note: 'Let’s talk.' },
  }

  test('meters, plans, base price, currency and locale drive the estimate', () => {
    reduced(<PricingUsage meters={meters} plans={plans} basePrice={10} defaultUsage={{ gb: 300 }} currency="EUR" locale="de-DE" />)
    expect(screen.getAllByRole('slider', { hidden: true })).toHaveLength(1)
    // €10 base + 20 steps × €1
    expect(total()!.replace(/\s/g, ' ')).toBe('30 €')
    expect(screen.getByText('Fits Team')).toBeInTheDocument()
    expect(screen.getByText('Team includes 100 GB')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Start Team/ })).toHaveAttribute('href', '/team')
  })

  test('the committed plan without a cta shows no link', () => {
    reduced(<PricingUsage meters={meters} plans={plans} committedFrom={50} defaultUsage={{ gb: 1000 }} />)
    expect(screen.getByText('Fits Org')).toBeInTheDocument()
    expect(screen.getByText('Let’s talk.')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('copy rewrites the strings', () => {
    reduced(<PricingUsage copy={{ title: 'Estimate your bill', total: 'Monthly', fits: (p) => `${p} it is` }} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Estimate your bill')
    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Pro it is')).toBeInTheDocument()
  })

  test('the cta fires onSelectPlan with the plan, usage and total through linkComponent', async () => {
    const user = userEvent.setup()
    const onSelectPlan = vi.fn()
    const Link = (p: React.ComponentProps<'a'>) => <a {...p} data-router="" onClick={(e) => (e.preventDefault(), p.onClick?.(e))} />
    reduced(<PricingUsage meters={meters} plans={plans} basePrice={10} defaultUsage={{ gb: 300 }} onSelectPlan={onSelectPlan} linkComponent={Link} />)
    const link = screen.getByRole('link', { name: /Start Team/ })
    expect(link).toHaveAttribute('data-router')
    await user.click(link)
    expect(onSelectPlan).toHaveBeenCalledWith(plans.base, { gb: 300 }, 30)
  })

  test('the usage can be controlled', async () => {
    const user = userEvent.setup()
    const onUsageChange = vi.fn()
    reduced(<PricingUsage usage={{ requests: 18_000_000, bandwidth: 1.6, minutes: 9_000 }} onUsageChange={onUsageChange} />)
    slider('Edge requests a month').focus()
    await user.keyboard('{ArrowRight}')
    expect(onUsageChange).toHaveBeenCalledWith({ requests: 19_000_000, bandwidth: 1.6, minutes: 9_000 })
    expect(slider('Edge requests a month')).toHaveAttribute('aria-valuetext', '18 million')
  })

  test('headingLevel and rest props reach the section', () => {
    const { container } = reduced(<PricingUsage headingLevel={3} id="estimate" />)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Pay for what you serve')
    expect(container.querySelector('section')).toHaveAttribute('id', 'estimate')
  })

  test('embedded: no page padding; a theme renders it inside a ThemeScope', () => {
    const { container } = reduced(<PricingUsage embedded theme={brutal} />)
    const section = within(container).getByRole('region')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
  })
})
