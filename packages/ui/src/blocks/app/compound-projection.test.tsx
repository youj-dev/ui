import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CompoundProjection } from './compound-projection'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const bars = () => within(screen.getByRole('list', { name: 'Projected balance by year' })).getAllByRole('img')

describe('Compound projection block', () => {
  test('shows today against the last year, the split, the average return and the disclaimer', () => {
    reduced(<CompoundProjection />)
    expect(screen.getByRole('heading', { level: 2, name: 'Growth forecast' })).toBeInTheDocument()
    expect(screen.getByText('7% avg. return')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('$2,500')).toBeInTheDocument()
    expect(screen.getByText('Year 10')).toBeInTheDocument()
    expect(screen.getAllByText('$48,295').length).toBeGreaterThan(0)
    expect(screen.getByText('$32,500 put in, $15,795 growth')).toBeInTheDocument()
    expect(screen.getByText(/Returns are not guaranteed/)).toBeInTheDocument()
  })

  test('draws one rising bar per year, and each is read with its balance and what was put in', () => {
    reduced(<CompoundProjection />)
    expect(bars()).toHaveLength(10)
    expect(bars()[0]).toHaveAccessibleName('Year 1: $5,779, $5,500 contributed')
    expect(bars()[9]).toHaveAccessibleName('Year 10: $48,295, $32,500 contributed')
    expect(bars()[9]!.querySelector('.bg-accent')).not.toBeNull()
    expect(bars()[0]!.querySelector('.bg-accent')).toBeNull()
  })

  test('the contribution stepper drives the projection', async () => {
    const user = userEvent.setup()
    const onPlanChange = vi.fn()
    reduced(<CompoundProjection onPlanChange={onPlanChange} />)
    await user.click(screen.getByRole('button', { name: /increase/i }))
    expect(onPlanChange).toHaveBeenLastCalledWith({ monthly: 300, years: 10, rate: 0.07 })
    expect(screen.getAllByText('$56,950').length).toBeGreaterThan(0)
    expect(screen.getByText('$38,500 put in, $18,450 growth')).toBeInTheDocument()
  })

  test('the years slider adds bars, and a long plan groups them into at most ten', async () => {
    const user = userEvent.setup()
    reduced(<CompoundProjection />)
    const years = screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === 'Years')!
    expect(years).toHaveAttribute('aria-valuetext', '10 years')
    years.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('Year 11')).toBeInTheDocument()
    expect(screen.getAllByText('$54,885').length).toBeGreaterThan(0)
    expect(bars()).toHaveLength(6)
    expect(bars().at(-1)).toHaveAccessibleName('Year 11: $54,885, $35,500 contributed')
  })

  test('the return select changes the pill and the balance', async () => {
    const user = userEvent.setup()
    reduced(<CompoundProjection />)
    await user.click(screen.getByRole('combobox', { name: 'Annual return' }))
    await user.click(await screen.findByRole('option', { name: '5%' }))
    await waitFor(() => expect(screen.getByText('5% avg. return')).toBeInTheDocument())
    expect(screen.queryAllByText('$48,295')).toHaveLength(0)
  })

  test('Start runs onStart with the plan and shows it done', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn().mockResolvedValue(undefined)
    reduced(<CompoundProjection onStart={onStart} defaultPlan={{ monthly: 100, years: 5, rate: 0.05 }} />)
    await user.click(screen.getByRole('button', { name: 'Start investing' }))
    expect(onStart).toHaveBeenCalledWith({ monthly: 100, years: 5, rate: 0.05 })
  })

  test('copy rewrites the text, and the locale and currency format every amount', () => {
    reduced(<CompoundProjection locale="de-DE" copy={{ currency: 'EUR', title: 'Sparplan', disclaimer: 'Keine Garantie.' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Sparplan' })).toBeInTheDocument()
    expect(screen.getByText('Keine Garantie.')).toBeInTheDocument()
    expect(screen.getAllByText(/48\.295\s€/).length).toBeGreaterThan(0)
    expect(screen.getByText(/^7\s%\savg\. return$/)).toBeInTheDocument()
  })
})

describe('Compound projection with your data', () => {
  const readers = (value: number) => `${Math.round(value)} readers`
  const data = {
    initial: 100,
    defaultPlan: { monthly: 10, years: 2, rate: 0 },
    rates: [0, 0.1],
    format: readers,
    copy: {
      title: 'Subscribers',
      rateBadge: (rate: string) => `${rate} on referrals`,
      split: (added: string, gain: string) => `${added} from sign-ups, ${gain} from referrals`,
      contribution: 'New readers a month',
      rate: 'Referral growth',
      today: 'Now',
      year: (year: string) => `In ${year} years`,
      bars: 'Readers by year',
      bar: (year: string, total: string, added: string) => `${year}: ${total}, ${added} from sign-ups`,
    },
  }

  test('your format, rates and labels drive every figure and name', () => {
    reduced(<CompoundProjection {...data} />)
    // 100 today and 10 a month for 2 years, no rate: 340.
    // The headline and the last bar's value.
    expect(screen.getAllByText('340 readers').length).toBeGreaterThan(0)
    expect(screen.getByText('100 readers')).toBeInTheDocument()
    expect(screen.getByText('Now')).toBeInTheDocument()
    expect(screen.getByText('In 2 years')).toBeInTheDocument()
    expect(screen.getByText('0% on referrals')).toBeInTheDocument()
    expect(screen.getByText('340 readers from sign-ups, 0 readers from referrals')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Readers by year' })).getAllByRole('img')[1]).toHaveAccessibleName(
      'In 2 years: 340 readers, 340 readers from sign-ups',
    )
    expect(screen.getByRole('combobox', { name: 'Referral growth' })).toBeInTheDocument()
    expect(screen.getByLabelText('New readers a month')).toHaveValue('10')
  })

  test('the rate select offers your rates', async () => {
    const user = userEvent.setup()
    reduced(<CompoundProjection {...data} />)
    await user.click(screen.getByRole('combobox', { name: 'Referral growth' }))
    expect(await screen.findByRole('option', { name: '10%' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '7%' })).toBeNull()
  })

  test('loading shows skeletons and no demo figures', () => {
    reduced(<CompoundProjection loading />)
    expect(screen.getByText('Loading the projection')).toBeInTheDocument()
    expect(screen.queryByText(/48,295|2,500/)).toBeNull()
    expect(screen.queryByRole('list', { name: 'Projected balance by year' })).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.getByRole('button', { name: 'Start investing' })).toBeDisabled()
  })

  test('an error shows its message and Retry in place of the bars', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<CompoundProjection error="Couldn’t load" onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load')).toBeInTheDocument()
    expect(screen.queryByText(/48,295|2,500/)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('no years shows the empty message, or your own', () => {
    const { unmount } = reduced(<CompoundProjection defaultPlan={{ monthly: 100, years: 0, rate: 0.05 }} />)
    expect(screen.getByText('Nothing to project yet')).toBeInTheDocument()
    unmount()
    reduced(<CompoundProjection defaultPlan={{ monthly: 100, years: 0, rate: 0.05 }} empty={<p>Pick the years</p>} />)
    expect(screen.getByText('Pick the years')).toBeInTheDocument()
  })
})
