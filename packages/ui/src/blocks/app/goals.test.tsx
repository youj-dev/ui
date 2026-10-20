import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Goals, type GoalsGoal } from './goals'
import { GOALS, forecast } from './goals/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const radios = () => within(screen.getByRole('radiogroup', { name: 'Goals' })).getAllByRole('radio')

describe('Goals block', () => {
  test('a radio per goal with its progress, share, status and landing; the first is drawn as a burn-up', () => {
    reduced(<Goals />)
    expect(screen.getByRole('heading', { level: 2, name: 'Second-half goals' })).toBeInTheDocument()
    expect(screen.getByText(/^Jul 1\s–\sDec 31 · day 102 of 184$/)).toBeInTheDocument()
    expect(radios().map((r) => r.getAttribute('data-status'))).toEqual(GOALS.map((g) => forecast(g, 184).status))
    expect(radios().map((r) => r.getAttribute('data-status'))).toEqual(['on-track', 'at-risk', 'behind', 'ahead', 'hit'])
    expect(radios()[0]).toHaveAttribute('aria-checked', 'true')
    expect(radios()[0]).toHaveAccessibleName(/^New ARR: \$[\d.]+K of \$1\.3M, \d+%\. On track\. Lands near \$1\.\d+M\.$/)
    expect(screen.getByRole('figure', { name: 'New ARR, so far and forecast' })).toHaveAccessibleDescription(/so far against an even pace of .* by today\. At this rate it lands near .* \(likely .* to .*\) against a target of \$1\.3M\.$/)
    expect(screen.getByRole('heading', { level: 3, name: 'New ARR' })).toBeInTheDocument()
  })

  test('the radios are one tab stop; arrows move the pick and the burn-up follows', async () => {
    const user = userEvent.setup()
    const onGoalChange = vi.fn()
    reduced(<Goals onGoalChange={onGoalChange} />)
    radios()[0]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(onGoalChange).toHaveBeenLastCalledWith('activated')
    expect(radios()[1]).toHaveFocus()
    expect(radios()[1]).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('heading', { level: 3, name: 'Activated teams' })).toBeInTheDocument()
    expect(screen.getByText(/^Short by [\d,]+ at this pace$/)).toBeInTheDocument()
    await user.keyboard('{End}')
    expect(onGoalChange).toHaveBeenLastCalledWith('webinars')
    expect(screen.getByText(/^Reached \w+ \d+$/)).toBeInTheDocument()
    await user.keyboard('{ArrowDown}')
    expect(radios()[0]).toHaveFocus()
  })

  test('a controlled goal asks first', async () => {
    const user = userEvent.setup()
    const onGoalChange = vi.fn()
    reduced(<Goals goal="arr" onGoalChange={onGoalChange} />)
    await user.click(radios()[3]!)
    expect(onGoalChange).toHaveBeenCalledWith('referrals')
    expect(radios()[0]).toHaveAttribute('aria-checked', 'true')
  })

  test('the forecast: pace by today, what is needed, the crossing day and the status', () => {
    const goal: GoalsGoal = { id: 'g', label: 'G', target: 100, daily: Array.from({ length: 10 }, () => 4) }
    const f = forecast(goal, 20)
    expect(f.actual).toBe(40)
    expect(f.pace).toBe(50)
    expect(f.rate).toBe(4)
    expect(f.projected).toBe(80)
    expect(f.needed).toBe(6)
    expect(f.crossing).toBeUndefined()
    expect(f.status).toBe('behind')
    expect(forecast({ ...goal, target: 75 }, 20)).toMatchObject({ status: 'ahead', crossing: 18.75 })
    expect(forecast({ ...goal, target: 30 }, 20)).toMatchObject({ status: 'hit', crossing: 8 })
  })

  test('loading, an error with Retry, and no goals', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const loading = reduced(<Goals loading />)
    expect(screen.getByText('Loading goals')).toBeInTheDocument()
    loading.unmount()
    const failed = reduced(<Goals error="It failed." onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
    failed.unmount()
    reduced(<Goals goals={[]} />)
    expect(screen.getByText('No goals for this period')).toBeInTheDocument()
  })

  describe('with your data', () => {
    test('goals, period, locale and copy drive the card', () => {
      const goals: GoalsGoal[] = [{ id: 'q', label: 'Quota', target: 1000, daily: [50, 60, 70], format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } }]
      reduced(<Goals goals={goals} start="2026-10-01" end="2026-10-31" locale="de-DE" copy={{ title: 'Quoten' }} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Quoten' })).toBeInTheDocument()
      expect(screen.getByText(/day 3 of 31$/)).toBeInTheDocument()
      expect(radios()[0]!.getAttribute('aria-label')?.replace(/\s/g, ' ')).toMatch(/^Quota: 180 € of 1.000 €, 18 %\. /)
    })

    test('another world: goals with their own units, period, status labels and copy', () => {
      const goals: GoalsGoal[] = [
        { id: 'books', label: 'Books finished', target: 10, daily: Array.from({ length: 30 }, (_, d) => (d % 5 === 0 ? 1 : 0)) },
        { id: 'pages', label: 'Pages read', target: 3_000, daily: Array.from({ length: 30 }, () => 20), format: { maximumFractionDigits: 0 } },
      ]
      reduced(<Goals goals={goals} start="2026-04-01" end="2026-06-30" copy={{ title: 'Reading year', goals: 'Reading goals', status: { hit: 'Done', ahead: 'Early', 'on-track': 'Steady', 'at-risk': 'Slipping', behind: 'Late' } }} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Reading year' })).toBeInTheDocument()
      expect(screen.getByText(/^Apr 1\s–\sJun 30 · day 30 of 91$/)).toBeInTheDocument()
      const group = within(screen.getByRole('radiogroup', { name: 'Reading goals' })).getAllByRole('radio')
      expect(group.map((r) => r.textContent)).toEqual([expect.stringContaining('Books finished'), expect.stringContaining('Pages read')])
      expect(group[1]).toHaveAccessibleName(/^Pages read: 600 of 3,000, 20%\. (Early|Steady|Slipping|Late)\. /)
      expect(screen.getByRole('heading', { level: 3, name: 'Books finished' })).toBeInTheDocument()
    })

    test('embedded is a section named by its heading; standalone draws the page', () => {
      const view = reduced(<Goals headingLevel={3} className="custom-root" data-testid="card" />)
      expect(screen.getByTestId('card')).toHaveClass('custom-root')
      expect(screen.getByRole('region', { name: 'Second-half goals' })).toBeInTheDocument()
      view.unmount()
      reduced(<Goals embedded={false} />)
      expect(screen.getByRole('main', { name: 'Second-half goals' })).toBeInTheDocument()
    })
  })
})
