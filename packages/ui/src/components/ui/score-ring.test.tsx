import { render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ScoreRing, type ScoreGrade } from './score-ring'

const GRADES: ScoreGrade[] = [
  { from: 0, label: 'F', tone: 'danger' },
  { from: 60, label: 'C', tone: 'warning' },
  { from: 75, label: 'B', tone: 'success' },
  { from: 90, label: 'A', tone: 'success' },
]
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const lit = () => document.querySelectorAll('[data-slot=score-ring-tick][data-yj-lit]').length

describe('ScoreRing', () => {
  test('is a meter: the score of the maximum, then its grade', () => {
    reduced(<ScoreRing value={77} grades={GRADES} label="Security score" />)
    const meter = screen.getByRole('meter', { name: 'Security score' })
    expect(meter).toHaveAttribute('aria-valuenow', '77')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
    expect(meter).toHaveAttribute('aria-valuetext', '77 of 100, grade B')
    expect(meter).toHaveAttribute('data-tone', 'success')
    expect(meter).toHaveTextContent('B')
  })

  test('lights the ticks up to the score, the last one as the head', () => {
    reduced(<ScoreRing value={77} ticks={40} />)
    expect(document.querySelectorAll('[data-slot=score-ring-tick]')).toHaveLength(40)
    expect(lit()).toBe(31)
  })

  test('takes the tone of the band the score is in, and shows the score without grades', () => {
    const { rerender } = reduced(<ScoreRing value={31} grades={GRADES} />)
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'danger')
    expect(screen.getByRole('meter')).toHaveTextContent('F')
    rerender(
      <YoujProvider reducedMotion="always">
        <ScoreRing value={64} max={80} tone="chart-2" />
      </YoujProvider>,
    )
    expect(screen.getByRole('meter')).toHaveTextContent('64')
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '64 of 80')
    expect(screen.getByRole('meter')).toHaveAttribute('data-tone', 'chart-2')
  })

  test('clamps the score to its range', () => {
    reduced(<ScoreRing value={140} ticks={20} />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100')
    expect(lit()).toBe(20)
  })

  test('busy says so, and sweeps only with motion', () => {
    const { rerender } = reduced(<ScoreRing value={50} busy />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-busy', 'true')
    expect(document.querySelector('[data-slot=score-ring-sweep]')).toBeNull()
    rerender(
      <YoujProvider reducedMotion="never">
        <ScoreRing value={50} busy />
      </YoujProvider>,
    )
    expect(document.querySelector('[data-slot=score-ring-sweep]')).toBeInTheDocument()
  })

  test('a custom middle, and translated words', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ scoreRingValue: (v, m) => `${v} von ${m}`, scoreRingGrade: (g) => `Note ${g}`, scoreRing: 'Bewertung' }}>
        <ScoreRing value={92} grades={GRADES}>
          92
        </ScoreRing>
      </YoujProvider>,
    )
    const meter = screen.getByRole('meter', { name: 'Bewertung' })
    expect(meter).toHaveAttribute('aria-valuetext', '92 von 100, Note A')
    expect(meter).toHaveTextContent('92')
  })
})
