import { act, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SegmentedMeter, type SegmentedMeterThreshold } from './segmented-meter'

const HOT: SegmentedMeterThreshold[] = [
  { value: 80, tone: 'warning', label: 'High' },
  { value: 95, tone: 'danger' },
]

const cells = () => [...document.querySelectorAll<HTMLElement>('[data-slot=segmented-meter-cell]')]
const lit = () => cells().filter((c) => c.dataset.state === 'on')
const delay = (cell: HTMLElement) => parseFloat(cell.style.transitionDelay || '0')

/** An IntersectionObserver that reports every target in view at once. */
function inViewport() {
  const original = globalThis.IntersectionObserver
  globalThis.IntersectionObserver = class {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds = []
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      queueMicrotask(() => this.callback([{ target, isIntersecting: true, intersectionRatio: 1 } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver))
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as unknown as typeof IntersectionObserver
  return () => {
    globalThis.IntersectionObserver = original
  }
}

describe('SegmentedMeter', () => {
  test('is a meter named by its visible label, with its value shown and spoken with the band', () => {
    render(
      <YoujProvider reducedMotion="always">
        <SegmentedMeter label="Memory" value={88} thresholds={HOT} />
      </YoujProvider>,
    )
    const meter = screen.getByRole('meter', { name: 'Memory' })
    expect(meter).toHaveAttribute('aria-valuenow', '88')
    expect(meter).toHaveAttribute('aria-valuetext', '88%, High')
    expect(document.querySelector('[data-slot=segmented-meter-value]')).toHaveTextContent('88%')
  })

  test('lights the share of cells, and cells past a threshold take its tone', () => {
    render(
      <YoujProvider reducedMotion="always">
        <SegmentedMeter label="Memory" value={88} thresholds={HOT} />
      </YoujProvider>,
    )
    expect(cells()).toHaveLength(40)
    expect(lit()).toHaveLength(35)
    const tones = lit().map((c) => c.dataset.tone)
    expect(tones.slice(0, 32).every((t) => t === 'neutral')).toBe(true)
    expect(tones.slice(32)).toEqual(['warning', 'warning', 'warning'])
    expect(cells()[35]).toHaveAttribute('data-state', 'off')
  })

  test('colorBy value lights every cell in the value’s band, as a score', () => {
    const SCORE: SegmentedMeterThreshold[] = [
      { value: 0, tone: 'danger', label: 'At risk' },
      { value: 40, tone: 'warning', label: 'Watch' },
      { value: 70, tone: 'success', label: 'Healthy' },
    ]
    render(
      <YoujProvider reducedMotion="always">
        <SegmentedMeter aria-label="Health" value={55} segments={10} thresholds={SCORE} colorBy="value" showValue={false} />
        <SegmentedMeter aria-label="Health, by position" value={55} segments={10} thresholds={SCORE} showValue={false} />
      </YoujProvider>,
    )
    const [score, byPosition] = screen.getAllByRole('meter')
    expect(score).toHaveAttribute('aria-valuetext', '55%, Watch')
    const tones = (meter: HTMLElement) => [...meter.querySelectorAll<HTMLElement>('[data-state=on]')].map((c) => c.dataset.tone)
    expect(tones(score!)).toEqual(Array(6).fill('warning'))
    expect(tones(byPosition!)).toEqual(['danger', 'danger', 'danger', 'danger', 'warning', 'warning'])
  })

  test('a danger band without a label is spoken in the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ meterCritical: 'Kritisch' }}>
        <SegmentedMeter label="Disk" value={97} thresholds={HOT} segments={20} />
      </YoujProvider>,
    )
    expect(screen.getByRole('meter', { name: 'Disk' })).toHaveAttribute('aria-valuetext', '97%, Kritisch')
    expect(lit().at(-1)).toHaveAttribute('data-tone', 'danger')
  })

  test('formats plain counts and clamps to the range', () => {
    render(
      <YoujProvider reducedMotion="always">
        <SegmentedMeter label="Backlog" value={870} max={2400} format={{}} />
      </YoujProvider>,
    )
    expect(document.querySelector('[data-slot=segmented-meter-value]')).toHaveTextContent('870')
    expect(lit()).toHaveLength(15)
  })

  test('reduced motion lights every cell at once, with no stagger', () => {
    render(
      <YoujProvider reducedMotion="always">
        <SegmentedMeter label="CPU" value={62} />
      </YoujProvider>,
    )
    expect(lit()).toHaveLength(25)
    expect(cells().every((c) => delay(c) === 0)).toBe(true)
  })

  test('with motion, it fills with a stagger once seen, and a lower value darkens back from the edge', async () => {
    const restore = inViewport()
    try {
      const view = render(
        <YoujProvider reducedMotion="never">
          <SegmentedMeter label="CPU" value={50} segments={20} />
        </YoujProvider>,
      )
      await act(async () => {})
      expect(lit()).toHaveLength(10)
      const up = lit().map(delay)
      expect(up[0]).toBe(0)
      expect(up.every((d, i) => i === 0 || d > up[i - 1]!)).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 600))
      view.rerender(
        <YoujProvider reducedMotion="never">
          <SegmentedMeter label="CPU" value={20} segments={20} />
        </YoujProvider>,
      )
      expect(lit()).toHaveLength(4)
      const going = cells().slice(4, 10).map(delay)
      // The cell at the old edge goes first, the one beside the new edge last.
      expect(going.at(-1)).toBe(0)
      expect(going.every((d, i) => i === going.length - 1 || d > going[i + 1]!)).toBe(true)
    } finally {
      restore()
    }
  })
})
