import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { RadarChart, type RadarChartAxis, type RadarChartSeries } from './radar-chart'

const AXES: RadarChartAxis[] = [
  { id: 'a', label: 'Reasoning', description: 'Multi-step problems.' },
  { id: 'b', label: 'Speed' },
  { id: 'c', label: 'Safety' },
]
const SERIES: RadarChartSeries[] = [
  { id: 'one', name: 'Atlas', values: [80, 40, 60] },
  { id: 'two', name: 'Quill', values: [30, 90, 50], tone: 'chart-4' },
]
const reduced = (ui: React.ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>
const shapes = () => [...document.querySelectorAll('[data-slot=radar-chart-series]')]
const points = () => screen.getAllByRole('img', { hidden: true }).filter((p) => p.getAttribute('data-slot') === 'radar-chart-point')
const readout = () => document.querySelector('[data-slot=radar-chart-readout]')!

describe('RadarChart', () => {
  test('names each point with series, axis and value, and keeps the numbers in a table', () => {
    render(reduced(<RadarChart axes={AXES} series={SERIES} label="Assistants" />))
    expect(screen.getByRole('group', { name: 'Assistants' })).toBeInTheDocument()
    expect(points().map((p) => p.getAttribute('aria-label'))).toContain('Atlas, Reasoning: 80')
    const table = screen.getByRole('table', { name: 'Assistants' })
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Axis', 'Atlas', 'Quill'])
    expect(within(table).getByRole('row', { name: /Speed/ })).toHaveTextContent('4090')
  })

  test('colors series like the other charts: its tone, else its ChartConfig color, else the chart colors in order', () => {
    const three = [...SERIES, { id: 'three', name: 'Moss', values: [50, 50, 50] }]
    const { rerender } = render(reduced(<RadarChart axes={AXES} series={three} />))
    const tones = () => shapes().map((g) => (g as HTMLElement).style.getPropertyValue('--radar-chart-tone'))
    expect(tones()).toEqual(['var(--color-chart-1)', 'var(--color-chart-4)', 'var(--color-chart-3)'])
    const config = { one: { label: 'Atlas', color: 'var(--color-chart-2)' }, two: { color: 'var(--color-chart-5)' } }
    rerender(reduced(<RadarChart axes={AXES} series={three} config={config} />))
    expect(tones()).toEqual(['var(--color-chart-2)', 'var(--color-chart-4)', 'var(--color-chart-3)'])
    expect(document.querySelector<HTMLElement>('[data-slot=radar-chart-legend-item]')!.style.getPropertyValue('--radar-chart-tone')).toBe('var(--color-chart-2)')
  })

  test('draws one closed shape per series with a corner on every axis', () => {
    render(reduced(<RadarChart axes={AXES} series={SERIES} />))
    expect(shapes()).toHaveLength(2)
    const d = shapes()[1]!.querySelector('path')!.getAttribute('d')!
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    expect(d.match(/L/g)).toHaveLength(2)
  })

  test('an axis with a description is described by it', () => {
    render(reduced(<RadarChart axes={AXES} series={SERIES} />))
    expect(screen.getByRole('button', { name: 'Reasoning' })).toHaveAccessibleDescription('Multi-step problems.')
    expect(screen.queryByRole('button', { name: 'Speed' })).not.toBeInTheDocument()
  })

  test('the legend takes a series out of the plot and back', async () => {
    const user = userEvent.setup()
    render(reduced(<RadarChart axes={AXES} series={SERIES} />))
    const quill = screen.getByRole('button', { name: 'Quill' })
    expect(quill).toHaveAttribute('aria-pressed', 'true')
    await user.click(quill)
    expect(quill).toHaveAttribute('aria-pressed', 'false')
    expect(shapes()[1]).toHaveAttribute('data-state', 'hidden')
    expect(points().every((p) => p.getAttribute('aria-label')?.startsWith('Atlas'))).toBe(true)
    await user.click(quill)
    expect(shapes()[1]).toHaveAttribute('data-state', 'shown')
  })

  test('the plot is one tab stop; arrows walk the axes and series, Escape lets go', async () => {
    const user = userEvent.setup()
    render(reduced(<RadarChart axes={AXES} series={SERIES} />))
    expect(points().filter((p) => p.getAttribute('tabindex') === '0')).toHaveLength(1)
    points()[0]!.focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toHaveAttribute('aria-label', 'Atlas, Speed: 40')
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveAttribute('aria-label', 'Quill, Speed: 90')
    await user.keyboard('{Home}')
    expect(document.activeElement).toHaveAttribute('aria-label', 'Quill, Reasoning: 30')
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toHaveAttribute('aria-label', 'Quill, Safety: 50')
    expect(readout()).toHaveAttribute('data-state', 'open')
    await user.keyboard('{Escape}')
    expect(readout()).toHaveAttribute('data-state', 'closed')
  })

  test('hovering a point reads out series, axis and value', () => {
    render(reduced(<RadarChart axes={AXES} series={SERIES} formatValue={(v) => `${v} pts`} />))
    fireEvent.pointerEnter(points()[1]!)
    expect(readout()).toHaveAttribute('data-state', 'open')
    expect(readout()).toHaveTextContent('Atlas · Speed40 pts')
  })

  test('fewer than three axes, or no series, shows the empty state', () => {
    const { rerender } = render(reduced(<RadarChart axes={AXES.slice(0, 2)} series={SERIES} />))
    expect(screen.getByText('No data')).toBeInTheDocument()
    rerender(reduced(<RadarChart axes={AXES} series={[]} />))
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  test('takes its own name and the table header from the labels', () => {
    render(
      <YoujProvider reducedMotion="always" labels={de}>
        <RadarChart axes={AXES} series={SERIES} />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Netzdiagramm' })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Achse')
  })
})
