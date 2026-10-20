import { render, screen } from '@testing-library/react'
import { Capsule, CapsuleLabel } from './capsule'

describe('Capsule', () => {
  test('carries the shell hook and its size, and passes its own slot through', () => {
    render(
      <>
        <Capsule data-testid="a">
          <CapsuleLabel>Export</CapsuleLabel>
        </Capsule>
        <Capsule data-testid="b" size="sm" data-slot="my-capsule" />
      </>,
    )
    const a = screen.getByTestId('a')
    expect(a).toHaveAttribute('data-capsule')
    expect(a).toHaveAttribute('data-slot', 'capsule')
    expect(a).toHaveAttribute('data-size', 'default')
    expect(screen.getByText('Export')).toHaveAttribute('data-slot', 'capsule-label')
    const b = screen.getByTestId('b')
    expect(b).toHaveAttribute('data-capsule')
    expect(b).toHaveAttribute('data-slot', 'my-capsule')
    expect(b).toHaveAttribute('data-size', 'sm')
  })
})
