import { render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Hatch, HatchedBar } from './hatched-bar'

const reduced = (ui: React.ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>
const bar = () => document.querySelector<HTMLElement>('[data-slot=hatched-bar]')!

describe('HatchedBar', () => {
  test('with a label it is an oriented meter; without, decorative', () => {
    const { rerender } = render(<HatchedBar value={9.1} max={10} label="Run 12" valueText="91%" />)
    const meter = screen.getByRole('meter', { name: 'Run 12' })
    expect(meter).toHaveAttribute('data-orientation', 'vertical')
    expect(meter).toHaveAttribute('aria-valuenow', '9.1')
    expect(meter).toHaveAttribute('aria-valuemax', '10')
    expect(meter).toHaveAttribute('aria-valuetext', '91%')
    rerender(<HatchedBar value={0.4} orientation="horizontal" />)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    expect(bar()).toHaveAttribute('aria-hidden', 'true')
    expect(bar()).toHaveAttribute('data-orientation', 'horizontal')
  })

  test('hatched by default, solid on request, and marks its tone', () => {
    const { rerender } = render(<HatchedBar value={0.5} />)
    expect(bar()).toHaveAttribute('data-fill', 'hatched')
    expect(bar()).toHaveAttribute('data-tone', 'neutral')
    rerender(<HatchedBar value={0.5} fill="solid" tone="success" />)
    expect(bar()).toHaveAttribute('data-fill', 'solid')
    expect(bar().style.getPropertyValue('--hatch-color')).toBe('var(--color-success)')
  })

  test('reduced motion: drawn at its value, and a new value lands at once', async () => {
    const { rerender } = render(reduced(<HatchedBar value={30} max={40} />))
    expect(bar().style.getPropertyValue('--hatched-bar-value')).toBe('0.75')
    rerender(reduced(<HatchedBar value={10} max={40} />))
    await waitFor(() => expect(bar().style.getPropertyValue('--hatched-bar-value')).toBe('0.25'), { timeout: 500 })
  })

  test('the Hatch fill is decorative and takes a tone', () => {
    render(<Hatch tone="accent" className="size-3" />)
    const hatch = document.querySelector<HTMLElement>('[data-slot=hatch]')!
    expect(hatch).toHaveAttribute('aria-hidden', 'true')
    expect(hatch.style.getPropertyValue('--hatch-color')).toBe('var(--color-accent)')
  })
})
