import { screen } from '@testing-library/react'
import { Parallax } from './parallax'
import { ScrollProgress } from './scroll-progress'
import { installObservers, renderReduced } from '@youj/core/test-utils'

beforeAll(installObservers)

test.each(['bar', 'ring'] as const)('ScrollProgress %s is an accessible progressbar', (variant) => {
  renderReduced(<ScrollProgress variant={variant} label="Reading progress" />)
  const bar = screen.getByRole('progressbar', { name: 'Reading progress' })
  expect(bar).toHaveAttribute('aria-valuemin', '0')
  expect(bar).toHaveAttribute('aria-valuemax', '100')
})

test('Parallax sits at rest with reduced motion', () => {
  renderReduced(
    <Parallax y={[-80, 80]} opacity={[0, 1]} data-testid="p">
      Layer
    </Parallax>,
  )
  const el = screen.getByTestId('p')
  expect(el.style.transform === '' || el.style.transform === 'none').toBe(true)
  expect(el.style.opacity).toBe('')
})
