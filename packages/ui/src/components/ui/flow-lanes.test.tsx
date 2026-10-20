import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { FlowLanes, type FlowLane } from './flow-lanes'

const LANES: FlowLane[] = [
  { id: 'a', label: 'Kestrel', value: 60, tone: 'chart-1' },
  { id: 'b', label: 'Orrery', value: 30 },
  { id: 'c', label: 'Moth', value: 10 },
]
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const items = () => within(screen.getByRole('list')).getAllByRole('listitem')

describe('FlowLanes', () => {
  test('is a named group described by its source, lanes and total; each lane is read with its rate and share', () => {
    reduced(<FlowLanes source="Gateway" lanes={LANES} label="Routes" formatValue={(v) => `${v}/s`} />)
    const group = screen.getByRole('group', { name: 'Routes' })
    expect(group).toHaveAccessibleDescription('Gateway to 3 lanes, 100/s in all.')
    expect(items().map((li) => li.getAttribute('aria-label'))).toEqual(['Kestrel: 60/s, 60%', 'Orrery: 30/s, 30%', 'Moth: 10/s, 10%'])
    expect(items()[0]).toHaveTextContent('Kestrel60/s')
    expect(screen.getByText('Gateway')).toBeInTheDocument()
  })

  test('the drawing is decorative', () => {
    reduced(<FlowLanes source="Gateway" lanes={LANES} />)
    expect(document.querySelector('[data-slot=flow-lanes-plot]')).toHaveAttribute('aria-hidden', 'true')
  })

  test('pointing or focus lights one lane and quiets the rest; the names are one tab stop walked with the arrows', async () => {
    const user = userEvent.setup()
    const onActiveChange = vi.fn()
    reduced(<FlowLanes source="Gateway" lanes={LANES} onActiveChange={onActiveChange} />)
    await user.tab()
    expect(document.activeElement).toBe(items()[0])
    expect(items().filter((li) => li.tabIndex === 0)).toHaveLength(1)
    expect(onActiveChange).toHaveBeenLastCalledWith('a')
    expect(items().map((li) => li.dataset.state)).toEqual(['active', 'inactive', 'inactive'])
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(items()[1])
    expect(onActiveChange).toHaveBeenLastCalledWith('b')
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(items()[2])
    await user.tab()
    expect(onActiveChange).toHaveBeenLastCalledWith(null)
    await user.hover(items()[1]!)
    expect(onActiveChange).toHaveBeenLastCalledWith('b')
  })

  test('the app can own the lit lane', () => {
    reduced(<FlowLanes source="Gateway" lanes={LANES} active="c" />)
    expect(items().map((li) => li.dataset.state)).toEqual(['inactive', 'inactive', 'active'])
  })

  test('with nothing flowing it says so, and the labels translate it', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ noData: 'Keine Daten' }}>
        <FlowLanes source="Gateway" lanes={[]} />
      </YoujProvider>,
    )
    expect(screen.getByText('Keine Daten')).toBeInTheDocument()
  })
})
