import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LollipopChart, type LollipopDatum } from './lollipop-chart'

const DATA: LollipopDatum[] = [
  { id: 'a', label: 'Alpha', value: 12, tone: 'success' },
  { id: 'b', label: 'Beta', value: -8, tone: 'danger' },
  { id: 'c', label: 'Gamma', value: 3 },
]
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const options = () => screen.getAllByRole('option')

describe('LollipopChart', () => {
  test('is a named listbox described by its count and range; each option reads its label and value', () => {
    reduced(<LollipopChart data={DATA} label="Scores" />)
    const box = screen.getByRole('listbox', { name: 'Scores' })
    expect(box).toHaveAccessibleDescription('3 points, from -8 to 12.')
    expect(options().map((o) => o.getAttribute('aria-label'))).toEqual(['Alpha: 12', 'Beta: -8', 'Gamma: 3'])
  })

  test('sorts by value, and places each dot on one scale with its stem from the baseline', () => {
    reduced(<LollipopChart data={DATA} sort="ascending" domain={[-10, 20]} />)
    expect(options().map((o) => o.getAttribute('aria-label'))).toEqual(['Beta: -8', 'Gamma: 3', 'Alpha: 12'])
    const dots = [...document.querySelectorAll<HTMLElement>('[data-slot=lollipop-chart-dot]')]
    // Shown in full (reduced motion): the dot sits at its value, 20 → 0%, -10 → 100%.
    expect(dots[2]!.style.top).toContain('26.666')
    expect(dots[0]!.style.top).toContain('93.333')
    expect(document.querySelectorAll('[data-slot=lollipop-chart-stem]')).toHaveLength(3)
  })

  test('one item can be picked: by click, or with the arrows and Enter; the pill names it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<LollipopChart data={DATA} sort="descending" onValueChange={onValueChange} formatValue={(v) => `${v} pts`} />)
    await user.click(options()[1]!)
    expect(onValueChange).toHaveBeenLastCalledWith('c')
    expect(options()[1]).toHaveAttribute('aria-selected', 'true')
    expect(document.querySelector('[data-slot=lollipop-chart-flag]')).toHaveTextContent('3 ptsGamma')
    await user.keyboard('{ArrowRight}{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith('b')
    expect(options().filter((o) => o.tabIndex === 0)).toHaveLength(1)
    await user.keyboard('{Home} ')
    expect(onValueChange).toHaveBeenLastCalledWith('a')
  })

  test('the app can own the pick', () => {
    reduced(<LollipopChart data={DATA} value="b" />)
    expect(options()[1]).toHaveAttribute('aria-selected', 'true')
    expect(options()[1]!.tabIndex).toBe(0)
  })

  test('with nothing to show it says so, and the labels translate it', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ noData: 'Keine Daten' }}>
        <LollipopChart data={[]} />
      </YoujProvider>,
    )
    expect(screen.getByText('Keine Daten')).toBeInTheDocument()
  })
})
