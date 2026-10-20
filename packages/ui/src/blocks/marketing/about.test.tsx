import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { About } from './about'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'We build the platform we wanted when we were the ones on call.'
const figures = () => screen.getAllByRole('definition').map((d) => d.querySelector('.sr-only')?.textContent)

describe('About', () => {
  test('a labeled section whose title is the mission, the story under it and the values after', () => {
    reduced(<About />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Still answering the queue', 'What we hold ourselves to'])
    expect(screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual([
      'Make it boring to ship',
      'Default to open',
      'Care for the people on call',
      'Leave it lighter',
    ])
  })

  test('the years are tabs: under reduced motion the story rests on today, with today’s figures', () => {
    reduced(<About />)
    const years = screen.getByRole('tablist', { name: 'Northwind, year by year' })
    expect(
      within(years)
        .getAllByRole('tab')
        .map((t) => t.textContent),
    ).toEqual(['2019', '2020', '2021', '2022', '2023', '2024', 'Today'])
    expect(within(years).getByRole('tab', { name: 'Today, Still answering the queue' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Today, Still answering the queue')
    expect(figures()).toEqual(['126', '40K', '38'])
    // Nothing plays under reduced motion, so there's nothing to pause.
    expect(screen.queryByRole('button', { name: /story/ })).not.toBeInTheDocument()
  })

  test('picking a year swaps the chapter and rolls the figures to how they stood; the arrow keys move along the rail', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<About onValueChange={onValueChange} />)
    await user.click(screen.getByRole('tab', { name: '2021, Out of Europe' }))
    expect(onValueChange).toHaveBeenLastCalledWith('2021')
    expect(screen.getByRole('heading', { level: 3, name: 'Out of Europe' })).toBeInTheDocument()
    expect(figures()).toEqual(['34', '4.2K', '6'])
    await user.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith('2022')
    expect(screen.getByRole('tab', { name: '2022, Rollback in a second' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(onValueChange).toHaveBeenLastCalledWith('2019')
    await user.keyboard('{End}')
    expect(onValueChange).toHaveBeenLastCalledWith('Today')
  })

  test('with motion the story starts at its first year and offers a pause; a pick stops the tour', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="never">
        <About />
      </YoujProvider>,
    )
    expect(screen.getByRole('tab', { name: '2019, A weekend project' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Pause the story' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: '2023, The edge, everywhere' }))
    expect(screen.getByRole('button', { name: 'Play the story' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Play the story' }))
    expect(screen.getByRole('button', { name: 'Pause the story' })).toBeInTheDocument()
  })

  test('a controlled year follows the prop', () => {
    const { rerender } = reduced(<About value="2020" />)
    expect(screen.getByRole('heading', { level: 3, name: 'A preview for every pull request' })).toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <About value="2024" />
      </YoujProvider>,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Calm at scale' })).toBeInTheDocument()
  })

  test('your milestones, metrics and values drive it; empty lists remove their parts', () => {
    const { unmount } = reduced(
      <About
        metrics={[{ id: 'cafes', label: 'Cafés', chart: true }]}
        milestones={[
          { label: '2019', title: 'A stall', description: 'Saturdays at the market.', figures: { cafes: 0 } },
          { label: 'Today', title: 'Six hundred cafés', description: 'Roasted to order.', figures: { cafes: 600 } },
        ]}
        values={[{ title: 'Know the farm', description: 'Every bag names the farmer.' }]}
        copy={{ timeline: 'Fernhill so far' }}
      />,
    )
    expect(within(screen.getByRole('tablist', { name: 'Fernhill so far' })).getAllByRole('tab')).toHaveLength(2)
    expect(screen.getByRole('term')).toHaveTextContent('Cafés')
    expect(figures()).toEqual(['600'])
    expect(screen.getByRole('heading', { name: 'Know the farm' })).toBeInTheDocument()
    unmount()
    reduced(<About milestones={[]} values={[]} />)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByText('What we hold ourselves to')).not.toBeInTheDocument()
  })

  test('figures are written in the given locale', async () => {
    reduced(
      <About
        locale="de-DE"
        metrics={[{ id: 'n', label: 'Anfragen' }]}
        milestones={[{ label: 'Heute', title: 'Viele', description: '', figures: { n: 1234567 } }]}
      />,
    )
    await waitFor(() => expect(figures()).toEqual(['1.234.567']))
  })

  test('copy rewrites the strings; headingLevel and rest props apply; embedded and theme', () => {
    reduced(<About embedded theme={brutal} headingLevel={1} id="about" copy={{ mission: 'We make coffee.', valuesTitle: 'Values' }} />)
    const section = screen.getByRole('region', { name: 'We make coffee.' })
    expect(section).toHaveAttribute('id', 'about')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'We make coffee.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Values' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Make it boring to ship' })).toBeInTheDocument()
  })
})
