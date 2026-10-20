import { render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  test('is hidden from assistive tech (the region announces the wait)', () => {
    render(<Skeleton data-testid="sk" />)
    expect(screen.getByTestId('sk')).toHaveAttribute('aria-hidden', 'true')
  })

  test('marks itself for reduced motion so the band stops', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Skeleton data-testid="sk" />
      </YoujProvider>,
    )
    expect(screen.getByTestId('sk')).toHaveAttribute('data-reduced-motion')
  })
})
