import { forwardRef, type ComponentProps } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { Pricing, type PricingComparisonGroup, type PricingPlan } from './pricing'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const plans: PricingPlan[] = [
  { id: 'solo', name: 'Solo', blurb: 'One studio.', price: { monthly: 12, yearly: 10 }, cta: { label: 'Try Solo', href: '/signup/solo' }, features: ['Watermarks'] },
  { id: 'team', name: 'Team', blurb: 'A whole team.', price: { monthly: 40, yearly: 30 }, cta: { label: 'Try Team', href: '/signup/team' }, featured: true, features: ['Proofing'] },
]
const comparison: PricingComparisonGroup[] = [{ group: 'Galleries', rows: [{ feature: 'Proofing', values: [false, true] }] }]

describe('Pricing', () => {
  test('renders the plans and comparison it is given', () => {
    reduced(<Pricing plans={plans} comparison={comparison} />)
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Solo', 'Team', 'Compare plans'])
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Feature', 'Solo', 'Team'])
    expect(within(table).getByText('Not included in Solo')).toBeInTheDocument()
    expect(within(table).getByRole('img', { name: 'Included in Team' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Try Team' })).toHaveAttribute('href', '/signup/team')
  })

  test('an empty comparison hides the table; a plan without cta has no link', () => {
    reduced(<Pricing plans={[{ ...plans[0]!, cta: undefined }]} comparison={[]} />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('copy, currency, locale and headingLevel shape the text', () => {
    reduced(
      <Pricing plans={plans} comparison={comparison} defaultPeriod="monthly" currency="EUR" locale="de-DE" headingLevel={1} copy={{ title: 'Simple prices', perUnit: 'a month', compareTitle: 'Side by side' }} />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Simple prices')
    expect(screen.getByRole('heading', { level: 2, name: 'Side by side' })).toBeInTheDocument()
    expect(screen.getAllByText('a month')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Solo' }).closest('div.flex.h-full')?.textContent).toMatch(/12\s?€/)
  })

  test('onSelectPlan fires with the plan and the period shown', async () => {
    const user = userEvent.setup()
    const onSelectPlan = vi.fn()
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    reduced(<Pricing plans={[{ ...plans[0]!, cta: { ...plans[0]!.cta!, onClick } }, plans[1]!]} comparison={[]} onSelectPlan={onSelectPlan} />)
    await user.click(screen.getByRole('link', { name: 'Try Solo' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onSelectPlan).toHaveBeenCalledWith(expect.objectContaining({ id: 'solo' }), 'yearly')
    await user.click(within(screen.getByRole('group', { name: 'Billing period' })).getByRole('button', { name: 'Monthly' }))
    await user.click(screen.getByRole('link', { name: 'Try Team' }))
    expect(onSelectPlan).toHaveBeenLastCalledWith(plans[1], 'monthly')
  })

  test('the period can be controlled', async () => {
    const user = userEvent.setup()
    const onPeriodChange = vi.fn()
    reduced(<Pricing plans={plans} comparison={[]} period="yearly" onPeriodChange={onPeriodChange} />)
    const period = screen.getByRole('group', { name: 'Billing period' })
    await user.click(within(period).getByRole('button', { name: 'Monthly' }))
    expect(onPeriodChange).toHaveBeenCalledWith('monthly')
    expect(within(period).getByRole('button', { name: 'Yearly' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('linkComponent renders the plan links; extra props reach the root', () => {
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    const { container } = reduced(<Pricing plans={plans} comparison={[]} linkComponent={Link} id="plans" />)
    expect(screen.getByRole('link', { name: 'Try Team' })).toHaveAttribute('data-router')
    expect(container.querySelector('section')).toHaveAttribute('id', 'plans')
  })
  test('on yearly the monthly price stands struck through beside each paid plan, and goes on monthly', async () => {
    const user = userEvent.setup()
    reduced(<Pricing plans={plans} comparison={[]} />)
    expect(screen.getByText('$12 billed monthly')).toBeInTheDocument()
    expect(screen.getByText('$40 billed monthly')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(screen.queryByText(/billed monthly$/)).not.toBeInTheDocument()
  })

  test('two on one page keep their own ids; embedded drops the page; a theme scopes it', () => {
    reduced(
      <>
        <Pricing plans={plans} comparison={[]} />
        <Pricing plans={plans} comparison={[]} embedded theme={brutal} copy={{ title: 'Again' }} />
      </>,
    )
    const [first, second] = screen.getAllByRole('region')
    expect(first).toHaveAccessibleName('Start free. Pay when it works.')
    expect(second).toHaveAccessibleName('Again')
    expect(second!.className).not.toMatch(/py-20/)
    expect(second!.closest('[data-yj-theme]')).not.toBeNull()
    const [a, b] = screen.getAllByRole('link', { name: 'Try Team' })
    expect(a!.getAttribute('aria-describedby')).not.toBe(b!.getAttribute('aria-describedby'))
  })
})
