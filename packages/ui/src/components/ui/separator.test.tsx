import { render, screen } from '@testing-library/react'
import { Separator } from './separator'

describe('Separator', () => {
  test('exposes its orientation', () => {
    render(
      <>
        <Separator />
        <Separator orientation="vertical" />
      </>,
    )
    const [h, v] = screen.getAllByRole('separator')
    expect(h).toHaveAttribute('aria-orientation', 'horizontal')
    expect(v).toHaveAttribute('aria-orientation', 'vertical')
  })
})
