import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CaseFile } from './case-file'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const chain = () => within(screen.getByRole('list', { name: 'Attack chain' })).getAllByRole('listitem')

describe('CaseFile', () => {
  test('names the case, its age and verdict, and is a section named by an h2', () => {
    reduced(<CaseFile timeZone="UTC" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Case 4127' })).toBeInTheDocument()
    expect(screen.getByText(/Opened 14 minutes ago/)).toBeInTheDocument()
    expect(screen.getByText('Malicious')).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()
    expect(screen.getByText('4 signals')).toBeInTheDocument()
  })

  test('the stage is the current step, and the signals bar speaks every part', () => {
    reduced(<CaseFile timeZone="UTC" />)
    const stages = within(screen.getByRole('list', { name: 'Case stage' })).getAllByRole('listitem')
    expect(stages).toHaveLength(4)
    expect(stages[2]).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('meter', { name: 'Signals behind the verdict' })).toHaveAttribute(
      'aria-valuetext',
      expect.stringContaining('Identity 38%'),
    )
  })

  test('the chain lists every step oldest first, with its time and source', () => {
    reduced(<CaseFile timeZone="UTC" />)
    const steps = chain()
    expect(steps).toHaveLength(5)
    expect(steps[0]).toHaveTextContent('09:12')
    expect(steps[0]).toHaveTextContent('Opened a link in a payment reminder')
    expect(steps[0]).toHaveTextContent('Mail · a.moreau')
    expect(steps[4]).toHaveTextContent('Ongoing')
    expect(screen.getByText('14 min')).toBeInTheDocument()
  })

  test('the primary action runs the stage, ends what was running and moves the case on', async () => {
    const user = userEvent.setup()
    const onAdvance = vi.fn()
    const onStageChange = vi.fn()
    reduced(<CaseFile timeZone="UTC" onAdvance={onAdvance} onStageChange={onStageChange} />)
    await user.click(screen.getByRole('button', { name: 'Contain account' }))
    expect(onAdvance).toHaveBeenCalledWith('contain')
    await waitFor(() => expect(onStageChange).toHaveBeenCalledWith('close'))
    expect(chain()[4]).not.toHaveTextContent('Ongoing')
    expect(screen.getByText('Case moved to Close')).toHaveAttribute('aria-live', 'polite')
  })

  test('Dismiss closes the case as a false positive', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    reduced(<CaseFile timeZone="UTC" onDismiss={onDismiss} />)
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText('Dismissed')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Case closed' })).toBeDisabled()
  })

  test('a rejected action says why in the button and keeps the stage', async () => {
    const user = userEvent.setup()
    reduced(<CaseFile timeZone="UTC" onAdvance={() => Promise.reject(new Error('No permission'))} />)
    await user.click(screen.getByRole('button', { name: 'Contain account' }))
    await waitFor(() => expect(screen.getAllByText('No permission').length).toBeGreaterThan(0))
    expect(within(screen.getByRole('list', { name: 'Case stage' })).getAllByRole('listitem')[2]).toHaveAttribute('aria-current', 'step')
  })

  test('your case, steps and words drive the content', () => {
    reduced(
      <CaseFile
        timeZone="UTC"
        now="2026-10-13T12:00:00Z"
        defaultStage="triage"
        details={{
          id: 'Case 9',
          openedAt: '2026-10-13T10:00:00Z',
          subject: 'svc-ci',
          verdict: 'suspicious',
          summary: 'Odd traffic',
          confidence: 0.5,
        }}
        signals={[{ id: 'n', label: 'Network', weight: 1, tone: 'chart-2' }]}
        steps={[{ id: 's', at: '2026-10-13T10:00:00Z', title: 'Beacon to 203.0.113.9', source: 'Network', entity: 'egress', tone: 'chart-2' }]}
        verdicts={[{ id: 'suspicious', label: 'Odd', tone: 'warning' }]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Case 9' })).toBeInTheDocument()
    expect(screen.getByText(/Opened 2 hours ago/)).toBeInTheDocument()
    expect(screen.getByText('Odd')).toBeInTheDocument()
    expect(screen.getByText('1 signal')).toBeInTheDocument()
    expect(chain()).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Investigate' })).toBeEnabled()
  })

  test('your stages drive the stepper, the button words and the ids it reports', async () => {
    const user = userEvent.setup()
    const onAdvance = vi.fn()
    const onStageChange = vi.fn()
    reduced(
      <CaseFile
        timeZone="UTC"
        stages={[
          { id: 'intake', label: 'Intake', action: 'Start assessment', pending: 'Starting', done: 'Assessing' },
          { id: 'pay', label: 'Pay', action: 'Pay claim', pending: 'Paying', done: 'Paid' },
        ]}
        onAdvance={onAdvance}
        onStageChange={onStageChange}
        copy={{ closed: 'Claim paid' }}
      />,
    )
    const stages = within(screen.getByRole('list', { name: 'Case stage' })).getAllByRole('listitem')
    expect(stages).toHaveLength(2)
    expect(stages[0]).toHaveAttribute('aria-current', 'step')
    await user.click(screen.getByRole('button', { name: 'Start assessment' }))
    expect(onAdvance).toHaveBeenCalledWith('intake')
    await waitFor(() => expect(onStageChange).toHaveBeenCalledWith('pay'))
    expect(screen.getByText('Case moved to Pay')).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Pay claim' }))
    await waitFor(() => expect(onStageChange).toHaveBeenCalledWith('closed'))
    expect(await screen.findByRole('button', { name: 'Claim paid' })).toBeDisabled()
  })

  test('only a stage that stops it ends the running step', async () => {
    const user = userEvent.setup()
    const step = { id: 's', at: '2026-10-13T09:12:00Z', title: 'Picking', source: 'Warehouse', entity: 'Bay 6', tone: 'chart-1', ongoing: true } as const
    const stages = [
      { id: 'a', label: 'Flag', action: 'Review', pending: 'Starting', done: 'Reviewing' },
      { id: 'b', label: 'Hold', action: 'Hold order', pending: 'Holding', done: 'Held', stops: true },
      { id: 'c', label: 'Resolve', action: 'Resolve', pending: 'Resolving', done: 'Resolved' },
    ]
    reduced(<CaseFile timeZone="UTC" now="2026-10-13T09:26:00Z" steps={[step]} stages={stages} />)
    expect(chain()[0]).toHaveTextContent('Ongoing')
    await user.click(screen.getByRole('button', { name: 'Review' }))
    await screen.findByRole('button', { name: 'Hold order' })
    expect(chain()[0]).toHaveTextContent('Ongoing')
    await user.click(screen.getByRole('button', { name: 'Hold order' }))
    await screen.findByRole('button', { name: 'Resolve' })
    expect(chain()[0]).not.toHaveTextContent('Ongoing')
  })

  test('formatSpan words the span of the chain', () => {
    reduced(<CaseFile timeZone="UTC" formatSpan={(m) => `${m} minutes in all`} />)
    expect(screen.getByText('14 minutes in all')).toBeInTheDocument()
  })

  test('your verdicts name the badge', () => {
    reduced(
      <CaseFile
        timeZone="UTC"
        details={{ id: 'Claim 1', openedAt: '2026-10-13T09:12:00Z', subject: 'R. Alvarez', verdict: 'partial', summary: 'Mostly covered', confidence: 0.8 }}
        verdicts={[{ id: 'partial', label: 'Partially covered', tone: 'warning' }]}
      />,
    )
    expect(screen.getByText('Partially covered')).toBeInTheDocument()
    expect(screen.queryByText('Malicious')).not.toBeInTheDocument()
  })

  test('standalone draws a page with the case as the h1', () => {
    reduced(<CaseFile embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Case 4127' })).toBeInTheDocument()
  })
})
