import { render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Spinner } from './spinner'

describe('Spinner', () => {
  test('announces its label politely', () => {
    render(<Spinner label="Syncing" />)
    expect(screen.getByRole('status')).toHaveTextContent('Syncing')
  })

  test('label={null} is silent and decorative', () => {
    render(<Spinner label={null} data-testid="spin" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByTestId('spin').querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  test('under reduced motion the ring holds still at rest', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Spinner data-testid="spin" />
      </YoujProvider>,
    )
    expect(screen.getByTestId('spin').querySelector('svg')).toHaveAttribute('data-state', 'rest')
  })
})
