import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StepTrace } from './step-trace'
import { schedule, statusAt, STEPS, type StepTraceKind, type StepTraceStep } from './step-trace/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const step = (name: RegExp) => screen.getByRole('button', { name })
const figure = (label: string) => screen.getAllByText(label, { selector: 'dt' })[0]!.nextElementSibling!.textContent

describe('agent trace schedule', () => {
  test('runs each step after what it waits on, skips what needed a failure, and leaves out what the settings do', () => {
    const plan = schedule(STEPS)
    const at = (id: string, t: number) => statusAt(plan.get(id)!, STEPS.find((s) => s.id === id)!, t)
    expect(plan.get('group')!.start).toBeCloseTo(plan.get('issues')!.end)
    expect(at('shots', 10)).toBe('error')
    expect(at('media', 4)).toBe('queued')
    expect(at('media', 10)).toBe('skipped')
    expect(at('translate', 0)).toBe('skipped')
    expect(at('issues', 60)).toBe('retried')
    expect(plan.get('publish')!.start).toBeCloseTo(plan.get('links')!.end)
  })
})

describe('StepTrace block', () => {
  test('shows the run part-way: its state, figures, the graph and the draft streaming in', () => {
    reduced(<StepTrace live={false} />)
    expect(screen.getByRole('heading', { level: 2, name: 'v4.2 release notes' })).toBeInTheDocument()
    expect(screen.getAllByText('Running').length).toBeGreaterThan(0)
    expect(figure('Steps')).toBe('8/11')
    expect(figure('Elapsed')).toBe('18.6s')
    expect(within(screen.getByRole('group', { name: 'Steps of the run' })).getAllByRole('button').filter((b) => b.getAttribute('data-slot') === 'flow-graph-node')).toHaveLength(11)
    const draft = step(/^notes\.draft, Running/)
    expect(draft).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('heading', { level: 3, name: 'notes.draft' })).toBeInTheDocument()
    expect(screen.getByText(/Saved views/)).toBeInTheDocument()
    expect(screen.queryByText(/twice as fast/)).toBeNull()
  })

  test('opening a failed step shows its error; the close button puts the detail away', async () => {
    const user = userEvent.setup()
    reduced(<StepTrace live={false} />)
    await user.click(step(/^screenshots\.fetch, Failed, 404/))
    expect(screen.getByRole('heading', { level: 3, name: 'screenshots.fetch' })).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('404: no preview deployment for PR 2291')
    await user.click(screen.getByRole('button', { name: 'Close step' }))
    await waitFor(() => expect(screen.queryByRole('heading', { level: 2, name: 'screenshots.fetch' })).toBeNull())
    expect(step(/^screenshots\.fetch/)).toHaveAttribute('aria-expanded', 'false')
  })

  test('the clock plays the run to the end, says so, and then the draft can be published', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'performance'] })
    const approved = vi.fn()
    try {
      reduced(<StepTrace onApprove={approved} />)
      const approve = screen.getByRole('button', { name: 'Approve and publish' })
      expect(approve).toBeDisabled()
      await act(async () => vi.advanceTimersByTime(14_000))
      expect(figure('Steps')).toBe('11/11')
      expect(screen.getAllByText('Completed').length).toBeGreaterThan(0)
      expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Run complete, 1 step failed')
      expect(step(/^notes\.publish, Succeeded/)).toBeInTheDocument()
      expect(approve).toBeEnabled()
      fireEvent.click(approve)
      await act(async () => vi.advanceTimersByTime(2000))
      expect(approved).toHaveBeenCalledTimes(1)
      expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Release notes published')
    } finally {
      vi.useRealTimers()
    }
  })

  test('Replay starts the run over from the plan', async () => {
    const user = userEvent.setup()
    reduced(<StepTrace live={false} start={40} />)
    expect(figure('Steps')).toBe('11/11')
    await user.click(screen.getByRole('button', { name: 'Replay' }))
    // The translation is left out by the settings, so it's settled from the start.
    expect(figure('Steps')).toBe('1/11')
    expect(step(/^plan, Running/)).toBeInTheDocument()
  })

  test('embedded, it is a section named by an h2 with the open step under an h3', () => {
    reduced(<StepTrace embedded live={false} />)
    expect(screen.getByRole('region', { name: 'v4.2 release notes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'notes.draft' })).toBeInTheDocument()
    expect(screen.queryByRole('main')).toBeNull()
  })

  test('replays its demo run under a Demo data marker; your steps show as given, at the end of the run', () => {
    vi.useFakeTimers()
    try {
      const demo = reduced(<StepTrace />)
      expect(screen.getByText('Demo data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Replay' })).toBeInTheDocument()
      demo.unmount()
      reduced(<StepTrace steps={STEPS} />)
      expect(screen.queryByText('Demo data')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Replay' })).toBeNull()
      expect(figure('Steps')).toBe('11/11')
      act(() => vi.advanceTimersByTime(5000))
      expect(figure('Steps')).toBe('11/11')
    } finally {
      vi.useRealTimers()
    }
  })
  describe('for any run', () => {
    const kinds: StepTraceKind[] = [
      { id: 'intake', label: 'Intake', tone: 'chart-1' },
      { id: 'bench', label: 'Instrument', tone: 'chart-3', streams: true },
    ]
    const steps: StepTraceStep[] = [
      { id: 'in', label: 'intake', kind: 'intake', after: [], attempts: [1], input: 'Tube S-2291', output: 'Accepted' },
      { id: 'spin', label: 'centrifuge', kind: 'bench', after: ['in'], attempts: [4], size: { input: 4500, output: 2100 }, cost: 3.2, input: 'Spin 10 minutes', output: 'Serum separated' },
    ]
    const run = { id: 'S-2291', name: 'Serum panel', task: 'Run the lipid panel', method: 'Assay line 3', place: 'Lab B' }

    test('your kinds label the steps in the graph and in the detail', () => {
      reduced(<StepTrace steps={steps} kinds={kinds} run={run} defaultOpen="spin" />)
      expect(step(/^centrifuge, Succeeded/)).toBeInTheDocument()
      expect(step(/^intake, Succeeded/)).toBeInTheDocument()
      expect(screen.getAllByText('Instrument').length).toBeGreaterThan(1)
      expect(screen.getByText('Serum panel · S-2291')).toBeInTheDocument()
      expect(screen.getByText('Assay line 3 · Lab B')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'centrifuge' })).toBeInTheDocument()
      expect(screen.getByText('Spin 10 minutes')).toBeInTheDocument()
      expect(screen.getByText('Serum separated')).toBeInTheDocument()
    })

    test('a kind that streams grows its output while it runs; one that does not shows nothing until done', () => {
      reduced(<StepTrace steps={steps} kinds={kinds} start={2} defaultOpen="spin" />)
      expect(screen.getByText('Serum separated')).toBeInTheDocument()
      reduced(<StepTrace steps={steps} kinds={[kinds[0]!, { ...kinds[1]!, streams: false }]} start={2} defaultOpen="spin" />)
      expect(screen.getAllByText('Nothing yet').length).toBeGreaterThan(0)
    })

    test('your formatters write the durations, sizes and costs', () => {
      reduced(
        <StepTrace
          steps={steps}
          kinds={kinds}
          defaultOpen="spin"
          format={{ duration: (ms) => `${ms / 1000} min`, size: (n) => `${n} µL`, cost: (n) => `€${n}` }}
        />,
      )
      expect(figure('Elapsed')).toBe('5 min')
      expect(figure('Tokens')).toBe('6600 µL')
      expect(figure('Cost')).toBe('€3.2')
      expect(figure('Duration')).toBe('4 min')
      expect(figure('Tokens in / out')).toBe('4500 µL / 2100 µL')
    })
  })
})
