import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { HeadToHead } from './head-to-head'
import { CONTENDERS, METRICS, type HeadToHeadMetric } from './head-to-head/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const metric = (name: string) => screen.getAllByRole('listitem').find((li) => li.textContent?.startsWith(name))!

describe('Head to head block', () => {
  test('marks the overall winner and each row’s winner with its margin', () => {
    reduced(<HeadToHead />)
    expect(screen.getByRole('heading', { level: 2, name: 'Compare' })).toBeInTheDocument()
    const contenders = within(screen.getByRole('group', { name: 'Contenders' }))
    expect(contenders.getByText('4 of 6 wins')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=head-to-head-contender][data-winner]')).toHaveTextContent('tern-mini-0926')
    expect(metric('Accuracy')).toHaveTextContent('B +1.2 pt')
    expect(metric('Faithfulness')).toHaveTextContent('A +1.5 pt')
    expect(metric('Latency p95')).toHaveTextContent('B -47%')
    expect(metric('Toxicity')).toHaveTextContent('Even')
    expect(within(metric('Latency p95')).getByText('B is better by -47%')).toHaveClass('sr-only')
  })

  test('states the trade-off: the cost and quality change, as a picture with a name', () => {
    reduced(<HeadToHead />)
    const tradeoff = screen.getByRole('group', { name: 'Cost against quality' })
    expect(within(tradeoff).getByRole('img')).toHaveAccessibleName('Cost against quality. B: -67% cost, +0.8 pt quality.')
    expect(tradeoff).toHaveTextContent('-67%')
    expect(tradeoff).toHaveTextContent('+0.8 pt')
  })

  test('chooses a side and promotes it', async () => {
    const user = userEvent.setup()
    const promoted: string[] = []
    reduced(<HeadToHead onChoose={(side, c) => void promoted.push(`${side}:${c.name}`)} />)
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: 'Promote A' }))
    await waitFor(() => expect(promoted).toEqual(['a:tern-large-0904']))
  })

  test('the baseline holds when the candidate wins fewer rows', () => {
    reduced(
      <HeadToHead
        embedded
        contenders={{ a: CONTENDERS.a, b: { ...CONTENDERS.b, y: 86 } }}
        metrics={METRICS.map((m) =>
          m.id === 'accuracy' ? { ...m, b: 87.9 } : m.id === 'refusals' ? { ...m, b: 4.4 } : m.id === 'latency' ? { ...m, b: 1990 } : m,
        )}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Compare' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot=head-to-head-contender][data-winner]')).toHaveTextContent('tern-large-0904')
    expect(screen.getByRole('button', { name: 'Promote A' })).toBeInTheDocument()
  })

  describe('as data', () => {
    const offers = {
      a: { name: 'Northwind Labs', role: 'Offer A', x: 45, y: 142_000 },
      b: { name: 'Cobalt Health', role: 'Offer B', x: 15, y: 128_000 },
    }
    const rows: HeadToHeadMetric[] = [
      {
        id: 'salary',
        label: 'Salary',
        a: 142_000,
        b: 128_000,
        better: 'higher',
        format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
        margin: 'relative',
      },
      {
        id: 'pto',
        label: 'Paid time off',
        a: 15,
        b: 24,
        better: 'higher',
        format: { style: 'unit', unit: 'day', unitDisplay: 'long' },
        margin: (w: number, o: number) => `+${w - o} days`,
      },
    ]

    test('a metric names itself, writes its own values and its own margin', () => {
      reduced(<HeadToHead contenders={offers} metrics={rows} />)
      expect(metric('Salary')).toHaveTextContent('$142,000')
      expect(metric('Salary')).toHaveTextContent('A +11%')
      expect(metric('Paid time off')).toHaveTextContent('B +9 days')
      expect(metric('Paid time off')).toHaveTextContent('15 days')
    })

    test('format writes the contender’s figure and the trade-off’s change', () => {
      reduced(
        <HeadToHead
          contenders={offers}
          metrics={rows}
          format={{ x: (v) => `${v} min`, yDelta: (from, to) => `${to - from}` }}
          copy={{ xUnit: 'each way', summary: (n: string, x: string, y: string) => `${n}: ${x} / ${y}` }}
        />,
      )
      expect(screen.getByText('45 min')).toBeInTheDocument()
      expect(screen.getAllByText(/each way/)).toHaveLength(2)
      expect(within(screen.getByRole('group', { name: 'Cost against quality' })).getByRole('img')).toHaveAccessibleName(
        'Cost against quality. B: -67% / -14000',
      )
    })

    test('copy rewrites the action and the group names', async () => {
      const user = userEvent.setup()
      const picked: string[] = []
      reduced(
        <HeadToHead
          contenders={offers}
          metrics={rows}
          copy={{ choose: (n: string) => `Accept ${n}`, contenders: 'Offers' }}
          onChoose={(side, c) => void picked.push(`${side}:${c.name}`)}
        />,
      )
      expect(screen.getByRole('group', { name: 'Offers' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Accept B' }))
      await waitFor(() => expect(picked).toEqual(['b:Cobalt Health']))
    })

    test('with no metrics it shows the empty state', () => {
      reduced(<HeadToHead metrics={[]} />)
      expect(screen.getByText('Nothing to compare')).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Metrics' })).toBeNull()
    })

    test('your empty node replaces the default message', () => {
      reduced(<HeadToHead metrics={[]} empty={<p>Add an offer</p>} />)
      expect(screen.getByText('Add an offer')).toBeInTheDocument()
      expect(screen.queryByText('Nothing to compare')).toBeNull()
    })

    test('an error shows its message and Retry calls onRetry', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      reduced(<HeadToHead error="Couldn’t load the comparison." onRetry={onRetry} />)
      expect(screen.getByText('Couldn’t load the comparison.')).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Contenders' })).toBeNull()
      expect(screen.getByRole('button', { name: 'Promote B' })).toBeDisabled()
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    test('loading holds the comparison’s place and shows no demo figures', () => {
      reduced(<HeadToHead loading />)
      expect(screen.getByText('Loading the comparison')).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Contenders' })).toBeNull()
      expect(screen.queryByText('Same 540 cases · seed 21')).toBeNull()
    })
  })
})
