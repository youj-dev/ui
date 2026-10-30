import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StageRail, type Stage } from './stage-rail'

const STAGES: Stage[] = [
  { id: 'build', name: 'Build', status: 'passed', duration: 72_000 },
  { id: 'test', name: 'Test', status: 'running', startedAt: Date.parse('2026-09-28T10:00:00Z'), estimate: 60_000 },
  { id: 'deploy', name: 'Deploy', status: 'queued' },
]

const cells = (stage: string) => [...document.querySelectorAll<HTMLElement>(`[data-slot=stage-rail-stage][data-status] `)].find((el) => el.getAttribute('aria-label')?.startsWith(stage))!.querySelectorAll<HTMLElement>('[data-slot=stage-rail-cell]')
const lit = (stage: string) => [...cells(stage)].filter((c) => c.dataset.state === 'on').length
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('StageRail', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(Date.parse('2026-09-28T10:00:30Z'))
  })
  afterEach(() => vi.useRealTimers())

  test('is a named group of stages, each spoken with its state and duration', () => {
    reduced(<StageRail stages={STAGES} />)
    expect(screen.getByRole('group', { name: 'Pipeline stages' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Build, Passed, 1m 12s, 1 minute 12 seconds' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Test, Running, 30s, 30 seconds' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deploy, Queued' })).toBeInTheDocument()
  })

  test('picks the running stage by default, and shows durations in mono with muted units', () => {
    reduced(<StageRail stages={STAGES} />)
    expect(screen.getByRole('button', { name: /^Test/ })).toHaveAttribute('aria-pressed', 'true')
    const build = screen.getByRole('button', { name: /^Build/ })
    expect(build.querySelector('[data-slot=stage-rail-value]')).toHaveTextContent('1m 12s')
    expect(build.querySelectorAll('[data-part=unit]')).toHaveLength(2)
  })

  test('fills a passed stage, a running one toward its estimate, and leaves a queued one empty', () => {
    reduced(<StageRail stages={STAGES} segments={10} />)
    expect(lit('Build')).toBe(10)
    // 30 s of a 60 s estimate.
    expect(lit('Test')).toBe(5)
    expect(lit('Deploy')).toBe(0)
  })

  test('ticks a running stage’s duration and fills its cells as time passes', () => {
    reduced(<StageRail stages={STAGES} segments={10} />)
    act(() => vi.advanceTimersByTime(12_000))
    expect(screen.getByRole('button', { name: 'Test, Running, 42s, 42 seconds' })).toBeInTheDocument()
    expect(lit('Test')).toBe(7)
  })

  test('a failed stage fills to where it broke, a skipped one is hatched and empty', () => {
    reduced(
      <StageRail
        segments={10}
        stages={[
          { id: 'test', name: 'Test', status: 'failed', duration: 40_000, progress: 0.4 },
          { id: 'deploy', name: 'Deploy', status: 'skipped' },
        ]}
      />,
    )
    expect(lit('Test')).toBe(4)
    expect(screen.getByRole('button', { name: 'Deploy, Skipped' })).toHaveAttribute('data-status', 'skipped')
  })

  test('arrow keys rove between stages and picking one calls onValueChange', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onValueChange = vi.fn()
    reduced(<StageRail stages={STAGES} onValueChange={onValueChange} />)
    screen.getByRole('button', { name: /^Test/ }).focus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('button', { name: /^Build/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('build')
    expect(screen.getByRole('button', { name: /^Build/ })).toHaveAttribute('aria-pressed', 'true')
    // Pressing the picked stage again keeps it picked.
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: /^Build/ })).toHaveAttribute('aria-pressed', 'true')
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  test('announces a stage that changes state', () => {
    const view = reduced(<StageRail stages={STAGES} />)
    view.rerender(
      <YoujProvider reducedMotion="always">
        <StageRail stages={STAGES.map((s) => (s.id === 'test' ? { ...s, status: 'passed', duration: 44_000 } : s))} />
      </YoujProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Test, Passed')
  })

  test('speaks in the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ stageRail: 'Pipeline-Phasen', stagePassed: 'Bestanden' }}>
        <StageRail stages={STAGES.slice(0, 1)} locale="de-DE" />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Pipeline-Phasen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Build, Bestanden, 1 Min\. 12 Sek\., 1 Minute 12 Sekunden$/ })).toBeInTheDocument()
  })

  test('reduced motion changes cells in place: no stagger, no breathing', () => {
    reduced(<StageRail stages={STAGES} />)
    const root = document.querySelector<HTMLElement>('[data-slot=stage-rail]')!
    expect(root).toHaveAttribute('data-reduced-motion')
    expect(root.style.getPropertyValue('--stage-rail-step')).toBe('0ms')
  })

  test('with motion, the cells light one after another along the rail', () => {
    render(
      <YoujProvider reducedMotion="never">
        <StageRail stages={STAGES} />
      </YoujProvider>,
    )
    const root = document.querySelector<HTMLElement>('[data-slot=stage-rail]')!
    expect(parseFloat(root.style.getPropertyValue('--stage-rail-step'))).toBeGreaterThan(0)
    const delays = [...cells('Build')].map((c) => c.style.transitionDelay)
    expect(delays[0]).toContain('0 *')
    expect(delays[3]).toContain('3 *')
  })
})
