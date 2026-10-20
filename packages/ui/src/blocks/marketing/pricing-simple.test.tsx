import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { PricingSimple } from './pricing-simple'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const price = () => screen.getByText('per seat a month').previousElementSibling!.querySelector('.sr-only')!.textContent

describe('pricing simple block', () => {
  test('one plan: the section, its price, its one call to action and what it includes', () => {
    reduced(<PricingSimple />)
    const section = screen.getByRole('region', { name: 'One plan. Everything in it.' })
    expect(price()).toBe('$19')
    expect(within(section).getByRole('link', { name: /Start a 14-day trial/ })).toHaveAttribute('href', '#trial')
    const included = within(section).getByRole('heading', { level: 3, name: 'Everything’s included' }).parentElement!.nextElementSibling as HTMLElement
    expect(within(included).getAllByRole('listitem')).toHaveLength(12)
  })

  test('the currency control re-prices the plan, with arrow keys too', async () => {
    const user = userEvent.setup()
    reduced(<PricingSimple />)
    const currency = screen.getByRole('group', { name: 'Currency' })
    await user.click(within(currency).getByRole('button', { name: 'EUR' }))
    expect(price()).toBe('€18')
    expect(within(currency).getByRole('button', { name: 'EUR' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(currency).getByRole('button', { name: 'GBP' }))
    expect(price()).toBe('£15')
  })

  test('reduced motion: every feature is already checked', () => {
    const { container } = reduced(<PricingSimple />)
    expect(container.querySelectorAll('li svg')).toHaveLength(12 + 3)
  })

  test('with motion, the features tick off one at a time and the timer stops on unmount', () => {
    vi.useFakeTimers()
    // The list is on screen at once.
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe() {
          this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
        }
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return []
        }
      },
    )
    try {
      const { container, unmount } = render(
        <YoujProvider reducedMotion="never">
          <PricingSimple />
        </YoujProvider>,
      )
      const checks = () => container.querySelectorAll('ul.grid li svg').length
      expect(checks()).toBe(0)
      act(() => vi.advanceTimersByTime(200))
      expect(checks()).toBeGreaterThan(0)
      expect(checks()).toBeLessThan(12)
      act(() => vi.advanceTimersByTime(2000))
      expect(checks()).toBe(12)
      unmount()
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })

  test('prices, features, reassurances, questions, cta and brand drive the content', () => {
    reduced(
      <PricingSimple
        prices={{ CHF: 22, EUR: 20 }}
        defaultCurrency="CHF"
        locale="de-CH"
        features={['Unlimited rooms', 'Invoices']}
        reassurances={[{ text: 'Swiss hosting.' }]}
        questions={[{ question: 'Is there a contract?', answer: 'No, cancel monthly.' }]}
        cta={{ label: 'Try Fieldnote', href: '/signup' }}
        brand={{ name: 'Fieldnote' }}
      />,
    )
    expect(price()!.replace(/\s/g, ' ')).toMatch(/CHF.?22/)
    expect(screen.getByRole('link', { name: /Try Fieldnote/ })).toHaveAttribute('href', '/signup')
    expect(screen.getByText('Fieldnote')).toBeInTheDocument()
    expect(screen.getByText('Unlimited rooms')).toBeInTheDocument()
    expect(screen.getByText('Swiss hosting.')).toBeInTheDocument()
    expect(screen.getByRole('term')).toHaveTextContent('Is there a contract?')
    expect(within(screen.getByRole('group', { name: 'Currency' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['CHF', 'EUR'])
  })

  test('copy rewrites the strings; an empty questions list hides them', () => {
    reduced(<PricingSimple questions={[]} copy={{ title: 'Ein Tarif.', perUnit: 'pro Platz', includedTitle: 'Alles drin', ctaNote: '' }} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Ein Tarif.')
    expect(screen.getByText('pro Platz')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Alles drin')
    expect(screen.queryByText('No card needed to start.')).not.toBeInTheDocument()
    expect(screen.queryByRole('term')).not.toBeInTheDocument()
  })

  test('the cta fires its onClick; links go through linkComponent', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const Link = (p: React.ComponentProps<'a'>) => <a {...p} data-router="" />
    reduced(<PricingSimple cta={{ label: 'Go', href: '/go', onClick }} linkComponent={Link} />)
    await user.click(screen.getByRole('link', { name: /Go/ }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Talk to us' })).toHaveAttribute('data-router')
  })

  test('the currency can be controlled', async () => {
    const user = userEvent.setup()
    const onCurrencyChange = vi.fn()
    reduced(<PricingSimple currency="USD" onCurrencyChange={onCurrencyChange} />)
    await user.click(screen.getByRole('button', { name: 'EUR' }))
    expect(onCurrencyChange).toHaveBeenCalledWith('EUR')
    expect(price()).toBe('$19')
  })

  test('headingLevel and rest props reach the section', () => {
    reduced(<PricingSimple headingLevel={1} id="pricing" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('One plan.')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Everything’s included')
    expect(screen.getByRole('region')).toHaveAttribute('id', 'pricing')
  })

  test('embedded: no page padding; a theme renders it inside a ThemeScope', () => {
    reduced(<PricingSimple embedded theme={brutal} />)
    const section = screen.getByRole('region')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
  })
})
