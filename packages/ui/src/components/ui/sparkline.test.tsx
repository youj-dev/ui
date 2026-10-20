import { render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Sparkline } from './sparkline'

describe('Sparkline', () => {
  test('with a label it is a named image; without, decorative', () => {
    const { rerender } = render(<Sparkline data={[1, 3, 2]} label="Signups, rising" />)
    expect(screen.getByRole('img', { name: 'Signups, rising' })).toBeInTheDocument()
    rerender(<Sparkline data={[1, 3, 2]} />)
    expect(document.querySelector('[data-slot=sparkline]')).toHaveAttribute('aria-hidden', 'true')
  })

  test('draws a monotone curve through every point, spanning the box', () => {
    render(<Sparkline data={[0, 10, 5, 10]} area={false} />)
    const d = document.querySelector('[data-slot=sparkline] path')!.getAttribute('d')!
    expect(d.startsWith('M0,')).toBe(true)
    expect(d.match(/C/g)).toHaveLength(3)
    expect(d.endsWith(' 100,3')).toBe(true)
  })

  test('reduced motion: a data change lands at once', async () => {
    const { rerender } = render(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Sparkline data={[1, 2, 3]} area={false} dot={false} />
      </YoujProvider>,
    )
    rerender(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Sparkline data={[3, 2, 1]} area={false} dot={false} />
      </YoujProvider>,
    )
    // At timeScale 50 any real tween would take seconds; this lands on the next frame.
    const d = () => document.querySelector('[data-slot=sparkline] path')!.getAttribute('d')!
    await waitFor(() => expect(d().startsWith('M0,3 ')).toBe(true), { timeout: 500 })
    expect(d().endsWith(' 100,29')).toBe(true)
  })

  test('a fixed domain places values against it', () => {
    render(<Sparkline data={[50, 50]} domain={[0, 100]} area={false} dot={false} />)
    expect(document.querySelector('[data-slot=sparkline] path')!.getAttribute('d')).toMatch(/^M0,16 /)
  })
})
