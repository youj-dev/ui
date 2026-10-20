import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { PricingPicker, type PricingPickerPlan } from './pricing-picker'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const total = () => screen.getByText('Total per month').nextElementSibling!.querySelector('.sr-only')!.textContent
const radio = (name: string) => screen.getByRole('radio', { name })

describe('pricing picker block', () => {
  test('plans are one radio group; the chosen plan lists what it includes', () => {
    reduced(<PricingPicker />)
    expect(screen.getByRole('region', { name: 'Pick a plan. See exactly what you’ll pay.' })).toBeInTheDocument()
    const group = screen.getByRole('radiogroup', { name: 'Plan' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
    expect(radio('Pro')).toHaveAttribute('aria-checked', 'true')
    expect(radio('Pro')).toHaveAccessibleDescription('For teams shipping to production every day.')
    expect(screen.getByRole('list', { name: 'Pro includes' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Scale includes' })).not.toBeInTheDocument()
  })

  test('the summary: 8 seats of Pro, yearly, with the saving taken off', () => {
    reduced(<PricingPicker />)
    // 8 × $24 list, − 8 × $5 yearly = $152
    expect(total()).toBe('$152')
    expect(screen.getByText('Billed $1,824 once a year.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Continue with Pro/ })).toHaveAttribute('href', '#checkout-pro')
  })

  test('arrow keys move between plans, and the summary follows', async () => {
    const user = userEvent.setup()
    reduced(<PricingPicker />)
    radio('Pro').focus()
    await user.keyboard('{ArrowDown}')
    expect(radio('Scale')).toHaveAttribute('aria-checked', 'true')
    expect(radio('Scale')).toHaveFocus()
    expect(total()).toBe('$632')
    expect(await screen.findByRole('list', { name: 'Scale includes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Continue with Scale/ })).toBeInTheDocument()
  })

  test('seats and period re-price it; monthly billing shows what yearly would save', async () => {
    const user = userEvent.setup()
    reduced(<PricingPicker />)
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(screen.getByRole('textbox', { name: 'Seats' })).toHaveValue('9')
    expect(total()).toBe('$171')
    await user.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(total()).toBe('$216')
    expect(screen.getByText('Switch to save $45 a month')).toBeInTheDocument()
  })

  test('Hobby is one free seat, and the seats field locks', async () => {
    const user = userEvent.setup()
    reduced(<PricingPicker />)
    await user.click(radio('Hobby'))
    expect(total()).toBe('$0')
    expect(screen.getByRole('textbox', { name: 'Seats' })).toHaveValue('1')
    expect(screen.getByRole('textbox', { name: 'Seats' })).toBeDisabled()
    expect(screen.getByText('Hobby is for one person.')).toBeInTheDocument()
  })

  const plans: PricingPickerPlan[] = [
    { id: 'solo', name: 'Solo', blurb: 'One therapist.', price: { monthly: 15, yearly: 12 }, singleSeat: true, features: ['Booking'], cta: { label: 'Go solo', href: '/buy/solo' } },
    { id: 'clinic', name: 'Clinic', blurb: 'A whole practice.', price: { monthly: 30, yearly: 25 }, features: ['Rooms'], cta: { label: 'Open a clinic', href: '/buy/clinic' } },
  ]

  test('plans, brand, currency and locale drive the content', () => {
    reduced(<PricingPicker plans={plans} defaultPlan="clinic" defaultSeats={2} brand={{ name: 'Fieldnote' }} currency="EUR" locale="de-DE" />)
    expect(within(screen.getByRole('radiogroup', { name: 'Plan' })).getAllByRole('radio')).toHaveLength(2)
    expect(screen.getByText('Fieldnote Clinic')).toBeInTheDocument()
    expect(total()!.replace(/\s/g, ' ')).toBe('50 €')
    expect(screen.getByRole('link', { name: /Open a clinic/ })).toHaveAttribute('href', '/buy/clinic')
  })

  test('copy rewrites the strings', () => {
    reduced(<PricingPicker plans={plans} copy={{ title: 'Tarife', seatsLabel: 'Plätze', singleSeatHint: (p) => `${p}: eine Person` }} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Tarife')
    expect(screen.getByRole('textbox', { name: 'Plätze' })).toBeDisabled()
    expect(screen.getByText('Solo: eine Person')).toBeInTheDocument()
  })

  test('the summary link fires onSelectPlan with plan, period and seats through linkComponent', async () => {
    const user = userEvent.setup()
    const onSelectPlan = vi.fn()
    const Link = (p: React.ComponentProps<'a'>) => <a {...p} data-router="" onClick={(e) => (e.preventDefault(), p.onClick?.(e))} />
    reduced(<PricingPicker plans={plans} defaultPlan="clinic" defaultSeats={4} defaultPeriod="monthly" onSelectPlan={onSelectPlan} linkComponent={Link} />)
    const link = screen.getByRole('link', { name: /Open a clinic/ })
    expect(link).toHaveAttribute('data-router')
    await user.click(link)
    expect(onSelectPlan).toHaveBeenCalledWith(plans[1], 'monthly', 4)
  })

  test('plan, seats and period can be controlled', async () => {
    const user = userEvent.setup()
    const onPlanChange = vi.fn()
    const onSeatsChange = vi.fn()
    const onPeriodChange = vi.fn()
    reduced(
      <PricingPicker plans={plans} plan="clinic" onPlanChange={onPlanChange} seats={3} onSeatsChange={onSeatsChange} period="yearly" onPeriodChange={onPeriodChange} />,
    )
    await user.click(radio('Solo'))
    expect(onPlanChange).toHaveBeenCalledWith('solo')
    expect(radio('Clinic')).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onSeatsChange).toHaveBeenCalledWith(4)
    expect(screen.getByRole('textbox', { name: 'Seats' })).toHaveValue('3')
    await user.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(onPeriodChange).toHaveBeenCalledWith('monthly')
    expect(total()).toBe('$75')
  })

  test('headingLevel and rest props reach the section', () => {
    reduced(<PricingPicker headingLevel={1} id="plans" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pick a plan.')
    expect(screen.getByRole('heading', { level: 2, name: 'Order summary' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /Pick a plan/ })).toHaveAttribute('id', 'plans')
  })

  test('embedded: no page padding; a theme renders it inside a ThemeScope', () => {
    reduced(<PricingPicker embedded theme={brutal} />)
    const section = screen.getAllByRole('region')[0]!
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
  })
})
