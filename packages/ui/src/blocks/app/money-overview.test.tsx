import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MoneyOverview } from './money-overview'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

beforeAll(() => {
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

describe('MoneyOverview', () => {
  test('names its regions, and the eye toggle hides every amount', async () => {
    const user = userEvent.setup()
    reduced(<MoneyOverview embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Hi, Sam' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Everyday balance' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Your cards' })).toBeInTheDocument()
    expect(screen.getByText('Corner Market')).toBeInTheDocument()

    const eye = screen.getByRole('button', { name: 'Hide amounts' })
    await user.click(eye)
    expect(eye).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('−$23.40')).not.toBeInTheDocument()
  })

  test('by default, a page of the app’s frame: the shared page header holds the greeting, with no main of its own', () => {
    const { container } = reduced(<MoneyOverview />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot=app-page-header]')).toContainElement(screen.getByRole('heading', { level: 1, name: 'Hi, Sam' }))
    expect(screen.getByRole('region', { name: 'Everyday balance' })).toBeInTheDocument()
  })

  test('sending money reviews the payment, then adds it to today', async () => {
    const user = userEvent.setup()
    reduced(<MoneyOverview />)
    await user.click(screen.getAllByRole('button', { name: /Send/ })[0]!)
    const drawer = await screen.findByRole('dialog', { name: 'Send money' })
    const next = within(drawer).getByRole('button', { name: 'Continue' })
    expect(next).toBeDisabled()
    await user.click(within(drawer).getByRole('button', { name: '+$50' }))
    await user.click(within(drawer).getByRole('button', { name: 'Omar Haddad' }))
    await user.click(next)
    await user.click(await within(drawer).findByRole('button', { name: 'Send $50.00' }))
    const row = (await screen.findByText('−$50.00', undefined, { timeout: 3000 })).closest('li')!
    expect(row).toHaveTextContent('Omar Haddad')
    expect(row).toHaveTextContent('Transfer')
  })
})
