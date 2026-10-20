import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { PricingCompare, type PricingCompareGroup, type PricingComparePlan } from './pricing-compare'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('pricing compare block', () => {
  test('each group is a table with plan columns and feature rows; values are announced', () => {
    reduced(<PricingCompare />)
    expect(screen.getByRole('region', { name: 'Every feature, every plan, side by side' })).toBeInTheDocument()
    const security = screen.getByRole('table', { name: 'Security and compliance' })
    expect(within(security).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Feature', 'Hobby', 'Pro', 'Scale', 'Enterprise'])
    const sso = within(security).getByRole('rowheader', { name: /SSO with SAML/ }).closest('tr')!
    expect(within(sso).getAllByRole('cell').map((td) => td.textContent!.replace('–', ''))).toEqual(['Not included', 'Not included', 'Included', 'Included'])
    expect(screen.getAllByRole('table')).toHaveLength(5)
  })

  test('the sticky header names each plan’s call to action', () => {
    reduced(<PricingCompare />)
    expect(screen.getByRole('link', { name: 'Start a trial, Pro' })).toHaveAttribute('href', '#signup-pro')
    expect(screen.getByRole('link', { name: 'Talk to sales, Enterprise' })).toHaveAttribute('href', '#sales')
  })

  test('a group folds away and back from its heading button', async () => {
    const user = userEvent.setup()
    reduced(<PricingCompare />)
    const toggle = screen.getByRole('button', { name: /Edge and performance/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('table', { name: 'Edge and performance' })).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('table', { name: 'Edge and performance' })).toBeInTheDocument()
  })

  test('every feature explains itself in a tooltip on focus', async () => {
    const user = userEvent.setup()
    reduced(<PricingCompare />)
    await user.hover(screen.getByRole('button', { name: 'About Deploy approvals' }))
    expect(await screen.findByText('Require a reviewer before a deploy reaches production.')).toBeInTheDocument()
  })

  test('the phone plan switch picks which plan column shows', async () => {
    const user = userEvent.setup()
    const { container } = reduced(<PricingCompare />)
    const hidden = () => [...container.querySelectorAll('thead th')].slice(0, 5).map((th) => th.className.includes('max-md:hidden'))
    expect(hidden()).toEqual([false, true, false, true, true])
    await user.click(within(screen.getByRole('group', { name: 'Plan to compare' })).getByRole('button', { name: 'Enterprise' }))
    expect(hidden()).toEqual([false, true, true, true, false])
  })

  const plans: PricingComparePlan[] = [
    { id: 'starter', name: 'Starter', price: '€9', per: 'month', cta: { label: 'Open a shop', href: '/signup/starter' } },
    { id: 'growth', name: 'Growth', price: '€29', per: 'month', cta: { label: 'Grow', href: '/signup/growth' } },
  ]
  const groups: PricingCompareGroup[] = [{ name: 'Selling', rows: [{ feature: 'Discount codes', values: [false, true] }] }]

  test('plans and groups drive the matrix; a row without a tip has no tooltip button', () => {
    reduced(<PricingCompare plans={plans} groups={groups} recommended="growth" />)
    const table = screen.getByRole('table', { name: 'Selling' })
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['Feature', 'Starter', 'Growth'])
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'About Discount codes' })).not.toBeInTheDocument()
    expect(screen.getByText('Recommended').closest('p')).toHaveTextContent('Growth')
  })

  test('copy rewrites the strings', () => {
    reduced(<PricingCompare plans={plans} groups={groups} copy={{ title: 'Shop plans', included: 'Yes', notIncluded: 'No', ctaLabel: (cta, plan) => `${plan}: ${cta}` }} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Shop plans')
    const row = screen.getByRole('rowheader', { name: 'Discount codes' }).closest('tr')!
    expect(within(row).getAllByRole('cell').map((td) => td.textContent!.replace('–', ''))).toEqual(['No', 'Yes'])
    expect(screen.getByRole('link', { name: 'Growth: Grow' })).toHaveAttribute('href', '/signup/growth')
  })

  test('a plan link renders through linkComponent and fires onSelectPlan and its own onClick', async () => {
    const user = userEvent.setup()
    const onSelectPlan = vi.fn()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const Link = (p: React.ComponentProps<'a'>) => <a {...p} data-router="" />
    const withClick = [{ ...plans[0]!, cta: { ...plans[0]!.cta!, onClick } }, plans[1]!]
    reduced(<PricingCompare plans={withClick} groups={groups} onSelectPlan={onSelectPlan} linkComponent={Link} />)
    const link = screen.getByRole('link', { name: 'Open a shop, Starter' })
    expect(link).toHaveAttribute('data-router')
    expect(link).toHaveAttribute('href', '/signup/starter')
    await user.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onSelectPlan).toHaveBeenCalledWith(withClick[0])
  })

  test('a plan without a cta has no call to action', () => {
    reduced(<PricingCompare plans={[{ id: 'free', name: 'Free', price: '€0' }]} groups={[]} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('the shown plan can be controlled', async () => {
    const user = userEvent.setup()
    const onPlanChange = vi.fn()
    reduced(<PricingCompare plans={plans} groups={groups} plan="starter" onPlanChange={onPlanChange} />)
    const picker = screen.getByRole('group', { name: 'Plan to compare' })
    await user.click(within(picker).getByRole('button', { name: 'Growth' }))
    expect(onPlanChange).toHaveBeenCalledWith('growth')
    expect(within(picker).getByRole('button', { name: 'Starter' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('headingLevel sets the section heading and its groups one below; rest props reach the root', () => {
    reduced(<PricingCompare plans={plans} groups={groups} headingLevel={3} id="plans" data-testid="root" />)
    expect(screen.getByRole('heading', { level: 3, name: 'Every feature, every plan, side by side' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: /Selling/ })).toBeInTheDocument()
    expect(screen.getByTestId('root')).toHaveAttribute('id', 'plans')
  })

  test('embedded: no page padding; a theme renders it inside a ThemeScope', () => {
    reduced(<PricingCompare embedded theme={brutal} />)
    const section = screen.getByRole('region', { name: 'Every feature, every plan, side by side' })
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
  })
})
