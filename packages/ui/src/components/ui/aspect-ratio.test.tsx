import { render, screen } from '@testing-library/react'
import { AspectRatio } from './aspect-ratio'

describe('AspectRatio', () => {
  test('sets its ratio as a CSS variable the aspect-ratio utility reads, keeping the caller’s style', () => {
    render(
      <AspectRatio data-testid="frame" ratio={16 / 9} style={{ maxWidth: 320 }}>
        <div />
      </AspectRatio>,
    )
    const frame = screen.getByTestId('frame')
    expect(frame).toHaveClass('aspect-(--ratio)')
    expect(frame.style.getPropertyValue('--ratio')).toBe(String(16 / 9))
    expect(frame.style.maxWidth).toBe('320px')
  })
})
