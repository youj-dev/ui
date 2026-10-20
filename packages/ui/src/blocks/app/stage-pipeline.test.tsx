import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StagePipeline } from './stage-pipeline'
import { StagePipelineRunTiming } from './stage-pipeline/run-timing'
import { FAILING_STAGES } from './stage-pipeline/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Stage pipeline block', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  test('shows the run, its stages on the rail and the running stage’s log', () => {
    reduced(<StagePipeline />)
    expect(screen.getByRole('heading', { level: 2, name: 'checkout-api' })).toBeInTheDocument()
    expect(screen.getByText('Run #2481 · production')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Pipeline stages' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Test, Running/ })).toHaveAttribute('aria-pressed', 'true')
    // Build has passed and test is running: the run is on stage 2 of 3.
    expect(screen.getByText('2 of 3')).toBeInTheDocument()
    expect(within(screen.getByRole('log', { name: 'Test log' })).getAllByRole('listitem').length).toBeGreaterThan(4)
  })

  test('the log tails the running stage, and pausing counts the lines that arrive', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    reduced(<StagePipeline />)
    const log = screen.getByRole('log', { name: 'Test log' })
    const before = within(log).getAllByRole('listitem').length
    act(() => vi.advanceTimersByTime(1900))
    expect(within(log).getAllByRole('listitem').length).toBe(before + 2)

    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(log).toHaveAttribute('aria-live', 'off')
    act(() => vi.advanceTimersByTime(1900))
    await user.click(screen.getByRole('button', { name: '2 new lines' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })

  test('picking a stage shows its log; Promote waits, saying why, until every stage passes', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    reduced(<StagePipeline />)
    await user.click(screen.getByRole('button', { name: /^Build, Passed/ }))
    expect(screen.getByRole('log', { name: 'Build log' })).toHaveTextContent('Build finished in 72.4 s')

    const promote = screen.getByRole('button', { name: 'Promote' })
    expect(promote).toBeDisabled()
    expect(promote).toHaveAccessibleDescription('Unlocks when deploy passes')

    // Test prints its last lines, then deploy runs through.
    act(() => vi.advanceTimersByTime(20_000))
    expect(screen.getByText('Ready to promote')).toBeInTheDocument()
    expect(screen.getByText('3 of 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Promote' }))
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument())
    expect(screen.getAllByRole('status').map((el) => el.textContent)).toContain('Promoted to production')
  })

  test('a failing test stops the run: deploy is skipped and Promote stays off', () => {
    reduced(<StagePipeline stages={FAILING_STAGES} />)
    act(() => vi.advanceTimersByTime(6000))
    expect(screen.getByRole('button', { name: /^Test, Failed/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deploy, Skipped' })).toBeInTheDocument()
    expect(screen.getByText('Failed', { selector: '[data-slot=badge]' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Promote' })).toHaveAccessibleDescription('Fix the failed stage to promote')
  })

  test('embedded, it is a section named by an h2', () => {
    reduced(<StagePipeline embedded copy={{ title: () => 'web' }} />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'web' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'web' })).toBeInTheDocument()
  })

  test('replays its demo run under a Demo data marker; your progress shows as given and Re-run calls you', async () => {
    const demo = reduced(<StagePipeline />)
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    demo.unmount()
    const start = Date.now() - 60_000
    const progress = [
      { id: 'build', name: 'Build', status: 'passed' as const, startedAt: start, duration: 30_000, lines: [{ id: 'b0', at: 1000, text: 'compiled 214 modules' }] },
      { id: 'test', name: 'Test', status: 'running' as const, startedAt: start + 30_000, lines: [{ id: 't0', at: 1000, text: 'ran 12 suites' }] },
      { id: 'deploy', name: 'Deploy', status: 'queued' as const, lines: [] },
    ]
    const onRerun = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    reduced(<StagePipeline progress={progress} onRerun={onRerun} />)
    expect(screen.queryByText('Demo data')).toBeNull()
    act(() => vi.advanceTimersByTime(10_000))
    expect(within(screen.getByRole('log', { name: 'Test log' })).getAllByRole('listitem')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(await screen.findByRole('menuitem', { name: /Re-run pipeline/ }))
    expect(onRerun).toHaveBeenCalledTimes(1)
  })
})

describe('Stage pipeline words and data', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  const run = { id: '3107', name: 'Rye sourdough', target: 'Retail route 4', source: 'Line 2', revision: 'L3107', summary: '480 rounds', author: 'dana', runner: 'Plant 2' }
  const stages = [
    { id: 'mix', name: 'Mix', estimate: 40_000, lines: [{ text: 'Dough at 24 C' }, { text: 'Mix finished', level: 'ok' as const }] },
    { id: 'bake', name: 'Bake', estimate: 60_000, lines: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ text: `Rack ${n} out` })) },
  ]

  test('your run, stages and words drive the card: no deploy word is left', () => {
    reduced(
      <StagePipeline
        run={run}
        stages={stages}
        copy={{ revision: 'Lot', source: 'Line', promote: 'Release batch', rollBack: 'Recall', log: (stage) => `${stage} floor log`, state: { running: 'In progress', passed: 'Ready', failed: 'Held', promoted: 'Released', rolledBack: 'Recalled' } }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Rye sourdough' })).toBeInTheDocument()
    expect(screen.getByText('Run #3107 · Retail route 4')).toBeInTheDocument()
    expect(screen.getByText('480 rounds')).toBeInTheDocument()
    expect(screen.getByText('Lot')).toBeInTheDocument()
    expect(screen.getByText('L3107')).toBeInTheDocument()
    expect(screen.getByText('Line')).toBeInTheDocument()
    expect(screen.getByText('Line 2')).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByRole('log', { name: 'Bake floor log' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Release batch' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Recall' })).toBeDisabled()
    expect(screen.queryByText(/deploy/i)).toBeNull()
  })

  test('format.duration writes the total and the log stamps', () => {
    reduced(<StagePipeline format={{ duration: (ms) => `${Math.round(ms / 1000)} sec` }} />)
    act(() => vi.advanceTimersByTime(1100))
    const total = screen.getByText('Total').closest('div')!
    expect(total).toHaveTextContent(/^Total\d+ sec$/)
    expect(within(screen.getByRole('log', { name: 'Test log' })).getAllByRole('time')[0]).toHaveTextContent(/^\d+ sec$/)
  })
})

