import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StagedRollout } from './staged-rollout'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const ruler = () => screen.getByRole('slider', { name: 'Rolled out to' })

describe('Staged rollout block', () => {
  test('shows the selected item on its ruler, with the users it exposes and every item’s own meter', () => {
    reduced(<StagedRollout />)
    expect(screen.getByRole('heading', { level: 2, name: 'Rollout' })).toBeInTheDocument()
    expect(ruler()).toHaveAttribute('aria-valuetext', '10%')
    expect(screen.getByText('12,480')).toBeInTheDocument()
    expect(screen.getByText('Rolling out')).toBeInTheDocument()
    expect(screen.getAllByRole('meter')).toHaveLength(5)
    expect(screen.getByRole('meter', { name: 'usage-billing: Production' })).toHaveAttribute('aria-valuetext', 'Internal at 1%')
  })

  test('stepping the ruler leaves an unsaved change that Apply saves', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    reduced(<StagedRollout onApply={onApply} />)
    const apply = screen.getByRole('button', { name: 'Apply rollout' })
    expect(apply).toBeDisabled()
    act(() => ruler().focus())
    await user.keyboard('{ArrowRight}')
    expect(ruler()).toHaveAttribute('aria-valuetext', '50%')
    expect(screen.getByText('Unsaved · 10% → 50%')).toBeInTheDocument()
    await user.click(apply)
    await waitFor(() => expect(screen.getByText('Saved · 50%')).toBeInTheDocument())
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ key: 'checkout-v2', rollout: expect.objectContaining({ production: 50 }) }))
  })

  test('the kill switch rolls the item back to 0% at once, and Restore brings it back', async () => {
    const user = userEvent.setup()
    const onStop = vi.fn()
    reduced(<StagedRollout onStop={onStop} />)
    await user.click(screen.getByRole('button', { name: 'Kill switch' }))
    expect(ruler()).toHaveAttribute('aria-valuetext', 'Off')
    expect(screen.getByText('Killed')).toBeInTheDocument()
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'checkout-v2 killed: rolled back to 0%')).toBe(true)
    expect(onStop).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'checkout-v2' }), true)
    await user.click(screen.getByRole('button', { name: 'Restore 10%' }))
    expect(ruler()).toHaveAttribute('aria-valuetext', '10%')
    expect(onStop).toHaveBeenLastCalledWith(expect.objectContaining({ key: 'checkout-v2' }), false)
  })

  test('picking an item or an environment steers the ruler', async () => {
    const user = userEvent.setup()
    reduced(<StagedRollout />)
    await user.click(screen.getByRole('button', { name: 'Semantic search, show its rollout' }))
    expect(screen.getByRole('button', { name: 'Semantic search, show its rollout' })).toHaveAttribute('aria-pressed', 'true')
    expect(ruler()).toHaveAttribute('aria-valuetext', '50%')
    await user.click(screen.getByRole('button', { name: 'Staging' }))
    expect(ruler()).toHaveAttribute('aria-valuetext', 'GA at 100%')
    const row = screen.getByRole('button', { name: 'Semantic search, show its rollout' }).closest('li')!
    expect(within(row).getByText('stg')).toBeInTheDocument()
  })

  test('an item over its guardrail reads its rate in the warning tone; embedded is a section', () => {
    reduced(<StagedRollout embedded defaultItem="inbox-summaries" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Rollout' })).toBeInTheDocument()
    expect(screen.getByText('1.34%')).toHaveClass('text-warning-text')
  })

  const items = [
    { key: 'monthly-29', name: 'Monthly at $29', rollout: { us: 50, eu: 25 }, rate: 0.034 },
    { key: 'monthly-19', name: 'Monthly at $19', rollout: { us: 25, eu: 10 }, rate: 0.012 },
  ]
  const environments = [
    { id: 'us', label: 'US', audience: 600_000 },
    { id: 'eu', label: 'EU', short: 'eu-w', audience: 400_000 },
  ]
  const stages = [
    { value: 10, label: 'Pilot' },
    { value: 25, label: '25%' },
    { value: 50, label: '50%' },
    { value: 100, label: 'Winner' },
  ]

  test('your items, environments, stages and words drive the card: nothing of the flag demo is left', async () => {
    const user = userEvent.setup()
    reduced(
      <StagedRollout
        items={items}
        environments={environments}
        stages={stages}
        guardrail={0.03}
        copy={{ title: 'Price test', exposed: 'Visitors in test', rate: 'Refund rate', items: 'Price variants', itemCount: (count, rolling) => `${count} variants · ${rolling} testing`, stop: 'Stop test', restore: (share) => `Resume at ${share}` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Price test' })).toBeInTheDocument()
    expect(screen.getByText('Visitors in test')).toBeInTheDocument()
    expect(screen.getByText('Refund rate')).toBeInTheDocument()
    expect(screen.getByText('Price variants')).toBeInTheDocument()
    // The first environment opens: half of 600,000 visitors, the rate over its 3% guardrail.
    expect(screen.getByText('300,000')).toBeInTheDocument()
    expect(screen.getByText('3.40%')).toHaveClass('text-warning-text')
    expect(screen.getByText('guardrail 3.00%')).toBeInTheDocument()
    expect(ruler()).toHaveAttribute('aria-valuetext', '50%')
    await user.click(screen.getByRole('button', { name: 'EU' }))
    expect(ruler()).toHaveAttribute('aria-valuetext', '25%')
    const row = screen.getByRole('button', { name: 'Monthly at $19, show its rollout' }).closest('li')!
    expect(within(row).getByText('eu-w')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Stop test' }))
    expect(screen.getByRole('button', { name: 'Resume at 25%' })).toBeInTheDocument()
    expect(screen.queryByText(/flag|prod|staging/i)).toBeNull()
  })

  test('format writes the rate and the audience figures', () => {
    reduced(<StagedRollout items={items} environments={environments} format={{ rate: (ratio) => `${ratio * 1000} per 1,000`, audience: (count) => `${count / 1000}k` }} />)
    expect(screen.getByText('34 per 1,000')).toBeInTheDocument()
    expect(screen.getByText('300k')).toBeInTheDocument()
    expect(screen.getByText('/ 600k')).toBeInTheDocument()
  })
})
