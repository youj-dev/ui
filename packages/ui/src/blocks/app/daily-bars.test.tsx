import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DailyBars } from './daily-bars'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const chart = () => screen.getByRole('group', { name: 'Visits per day' })
const fact = (label: string) => screen.getByText(label).parentElement!
const figure = () => document.querySelector('[data-slot=stat-value] .sr-only')
const readout = () => document.querySelector('[data-slot=daily-bars-readout]')!

beforeAll(() => {
  // jsdom lays nothing out; the plot draws at the width it measures.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 560 })
})

describe('Daily bars block', () => {
  test('leads with the total and its change, lights the busiest day and reads the data back in the footer', () => {
    reduced(<DailyBars />)
    expect(screen.getByRole('heading', { level: 2, name: 'Daily visits' })).toBeInTheDocument()
    expect(figure()).toHaveTextContent('16,508')
    expect(screen.getByText('vs previous period')).toBeInTheDocument()
    const bars = chart().querySelectorAll('[data-slot=daily-bars-bar]')
    expect(bars).toHaveLength(30)
    expect([...bars].findIndex((b) => b.hasAttribute('data-yj-peak'))).toBe(16)
    expect(fact('Top day')).toHaveTextContent('1,440Sep 17')
    expect(fact('Quietest day')).toHaveTextContent('288Sep 28')
    expect(fact('Daily average')).toHaveTextContent('550')
    // The average is tagged at the end of its dashed line.
    expect(chart()).toHaveTextContent('Avg 550')
  })

  test('the note is a callout over its day, with the day and value first', () => {
    reduced(<DailyBars />)
    const callout = chart().querySelector('[data-slot=daily-bars-callout]')!
    expect(callout).toHaveTextContent('Sep 17 · 1,440Front-page feature')
  })

  test('the arrow keys read a day at a time, Home and End jump, Escape lets go', async () => {
    const user = userEvent.setup()
    reduced(<DailyBars />)
    expect(readout()).toHaveTextContent('Sep 1 – 30')
    await user.tab()
    expect(chart()).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(readout()).toHaveTextContent('Sep 1 · 596')
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(readout()).toHaveTextContent('Sep 3 · 540')
    expect(chart().querySelector('[data-active]')).toBe(chart().querySelectorAll('[data-slot=daily-bars-bar]')[2])
    await user.keyboard('{End}')
    expect(readout()).toHaveTextContent('Sep 30 · 619')
    await user.keyboard('{Home}')
    expect(readout()).toHaveTextContent('Sep 1 · 596')
    await user.keyboard('{Escape}')
    expect(readout()).toHaveTextContent('Sep 1 – 30')
  })

  test('your days, notes and previous total drive the content; copy rewrites the words', () => {
    reduced(
      <DailyBars
        days={[
          { date: '2026-10-01', value: 10 },
          { date: '2026-10-02', value: 40 },
          { date: '2026-10-03', value: 20 },
        ]}
        previousTotal={100}
        notes={[{ date: '2026-10-02', text: 'Launch day' }]}
        copy={{ title: 'Orders', vsPrevious: 'on last week', topDay: 'Best' }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument()
    expect(figure()).toHaveTextContent('70')
    expect(screen.getByText('on last week')).toBeInTheDocument()
    expect(fact('Best')).toHaveTextContent('40Oct 2')
    expect(chart().querySelector('[data-slot=daily-bars-callout]')).toHaveTextContent('Oct 2 · 40Launch day')
    expect(screen.queryByText('Sep 17', { exact: false })).toBeNull()
  })

  test('format writes every figure: units and decimals', () => {
    reduced(
      <DailyBars
        days={[
          { date: '2026-10-01', value: 0.5 },
          { date: '2026-10-02', value: 1.25 },
        ]}
        format={{ style: 'unit', unit: 'inch', unitDisplay: 'short', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
      />,
    )
    expect(figure()).toHaveTextContent('1.75 in')
    expect(fact('Top day')).toHaveTextContent('1.25 inOct 2')
  })

  test('without a previous total there is no change, and without days there is the empty message', () => {
    reduced(<DailyBars days={[{ date: '2026-10-01', value: 5 }]} />)
    expect(screen.queryByText('vs previous period')).toBeNull()
    reduced(<DailyBars days={[]} />)
    expect(screen.getByText('No visits in this period')).toBeInTheDocument()
  })

  test('embedded it is a section named by the title; standalone it draws its own page', () => {
    const { unmount } = reduced(<DailyBars />)
    expect(screen.getByRole('region', { name: 'Daily visits' })).toBeInTheDocument()
    unmount()
    reduced(<DailyBars embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Daily visits' })).toBeInTheDocument()
  })
})
