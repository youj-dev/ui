import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PlanVsActual } from './plan-vs-actual'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
/** Each row's rank, name and total, as it shows them (the bars' spoken summaries left out). */
const lineRows = () =>
  [...screen.getByRole('list', { name: 'Agents by spend' }).querySelectorAll(':scope > [data-slot=plan-vs-actual-row]')].map((li) => {
    const shown = li.cloneNode(true) as HTMLElement
    for (const summary of shown.querySelectorAll('[data-slot=cell-bar-summary]')) summary.remove()
    return shown.textContent?.replace(/\s+/g, ' ').trim()
  })

describe('PlanVsActual', () => {
  test('ranks the biggest spenders and folds the rest into one row, as a section with an h2', () => {
    reduced(<PlanVsActual />)
    expect(screen.getByRole('heading', { level: 2, name: 'Agent spend' })).toBeInTheDocument()
    expect(lineRows()).toEqual(['1nightly-summarizer$9,710', '2code-reviewer$7,770', '3triage-bot$4,255', '3 other agents$6,040'])
  })

  test('each row is its months on one scale, settled or forecast, with its plan', () => {
    reduced(<PlanVsActual />)
    const bar = screen.getByRole('group', { name: 'nightly-summarizer, spend by month' })
    expect(bar).toHaveAccessibleDescription('$9,710 in all. $3,540 of it projected. Target $6,240.')
    const cells = within(bar).getAllByRole('listitem')
    expect(cells).toHaveLength(12)
    expect(cells[8]).toHaveAccessibleName('Sep: $1,060')
    expect(cells[9]).toHaveAccessibleName('Oct: $1,120, projected')
    // Over its plan in the warning ink, under it in the success ink.
    expect(bar).toHaveAttribute('data-tone', 'warning')
    expect(screen.getByRole('group', { name: 'triage-bot, spend by month' })).toHaveAttribute('data-tone', 'success')
  })

  test('sums up the year so far against the plan to date, with the biggest movers', () => {
    reduced(<PlanVsActual />)
    expect(screen.getByText('12% over plan')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=stat-value]')).toHaveTextContent('$19,240')
    expect(screen.getByText('against a $17,190 plan')).toBeInTheDocument()
    expect(screen.getByText('Agents over plan').closest('div')).toHaveTextContent('2 of 6')
    expect(screen.getByText('+$3,470')).toBeInTheDocument()
    expect(screen.getByText('−$785')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Spend by quarter' })).toHaveAccessibleDescription(
      '$27,775 in all. $8,535 of it projected. Target $22,920.',
    )
  })

  test('the actions call your handlers', async () => {
    const user = userEvent.setup()
    const onSetPlan = vi.fn()
    const onAction = vi.fn()
    reduced(<PlanVsActual onSetPlan={onSetPlan} onAction={onAction} />)
    await user.click(screen.getByRole('button', { name: 'Set budget' }))
    expect(onSetPlan).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Stagger the batch' }))
    expect(onAction).toHaveBeenCalled()
  })

  test('your agents, months and words drive the content', () => {
    reduced(
      <PlanVsActual
        settled={6}
        top={1}
        rows={[
          { id: 'a', name: 'alpha', monthly: Array(12).fill(100), plan: 120 },
          { id: 'b', name: 'beta', monthly: Array(12).fill(50), plan: 40 },
        ]}
        facts={[]}
        copy={{ title: 'Bots', others: (n: number) => `${n} more` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Bots' })).toBeInTheDocument()
    expect(lineRows()).toEqual(['1alpha$1,200', '1 more$600'])
    expect(screen.getByText('6% under plan')).toBeInTheDocument()
  })

  test('formats rewrite the figures, and your rows and words fit another world', () => {
    reduced(
      <PlanVsActual
        year={2025}
        settled={12}
        formats={{ value: { maximumFractionDigits: 0 }, compact: { notation: 'compact' } }}
        rows={[
          { id: 'a', name: 'river-bottom', monthly: [0, 0, 0, 0, 0, 0, 0, 0, 2400, 21000, 38000, 9000], plan: 5800 },
          { id: 'b', name: 'east-quarter', monthly: [0, 0, 0, 0, 0, 0, 0, 0, 5200, 17800, 3000, 0], plan: 2400, note: 'Dry August' },
        ]}
        facts={[]}
        copy={{
          title: 'Crop yield',
          rows: 'Fields by yield',
          spendOf: (name: string) => `${name}, bushels by month`,
          rowsOver: 'Fields over plan',
          rowsOverValue: (o: number, t: number) => `${o} of ${t} fields`,
        }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Crop yield' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Fields by yield' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'river-bottom, bushels by month' })).toHaveAccessibleDescription(
      expect.stringContaining('70,400 in all'),
    )
    expect(screen.getByText('Fields over plan').closest('div')).toHaveTextContent('1 of 2 fields')
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
    expect(screen.getByText('Dry August')).toBeInTheDocument()
  })

  test('with no rows it shows the empty message over the body and disables the actions', () => {
    reduced(<PlanVsActual rows={[]} />)
    expect(screen.getByText('Nothing planned yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stagger the batch' })).toBeDisabled()
  })

  test('your empty node replaces the default message', () => {
    reduced(<PlanVsActual rows={[]} empty={<p>Add a department</p>} />)
    expect(screen.getByText('Add a department')).toBeInTheDocument()
    expect(screen.queryByText('Nothing planned yet')).not.toBeInTheDocument()
  })

  test('an error shows its message, hides the figures and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<PlanVsActual error="Couldn’t load the plan." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the plan.')).toBeInTheDocument()
    expect(screen.queryByText(/% over plan/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the body as skeletons and shows no demo figures', () => {
    reduced(<PlanVsActual loading />)
    expect(screen.getByText('Loading the plan')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(0)
    expect(screen.queryByText(/% over plan/)).not.toBeInTheDocument()
  })

  test('better over flips the tones: a row over plan is success, under it warning', () => {
    reduced(
      <PlanVsActual
        better="over"
        settled={12}
        rows={[
          { id: 'a', name: 'high', monthly: Array(12).fill(120), plan: 100 },
          { id: 'b', name: 'low', monthly: Array(12).fill(80), plan: 100 },
        ]}
        facts={[]}
      />,
    )
    expect(screen.getByRole('group', { name: 'high, spend by month' })).toHaveAttribute('data-tone', 'success')
    expect(screen.getByRole('group', { name: 'low, spend by month' })).toHaveAttribute('data-tone', 'warning')
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<PlanVsActual embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Agent spend' })).toBeInTheDocument()
  })
})
