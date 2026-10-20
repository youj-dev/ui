import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DensityLanes, type DensityLane } from './density-lanes'

const COLUMNS = ['00:00', '06:00', '12:00', '18:00']
const LANES: DensityLane[] = [
  { id: 'id', label: 'Identity', values: [2, 6, 12, 4], tone: 'chart-3' },
  { id: 'net', label: 'Network', values: [8, 1, 0, 3] },
]
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const columnsOf = (lane: number) => [
  ...document.querySelectorAll('[data-slot=density-lanes-lane]')[lane]!.querySelectorAll('[data-slot=density-lanes-column]'),
]

describe('DensityLanes', () => {
  test('is a named grid, a row per lane headed by its name and share, described by a summary', () => {
    reduced(<DensityLanes lanes={LANES} columns={COLUMNS} label="Alerts by hour" />)
    const grid = screen.getByRole('grid', { name: 'Alerts by hour' })
    expect(grid).toHaveAccessibleDescription('2 lanes, 36 in all. The busiest column is 12:00, with 12.')
    const rows = within(grid).getAllByRole('row')
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getByRole('rowheader')).toHaveTextContent('Identity67%')
    expect(
      within(rows[1]!)
        .getAllByRole('gridcell')
        .map((c) => c.getAttribute('aria-label')),
    ).toEqual(['00:00: 8', '06:00: 1', '12:00: 0', '18:00: 3'])
  })

  test('each column swells around the spine by its value on one scale, and an empty one draws nothing', () => {
    reduced(<DensityLanes lanes={LANES} columns={COLUMNS} depth={4} />)
    // 12 is the top of the scale: 4 dots above and below the spine. 8 rounds to 3, 0 draws no column.
    expect(columnsOf(0)[2]!.querySelectorAll('circle')).toHaveLength(9)
    expect(columnsOf(1)[0]!.querySelectorAll('circle')).toHaveLength(7)
    expect(columnsOf(1)).toHaveLength(3)
  })

  test('a lane grows with the width only until its dots are maxDot apart', () => {
    reduced(<DensityLanes lanes={LANES} columns={COLUMNS} depth={4} maxDot={12} />)
    const plot = document.querySelector<HTMLElement>('[data-slot=density-lanes-plot]')!
    // 4 columns by 9 rows of dots, never taller than 9 dots 12px apart.
    expect(plot.style.aspectRatio).toBe('4 / 9')
    expect(plot.style.maxHeight).toBe('108px')
  })

  test('a highlight keeps its columns in tone and says so; a marker flags its column', () => {
    reduced(<DensityLanes lanes={LANES} columns={COLUMNS} highlight={[[2, 3]]} marker={{ column: 2, label: 'Peak 12:00' }} />)
    expect(columnsOf(0).map((c) => c.getAttribute('data-highlighted'))).toEqual([null, null, 'true', 'true'])
    expect(screen.getAllByRole('gridcell')[2]).toHaveAccessibleName('12:00: 12, highlighted')
    expect(screen.getByText('Peak 12:00')).toBeInTheDocument()
  })

  test('is one tab stop: arrows walk the columns and lanes, Home and End a lane’s ends', async () => {
    const user = userEvent.setup()
    reduced(<DensityLanes lanes={LANES} columns={COLUMNS} />)
    await user.tab()
    expect(document.activeElement).toHaveAccessibleName('00:00: 2')
    expect(screen.getAllByRole('gridcell').filter((c) => c.tabIndex === 0)).toHaveLength(1)
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(document.activeElement).toHaveAccessibleName('12:00: 12')
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveAccessibleName('12:00: 0')
    await user.keyboard('{End}')
    expect(document.activeElement).toHaveAccessibleName('18:00: 3')
    await user.keyboard('{Home}{ArrowUp}')
    expect(document.activeElement).toHaveAccessibleName('00:00: 2')
  })

  test('formats values with your formatter, and hides shares on request', () => {
    reduced(<DensityLanes lanes={LANES} columns={COLUMNS} shares={false} formatValue={(v) => `${v} alerts`} />)
    expect(screen.getAllByRole('rowheader')[0]).toHaveTextContent(/^Identity$/)
    expect(screen.getAllByRole('gridcell')[0]).toHaveAccessibleName('00:00: 2 alerts')
  })

  test('with nothing to show it says so, and the labels translate it', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ noData: 'Keine Daten' }}>
        <DensityLanes lanes={[]} columns={COLUMNS} />
      </YoujProvider>,
    )
    expect(screen.getByText('Keine Daten')).toBeInTheDocument()
  })
})
