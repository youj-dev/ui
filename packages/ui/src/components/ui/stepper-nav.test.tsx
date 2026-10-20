import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepperNav } from './stepper-nav'

const steps = [
  { id: 'cart', title: 'Cart' },
  { id: 'shipping', title: 'Shipping' },
  { id: 'payment', title: 'Payment' },
  { id: 'review', title: 'Review' },
]

function Steps({ onNavigate }: { onNavigate?: (i: number) => void }) {
  return <StepperNav aria-label="Checkout" steps={steps} current={1} href={(i) => `/checkout/${steps[i]!.id}`} onNavigate={onNavigate} />
}

describe('StepperNav', () => {
  test('a named nav around an ordered list of steps', () => {
    render(<Steps />)
    const nav = screen.getByRole('navigation', { name: 'Checkout' })
    expect(nav.querySelector('ol')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  test('done and current steps link to their pages; upcoming ones are not links', () => {
    render(<Steps />)
    expect(screen.getByRole('link', { name: /Cart/ })).toHaveAttribute('href', '/checkout/cart')
    expect(screen.getByRole('link', { name: /Shipping/ })).toHaveAttribute('href', '/checkout/shipping')
    expect(screen.queryByRole('link', { name: /Payment/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Shipping/ }).closest('li')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('link', { name: /Cart/ })).toHaveAccessibleName(/completed/)
  })

  test('keyboard: Tab reaches only the reachable steps, Enter follows one', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<Steps onNavigate={onNavigate} />)
    await user.tab()
    expect(screen.getByRole('link', { name: /Cart/ })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: /Shipping/ })).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
    await user.tab({ shift: true })
    await user.keyboard('{Enter}')
    expect(onNavigate).toHaveBeenCalledWith(1)
  })
})
