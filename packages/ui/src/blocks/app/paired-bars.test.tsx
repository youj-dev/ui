import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PairedBars } from './paired-bars'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const table = () => screen.getByRole('table', { name: 'Models by plan' })
const body = () => within(table()).getAllByRole('row').slice(1)
const names = () => body().map((r) => within(r).getByRole('rowheader').querySelector('.font-medium')?.textContent)

describe('Paired bars block', () => {
  test('is a table: a column per fact, a row per model, the plans named in each number', () => {
    reduced(<PairedBars />)
    expect(screen.getByRole('heading', { level: 2, name: 'Plan comparison' })).toBeInTheDocument()
    for (const name of ['Model', 'Requests, log scale', 'Requests', 'Starter / mo', 'Team / mo'])
      expect(within(table()).getByRole('columnheader', { name })).toBeInTheDocument()
    expect(names()).toEqual(['Marlin 2', 'Marlin 2 Mini', 'Quill Vision', 'Quill Chat', 'Orrery Embed', 'Orrery Rerank'])
    const first = body()[0]!
    expect(within(first).getByRole('rowheader')).toHaveTextContent('New')
    expect(first).toHaveTextContent('Starter 1,200')
    expect(first).toHaveTextContent('Team 38,000')
  })

  test('an old price stays beside the new one, struck through and spoken as "was"', () => {
    reduced(<PairedBars />)
    const cell = within(body()[0]!).getAllByRole('cell').at(-1)!
    expect(cell).toHaveTextContent('$29')
    const old = cell.querySelector('del')!
    expect(old).toHaveTextContent('was $39')
  })

  test('a plan that does not offer a row says so instead of a price', () => {
    reduced(<PairedBars visible={14} />)
    const voice = body().find((r) => r.textContent?.includes('Fenwick Voice'))!
    expect(voice).toHaveTextContent('Not offered')
  })

  test('both bars sit on one shared axis: the larger value is the longer bar, on every row', () => {
    reduced(<PairedBars />)
    const [a, b] = Array.from(body()[0]!.querySelectorAll<HTMLElement>('[data-slot=paired-bars-bar]'))
    expect(parseFloat(a!.style.width)).toBeLessThan(parseFloat(b!.style.width))
    const axis = Array.from(document.querySelectorAll('[data-slot=paired-bars-axis] span')).map((s) => s.textContent)
    expect(axis).toEqual(['100', '1K', '10K', '40K'])
  })

  test('the axis can be linear', () => {
    reduced(<PairedBars scale="linear" />)
    expect(within(table()).getAllByRole('columnheader')[1]).toHaveTextContent('Requests')
    const axis = Array.from(document.querySelectorAll('[data-slot=paired-bars-axis] span')).map((s) => s.textContent)
    expect(axis).toEqual(['0', '10K', '20K', '30K', '40K'])
  })

  test('search narrows the rows by name, announces the count and keeps the room as tall', async () => {
    const user = userEvent.setup()
    reduced(<PairedBars />)
    const room = document.querySelector<HTMLElement>('[data-slot=paired-bars-room]')!
    const height = room.style.height
    await user.type(screen.getByRole('searchbox', { name: 'Search models' }), 'quill')
    expect(names()).toEqual(['Quill Vision', 'Quill Chat'])
    expect(screen.getByRole('status')).toHaveTextContent('2 of 14 models')
    expect(room.style.height).toBe(height)
    await user.clear(screen.getByRole('searchbox'))
    await user.type(screen.getByRole('searchbox'), 'zzz')
    expect(screen.getByText('No models match')).toBeInTheDocument()
    expect(room.style.height).toBe(height)
  })

  test('View all shows every row in the same room, which then scrolls, and Show fewer goes back', async () => {
    const user = userEvent.setup()
    const onExpandedChange = vi.fn()
    reduced(<PairedBars onExpandedChange={onExpandedChange} />)
    const room = document.querySelector<HTMLElement>('[data-slot=paired-bars-room]')!
    const height = room.style.height
    await user.click(screen.getByRole('button', { name: 'View all 14' }))
    expect(onExpandedChange).toHaveBeenCalledWith(true)
    expect(names()).toHaveLength(14)
    expect(room.style.height).toBe(height)
    expect(screen.getByRole('region', { name: 'All models' })).toHaveAttribute('tabindex', '0')
    await user.click(screen.getByRole('button', { name: 'Show fewer' }))
    expect(names()).toHaveLength(6)
  })

  test('no View all when everything already shows', () => {
    reduced(<PairedBars rows={[{ id: 'a', name: 'Only', values: [1, 2] }]} />)
    expect(screen.queryByRole('button', { name: /View all/ })).not.toBeInTheDocument()
  })

  test('props drive the content and copy rewrites the text', () => {
    reduced(
      <PairedBars
        copy={{ title: 'Tiers', nameHeader: 'Feature', viewAll: (n: number) => `All ${n}` }}
        sides={[
          { id: 'x', label: 'Free' },
          { id: 'y', label: 'Pro' },
        ]}
        visible={1}
        rows={[
          { id: 'a', name: 'Mailer', values: [5, 50], figures: [{ amount: 0 }, { amount: 9 }], badges: [{ label: 'Limited', tone: 'warning' }] },
          { id: 'b', name: 'Vault', values: [1, 9] },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Tiers' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Feature' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Pro / mo' })).toBeInTheDocument()
    expect(names()).toEqual(['Mailer'])
    expect(screen.getByRole('button', { name: 'All 2' })).toBeInTheDocument()
  })

  test('loading and error states stand in for the table', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<PairedBars loading />)
    expect(screen.getByText('Loading the plans')).toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <PairedBars error="Down" onRetry={onRetry} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })

  describe('as data', () => {
    const sides = [
      { id: 'a', label: 'North High' },
      { id: 'b', label: 'Lakeview' },
    ] as const
    const rows = [
      { id: 'size', name: 'Class size', values: [28, 19] as [number, number] },
      { id: 'score', name: 'Test scores', values: [0.78, 0.91] as [number, number], format: { style: 'percent' } as Intl.NumberFormatOptions },
      {
        id: 'tuition',
        name: 'Tuition',
        values: [14_500, 28_900] as [number, number],
        format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as Intl.NumberFormatOptions,
      },
    ]

    test('each row writes its own numbers, and the sides are named in each', () => {
      reduced(<PairedBars sides={sides} rows={rows} />)
      expect(body()[0]).toHaveTextContent('North High 28')
      expect(body()[1]).toHaveTextContent('Lakeview 91%')
      expect(body()[2]).toHaveTextContent('North High $14,500')
      expect(body()[2]).toHaveTextContent('Lakeview $28,900')
    })

    test('without figures there is no figure column', () => {
      reduced(<PairedBars sides={sides} rows={rows} />)
      expect(within(table()).queryByRole('columnheader', { name: 'North High / mo' })).toBeNull()
      expect(within(table()).getAllByRole('columnheader')).toHaveLength(3)
    })

    test('a figure column heads each side with copy.figureHeader', () => {
      reduced(
        <PairedBars
          sides={sides}
          rows={[{ ...rows[0]!, figures: [{ amount: 5 }, { amount: 9, was: 12 }] }]}
          copy={{ figureHeader: (side: string) => `${side} fee` }}
        />,
      )
      expect(within(table()).getByRole('columnheader', { name: 'Lakeview fee' })).toBeInTheDocument()
      expect(body()[0]).toHaveTextContent('was $12')
    })

    test('copy rewrites the table’s words', () => {
      reduced(<PairedBars sides={sides} rows={rows} copy={{ tableLabel: 'Schools', valuesHeader: 'Figures', search: 'Search measures' }} />)
      expect(screen.getByRole('table', { name: 'Schools' })).toBeInTheDocument()
      expect(screen.getByRole('searchbox', { name: 'Search measures' })).toBeInTheDocument()
    })

    test('with no rows it shows the empty state', () => {
      reduced(<PairedBars sides={sides} rows={[]} />)
      expect(screen.getByText('No models match')).toBeInTheDocument()
    })

    test('your empty node replaces the default message', () => {
      reduced(<PairedBars rows={[]} empty={<p>Add a school</p>} />)
      expect(screen.getByText('Add a school')).toBeInTheDocument()
      expect(screen.queryByText('No models match')).toBeNull()
    })

    test('an error shows its message and Retry calls onRetry, with no table', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      reduced(<PairedBars error="Couldn’t load the schools." onRetry={onRetry} />)
      expect(screen.getByText('Couldn’t load the schools.')).toBeInTheDocument()
      expect(screen.queryByRole('table')).toBeNull()
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })
})
