import { render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StatPill } from './stat-pill'

const pill = () => document.querySelector('[data-slot=stat-pill]')!
const delta = () => document.querySelector('[data-slot=stat-pill-delta]')

describe('StatPill', () => {
  test('reads as its name, the formatted value and its unit', () => {
    render(<StatPill label="Cache" value={2.4} format={{ maximumFractionDigits: 1 }} unit="GB" locale="en-US" />)
    expect(pill()).toHaveAttribute('data-capsule')
    expect(screen.getByText('Cache')).toHaveAttribute('data-slot', 'capsule-label')
    expect(pill()).toHaveTextContent(/Cache.*2\.4.*GB/)
    expect(delta()).toBeNull()
  })

  test('speaks the direction of a change, and tints it by which way is better', () => {
    const { rerender } = render(<StatPill label="Plays" value={120} delta={4.25} locale="en-US" />)
    expect(delta()).toHaveAttribute('data-direction', 'up')
    expect(delta()).toHaveAttribute('data-tone', 'good')
    expect(delta()).toHaveTextContent('Up 4.3')
    rerender(<StatPill label="Latency" value={42} delta={-6} better="down" locale="en-US" />)
    expect(delta()).toHaveAttribute('data-direction', 'down')
    expect(delta()).toHaveAttribute('data-tone', 'good')
    expect(delta()).toHaveTextContent('Down 6')
    rerender(<StatPill label="Queue" value={18} delta={6} better="down" locale="en-US" />)
    expect(delta()).toHaveAttribute('data-tone', 'bad')
    rerender(<StatPill label="Loudness" value={-8.4} delta={3.4} better="none" locale="en-US" />)
    expect(delta()).toHaveAttribute('data-tone', 'neutral')
    expect(delta()).toHaveTextContent('Up 3.4')
    rerender(<StatPill label="Uptime" value={1} delta={0} locale="en-US" />)
    expect(delta()).toHaveAttribute('data-direction', 'flat')
    expect(delta()).toHaveTextContent('No change')
  })

  test('without a format, a value keeps its own decimals', () => {
    render(<StatPill label="Latency" value={5.3} unit="ms" locale="en-US" />)
    expect(pill()).toHaveTextContent('5.3')
    expect(pill()).not.toHaveTextContent('5.30')
  })

  test('draws a trend with a dot on the latest reading, from two readings up', () => {
    const { rerender } = render(<StatPill label="DSP" value={38} trend={[38]} />)
    expect(document.querySelector('[data-slot=sparkline]')).toBeNull()
    rerender(<StatPill label="DSP" value={38} trend={[22, 30, 38]} />)
    expect(document.querySelector('[data-slot=sparkline]')).toBeInTheDocument()
  })

  test('translates the spoken direction through the provider’s labels', () => {
    render(
      <YoujProvider labels={{ trendUp: 'Gestiegen' }} reducedMotion="always">
        <StatPill label="CPU" value={38} delta={2} locale="de-DE" />
      </YoujProvider>,
    )
    expect(delta()).toHaveTextContent('Gestiegen 2')
  })
})
