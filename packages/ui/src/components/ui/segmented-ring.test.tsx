import { render, screen } from '@testing-library/react'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SegmentedRing, type SegmentedRingInterval } from './segmented-ring'

const INTERVALS: SegmentedRingInterval[] = [
  { kind: 'warmup', duration: 30 },
  { kind: 'work', duration: 40, label: 'Swings' },
  { kind: 'rest', duration: 20 },
  { kind: 'work', duration: 40, label: 'Squats' },
]

const ui = (elapsed: number, sink = vi.fn()) => (
  <SoundCueContext.Provider value={sink}>
    <YoujProvider reducedMotion="always">
      <SegmentedRing intervals={INTERVALS} elapsed={elapsed} />
    </YoujProvider>
  </SoundCueContext.Provider>
)
const summary = () => document.querySelector('[data-slot=segmented-ring-summary]')!.textContent

describe('SegmentedRing', () => {
  test('says the round, the phase and the time left in it', () => {
    render(ui(30 + 16))
    expect(screen.getByRole('group', { name: 'Interval timer' })).toBeInTheDocument()
    expect(summary()).toBe('Round 1 of 2. Work, 0:24 left.')
    expect(document.querySelector('[data-slot=segmented-ring]')).toHaveAttribute('data-phase', 'work')
  })

  test('draws one arc per interval: the ones behind lit, the running one filling, the rest waiting', () => {
    render(ui(30 + 40 + 5))
    const states = [...document.querySelectorAll('[data-slot=segmented-ring-segment]')].map((s) => s.getAttribute('data-state'))
    expect(states).toEqual(['done', 'done', 'current', 'upcoming'])
    expect(document.querySelector('[data-slot=segmented-ring-progress]')).toBeInTheDocument()
    // Resting after round 1 still counts as round 1.
    expect(summary()).toBe('Round 1 of 2. Rest, 0:15 left.')
  })

  test('counts the warm-up toward round 1, and finishes at the end', () => {
    const { rerender } = render(ui(5))
    expect(summary()).toBe('Round 1 of 2. Warm-up, 0:25 left.')
    rerender(ui(500))
    expect(summary()).toBe('Workout complete')
    expect(document.querySelector('[data-slot=segmented-ring]')).toHaveAttribute('data-phase', 'done')
  })

  test('announces each interval as it starts with the notify cue, ticks through the last three seconds, and ends on success', () => {
    const sink = vi.fn()
    const { rerender } = render(ui(66, sink))
    expect(sink).not.toHaveBeenCalled()
    rerender(ui(67.5, sink))
    expect(sink).toHaveBeenLastCalledWith('tick', true)
    rerender(ui(70.2, sink))
    expect(sink).toHaveBeenLastCalledWith('notify', true)
    expect(screen.getByRole('status')).toHaveTextContent('Rest, 0:20. Next: Squats.')
    rerender(ui(200, sink))
    expect(sink).toHaveBeenLastCalledWith('success', true)
    expect(screen.getByRole('status')).toHaveTextContent('Workout complete')
  })

  test('stays quiet when the clock is rewound', () => {
    const sink = vi.fn()
    const { rerender } = render(ui(100, sink))
    rerender(ui(10, sink))
    expect(sink).not.toHaveBeenCalled()
  })
})
