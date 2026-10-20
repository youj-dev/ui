import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LossWaterfall } from './loss-waterfall'
import { biggestLoss, valueToHeight, waterfallSteps } from './loss-waterfall/math'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('waterfall math', () => {
  test('each loss hangs from where the one before left the level, and what is left stands from the floor', () => {
    const { steps, result, ratio } = waterfallSteps(100, [
      { id: 'a', value: 10 },
      { id: 'b', value: 25 },
    ])
    expect(steps).toEqual([
      { id: 'start', kind: 'start', bottom: 0, top: 100 },
      { id: 'a', kind: 'loss', bottom: 90, top: 100 },
      { id: 'b', kind: 'loss', bottom: 65, top: 90 },
      { id: 'result', kind: 'result', bottom: 0, top: 65 },
    ])
    expect(result).toBe(65)
    expect(ratio).toBe(0.65)
  })

  test('losses never cut below the floor, and no planned time is no efficiency', () => {
    expect(waterfallSteps(30, [{ id: 'a', value: 50 }]).result).toBe(0)
    expect(waterfallSteps(0, []).ratio).toBe(0)
  })

  test('the biggest loss is the first of the largest, and values scale to the drawing’s height', () => {
    expect(biggestLoss([{ id: 'a', value: 5 }, { id: 'b', value: 9 }, { id: 'c', value: 9 }])?.id).toBe('b')
    expect(biggestLoss([])).toBeUndefined()
    expect(valueToHeight(245, 490, 7)).toBe(3.5)
    expect(valueToHeight(10, 0, 7)).toBe(0)
  })
})

describe('loss waterfall block', () => {
  test('says the efficiency and its change, as a section named by an h2', () => {
    reduced(<LossWaterfall />)
    expect(screen.getByRole('heading', { level: 2, name: 'Efficiency' })).toBeInTheDocument()
    expect(screen.getAllByText('71.4%').length).toBeGreaterThan(0)
    expect(screen.getByText('+3.2 pts')).toBeInTheDocument()
  })

  test('the drawing has a text equivalent with the planned time, every loss and the result', () => {
    reduced(<LossWaterfall />)
    const drawing = screen.getByRole('img')
    expect(drawing).toHaveAccessibleName(/Planned time 490 min, less Breakdowns 38 min, Changeover 24 min, Small stops 21 min, Slow cycles 42 min, Scrap 15 min, leaves 350 min: 71.4%/)
  })

  test('the biggest loss is picked and called out, and the drill-in row follows the pick', async () => {
    const user = userEvent.setup()
    const onLossChange = vi.fn()
    const onDrill = vi.fn()
    reduced(<LossWaterfall onLossChange={onLossChange} onDrill={onDrill} />)
    expect(screen.getByRole('button', { name: /Slow cycles 42/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Slow cycles on Weld 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Scrap 15/ }))
    expect(onLossChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'scrap' }))
    await user.click(screen.getByRole('button', { name: /Scrap at Paint/ }))
    expect(onDrill).toHaveBeenCalledWith(expect.objectContaining({ id: 'scrap' }))
  })

  test('your losses, change and words drive the content', () => {
    reduced(<LossWaterfall start={200} change={-2} copy={{ title: 'Output' }} losses={[{ id: 'x', label: 'Jams', value: 50, tone: 'chart-1' }]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Output' })).toBeInTheDocument()
    expect(screen.getAllByText('75.0%').length).toBeGreaterThan(0)
    expect(screen.getByText('-2.0 pts')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Jams 50/ })).toBeInTheDocument()
  })

  test('format writes the figures and copy drops the unit', () => {
    reduced(
      <LossWaterfall
        start={1000}
        change={null}
        format={(n) => `$${n}`}
        copy={{ metric: 'Take-home', loss: (label, value) => `${label} ${value}`, callout: (value) => `−${value}`, drawingLabel: (start, steps, result, percent) => `Gross ${start}, less ${steps}, leaves ${result}: ${percent}` }}
        losses={[
          { id: 'tax', label: 'Tax', value: 200, tone: 'chart-4' },
          { id: 'health', label: 'Health', value: 50, tone: 'chart-1' },
        ]}
      />,
    )
    expect(screen.getByText('Take-home')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tax \$200/ })).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName('Gross $1000, less Tax $200, Health $50, leaves $750: 75.0%')
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<LossWaterfall embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Efficiency' })).toBeInTheDocument()
  })
})