describe('Stage pipeline run timing', () => {
  const step = (name: string) =>
    within(screen.getByRole('region', { name: 'checkout-api' }))
      .getAllByRole('listitem')
      .find((el) => el.textContent?.includes(name))!

  test('compares each step with its earlier time: gains and overshoots are named, a skipped step has no bar', () => {
    reduced(<StagePipelineRunTiming />)
    expect(step('Install packages')).toHaveAttribute('data-state', 'faster')
    expect(step('Install packages')).toHaveTextContent('6s faster')
    expect(step('Install packages')).toHaveTextContent('was 15s')
    expect(step('Check types')).toHaveAttribute('data-state', 'slower')
    expect(step('Check types')).toHaveTextContent('3s slower')
    expect(step('Check types').querySelector('.bg-danger')).not.toBeNull()
    // An unchanged time is not called out.
    expect(step('Restore cache')).toHaveAttribute('data-state', 'same')
    expect(step('Restore cache')).not.toHaveTextContent('was')
    expect(step('Warm the edge cache')).toHaveAttribute('data-state', 'skipped')
    expect(step('Warm the edge cache')).toHaveTextContent('Skipped')
  })

  test('a step without a previous time is only timed, and starts show on the run clock', () => {
    reduced(<StagePipelineRunTiming groups={[{ id: 'g', name: 'Ship', steps: [{ id: 's', name: 'Upload', start: 65_000, took: 72_000 }] }]} />)
    expect(step('Upload')).toHaveAttribute('data-state', 'same')
    expect(step('Upload')).toHaveTextContent('+1:05')
    expect(step('Upload')).toHaveTextContent('1m 12s')
  })

  test('the strip is one named image with each group’s time; the footer says where it is live and how long it took', () => {
    reduced(<StagePipelineRunTiming result={{ location: 'shop.example.dev' }} />)
    expect(screen.getByRole('img', { name: 'Time by group: Build 31s, Deploy 11s' })).toBeInTheDocument()
    expect(screen.getByText('Live on shop.example.dev · 42s')).toBeInTheDocument()
  })

  test('without a result there is no footer; copy rewrites the words and a run renames the card', () => {
    reduced(<StagePipelineRunTiming run={{ id: '7', name: 'web', target: 'staging' }} copy={{ skipped: 'Übersprungen', faster: (d) => `${d} schneller` }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'web' })).toBeInTheDocument()
    expect(screen.getByText('Run #7 · staging')).toBeInTheDocument()
    expect(screen.queryByText(/^Live on/)).toBeNull()
    expect(screen.getByText('Übersprungen')).toBeInTheDocument()
    expect(screen.getByText('6s schneller')).toBeInTheDocument()
  })
})
