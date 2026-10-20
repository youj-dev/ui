import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RunningTotal } from './running-total'
import { CURRENT, PREVIOUS } from './running-total/data'
import { cumulative, passedAt } from './running-total/stats'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const chart = () => screen.getByRole('group', { name: 'Signups, running total' })
const fact = (label: string) => screen.getByText(label).parentElement!
const readout = () => document.querySelector('[data-slot=running-total-readout]')!
const total = (values: number[]) => cumulative(values).at(-1)!.toLocaleString('en-US')

beforeAll(() => {
  // jsdom lays nothing out; the plot draws at the width it measures.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 560 })
})

describe('Running total block', () => {
  test('leads with the running total and its change, and both lines end in their value', () => {
    reduced(<RunningTotal />)
    expect(screen.getByRole('heading', { level: 2, name: 'Signups' })).toBeInTheDocument()
    expect(screen.getByText('vs previous period')).toBeInTheDocument()
    const ends = [...chart().querySelectorAll('[data-slot=running-total-end]')].map((e) => e.textContent)
    expect(ends).toEqual([total(PREVIOUS), total(CURRENT)])
    expect(screen.getAllByText(total(CURRENT))[0]).toBeInTheDocument()
  })

  test('the gap is washed, and the footer says when the previous total was passed', () => {
    reduced(<RunningTotal />)
    expect(chart().querySelectorAll('[data-slot=running-total-gap]').length).toBeGreaterThan(0)
    const day = passedAt(cumulative(CURRENT), cumulative(PREVIOUS).at(-1)!)!
    const label = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(Date.UTC(2026, 8, 1 + day))
    expect(fact('Passed last period')).toHaveTextContent(label)
    expect(fact('Best day')).toHaveTextContent('1,180Sep 17')
  })

  test('the note sits at its point on the line, with the day and the total first', () => {
    reduced(<RunningTotal />)
    const callout = chart().querySelector('[data-slot=running-total-callout]')!
    expect(callout).toHaveTextContent(`Sep 17 · ${cumulative(CURRENT)[16]!.toLocaleString('en-US')}Newsletter feature`)
  })

  test('the arrow keys read a day against the previous period, Escape lets go', async () => {
    const user = userEvent.setup()
    reduced(<RunningTotal />)
    expect(readout()).toBeEmptyDOMElement()
    await user.tab()
    expect(chart()).toHaveFocus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(readout()).toHaveTextContent(`Sep 2 · ${cumulative(CURRENT)[1]!.toLocaleString('en-US')} vs ${cumulative(PREVIOUS)[1]!.toLocaleString('en-US')}`)
    await user.keyboard('{Escape}')
    expect(readout()).toBeEmptyDOMElement()
  })

  test('behind the previous period it washes in danger and says it has not passed yet', () => {
    reduced(<RunningTotal current={[1, 1, 1]} previous={[5, 5, 5, 5]} note={undefined} start="2026-10-01" copy={{ title: 'Orders', notYet: 'Not yet' }} />)
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument()
    expect(chart().querySelector('[data-slot=running-total-gap]')).toHaveAttribute('data-yj-ahead', 'false')
    expect(fact('Passed last period')).toHaveTextContent('Not yet')
    expect(chart().querySelector('[data-slot=running-total-callout]')).toBeNull()
  })

  test('format writes every figure: currency', () => {
    reduced(<RunningTotal current={[100, 250]} previous={[80, 90]} start="2026-10-01" note={undefined} format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }} />)
    expect(fact('Best day')).toHaveTextContent('$250Oct 2')
    expect(fact('Per day')).toHaveTextContent('$175')
  })

  test('without readings there is the empty message; embedded or standalone it frames itself', () => {
    const { unmount } = reduced(<RunningTotal current={[]} />)
    expect(screen.getByText('No signups in this period')).toBeInTheDocument()
    unmount()
    reduced(<RunningTotal embedded={false} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Signups' })).toBeInTheDocument()
  })
})
