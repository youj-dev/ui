import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { ActivityRings, type ActivityRing } from './activity-rings'

const DAY: ActivityRing[] = [
  { label: 'Move', value: 420, max: 500, unit: 'calories' },
  { label: 'Exercise', value: 45, max: 30, unit: 'minutes', tone: 'success' },
  { label: 'Stand', value: 0, max: 12, unit: 'hours' },
]
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const ring = (name: string) => screen.getByRole('meter', { name })
const part = (name: string, slot: string) => ring(name).querySelector(`[data-slot=activity-rings-${slot}]`)!

describe('ActivityRings', () => {
  test('speaks each ring as a meter with its value, goal and share', () => {
    reduced(<ActivityRings rings={DAY} />)
    expect(screen.getByRole('group', { name: 'Activity rings' })).toBeInTheDocument()
    expect(ring('Move')).toHaveAttribute('aria-valuetext', 'Move: 420 of 500 calories, 84%')
    expect(ring('Move')).toHaveAttribute('aria-valuenow', '420')
    expect(ring('Move')).toHaveAttribute('aria-valuemax', '500')
    // Past the goal the value holds at the top of the range; the text says how far past.
    expect(ring('Exercise')).toHaveAttribute('aria-valuenow', '30')
    expect(ring('Exercise')).toHaveAttribute('aria-valuetext', 'Exercise: 45 of 30 minutes, 150%')
  })

  test('draws each ring at its share, and runs a second lap past the goal', () => {
    reduced(<ActivityRings rings={DAY} />)
    expect(part('Move', 'arc')).toHaveAttribute('stroke-dasharray', '0.84 2')
    expect(part('Move', 'overlap')).toHaveAttribute('opacity', '0')
    expect(part('Exercise', 'arc')).toHaveAttribute('stroke-dasharray', '1 2')
    expect(part('Exercise', 'overlap')).toHaveAttribute('stroke-dasharray', '0.5 2')
    expect(part('Exercise', 'overlap')).toHaveAttribute('opacity', '1')
    expect(ring('Exercise')).toHaveAttribute('data-yj-over')
    expect(ring('Move')).not.toHaveAttribute('data-closed')
  })

  test('nests the rings outermost first, all in the same direction from twelve o’clock', () => {
    reduced(<ActivityRings rings={DAY} />)
    const radii = ['Move', 'Exercise', 'Stand'].map((name) => Number(part(name, 'track').getAttribute('r')))
    expect(radii[0]).toBeGreaterThan(radii[1]!)
    expect(radii[1]).toBeGreaterThan(radii[2]!)
    for (const name of ['Move', 'Exercise', 'Stand']) expect(ring(name)).toHaveAttribute('transform', 'rotate(-90)')
  })

  test('the bowl shows the first ring’s share, or the pointed ring’s, or the app’s content', () => {
    const { unmount } = reduced(<ActivityRings rings={DAY} legend="side" />)
    const value = () => document.querySelector('[data-slot=activity-rings-value]')
    expect(value()).toHaveTextContent('84%')
    fireEvent.pointerEnter(part('Exercise', 'track'))
    expect(value()).toHaveTextContent('150%')
    expect(screen.getAllByRole('listitem')[1]).toHaveAttribute('data-highlighted')
    expect(ring('Move').style.opacity).toBe('0.3')
    unmount()
    reduced(
      <ActivityRings rings={DAY}>
        <span>12 day streak</span>
      </ActivityRings>,
    )
    expect(screen.getByText('12 day streak')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=activity-rings-value]')).toBeNull()
  })

  test('the legend lists every ring, and focusing a row singles out its ring', () => {
    reduced(<ActivityRings rings={DAY} legend="below" />)
    const rows = screen.getAllByRole('listitem')
    expect(rows.map((r) => r.textContent)).toEqual(['Move420 / 500 calories84%', 'Exercise45 / 30 minutes150%', 'Stand0 / 12 hours0%'])
    fireEvent.focus(rows[2]!)
    expect(ring('Move').style.opacity).toBe('0.3')
    expect(ring('Stand').style.opacity).toBe('1')
    fireEvent.blur(rows[2]!)
    expect(ring('Move').style.opacity).toBe('1')
  })

  test('without a legend there is no list, and sm leaves the bowl empty', () => {
    reduced(<ActivityRings rings={DAY} size="sm" />)
    expect(screen.queryByRole('list')).toBeNull()
    expect(document.querySelector('[data-slot=activity-rings-center]')).toBeNull()
    expect(document.querySelector('[data-slot=activity-rings]')).toHaveAttribute('data-size', 'sm')
  })

  test('reduced motion draws at the value with no glow and no cue', () => {
    const sink = vi.fn()
    render(
      <SoundCueContext.Provider value={sink}>
        <YoujProvider reducedMotion="always">
          <ActivityRings rings={DAY} />
        </YoujProvider>
      </SoundCueContext.Provider>,
    )
    expect(document.querySelector('[data-slot=activity-rings-glow]')).toBeNull()
    expect(sink).not.toHaveBeenCalled()
  })

  test('closing a ring glows once and plays the success cue; sound={false} keeps it quiet', async () => {
    const sink = vi.fn()
    const view = (value: number, sound = true) => (
      <SoundCueContext.Provider value={sink}>
        <YoujProvider reducedMotion="never" timeScale={0.05}>
          <ActivityRings inView={false} sound={sound} rings={[{ label: 'Move', value, max: 100 }, DAY[1]!]} />
        </YoujProvider>
      </SoundCueContext.Provider>
    )
    const { rerender } = render(view(60))
    await waitFor(() => expect(part('Exercise', 'overlap')).toHaveAttribute('opacity', '1'))
    sink.mockClear()
    rerender(view(100))
    await waitFor(() => expect(part('Move', 'glow')).not.toBeNull())
    expect(sink).toHaveBeenCalledWith('success', false)
    expect(ring('Move')).toHaveAttribute('data-closed')
    sink.mockClear()
    rerender(view(40, false))
    rerender(view(120, false))
    await waitFor(() => expect(part('Move', 'overlap')).toHaveAttribute('opacity', '1'))
    expect(sink).not.toHaveBeenCalled()
  })

  test('takes its words from the language pack', () => {
    render(
      <YoujProvider reducedMotion="always" labels={de} locale="de">
        <ActivityRings rings={DAY} />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Aktivitätsringe' })).toBeInTheDocument()
    expect(ring('Move').getAttribute('aria-valuetext')).toMatch(/^Move: 420 von 500 calories, 84\s%$/)
  })
})
