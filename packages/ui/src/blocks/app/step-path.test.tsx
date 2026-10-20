import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { StepPath } from './step-path'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('StepPath', () => {
  // jsdom has no scrolling; the path scrolls the lesson up next into view.
  beforeAll(() => {
    Element.prototype.scrollTo ??= () => {}
  })

  test('shows the path, XP, the streak and today’s goal still to do', () => {
    reduced(<StepPath />)
    expect(screen.getByRole('heading', { level: 2, name: 'Spanish' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Course path' })).toBeInTheDocument()
    expect(screen.getByText('12 days')).toBeInTheDocument()
    expect(screen.getByText('Finish a lesson today to keep it going.')).toBeInTheDocument()
    expect(screen.queryByText('Goal met')).not.toBeInTheDocument()
  })

  test('Continue finishes the lesson, earns XP, keeps the streak and announces what’s next', async () => {
    const user = userEvent.setup()
    reduced(<StepPath />)
    await user.click(screen.getByRole('button', { name: /Continue/ }))
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('At the market complete, +20 XP. Up next: Reading a menu.')
    expect(screen.getByText('13 days')).toBeInTheDocument()
    expect(screen.getByText('Streak kept for today.')).toBeInTheDocument()
  })

  test('props drive another course: its week, streak and copy, with the goal met', () => {
    reduced(
      <StepPath
        copy={{ title: 'Python' }}
        sections={[{ id: 'u1', title: 'Functions', lessons: [{ id: 'def', title: 'Defining functions', mastery: 3 }, { id: 'scope', title: 'Scope' }] }]}
        current="scope"
        points={1460}
        week={[40, 80, 60, null, null, null, null]}
        streak={27}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Python' })).toBeInTheDocument()
    expect(screen.getByText('28 days')).toBeInTheDocument()
    expect(screen.getByText('Goal met')).toBeInTheDocument()
    expect(screen.getByText('40 XP to go')).toBeInTheDocument()
    expect(screen.getByText('2 lessons')).toBeInTheDocument()
  })

  test('Continue finishes the step up next, moves the path on and adds points to the streak', async () => {
    const user = userEvent.setup()
    reduced(<StepPath />)
    const current = () => document.querySelector('[data-slot=progress-path-node][data-state=current]')
    expect(current()).toHaveAttribute('data-lesson-id', 'market')
    await user.click(screen.getByRole('button', { name: /Continue/ }))
    expect(current()).toHaveAttribute('data-lesson-id', 'menu')
    expect(document.querySelector('[data-slot=counter] .sr-only')).toHaveTextContent('1,260')
  })

  test('embedded, it is a section under an h2 with the progress under an h3', () => {
    reduced(<StepPath embedded />)
    expect(screen.getByRole('region', { name: 'Spanish' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Progress' })).toBeInTheDocument()
    expect(screen.queryByRole('main')).toBeNull()
  })

  test('level, goal, step points and format drive the figures and the announcement', async () => {
    const user = userEvent.setup()
    reduced(
      <StepPath
        sections={[{ id: 'p1', title: 'Base', lessons: [{ id: 'run', title: 'Easy run' }, { id: 'lift', title: 'Full-body A' }] }]}
        current="run"
        points={1860}
        stepPoints={35}
        level={{ number: 3, from: 1500, to: 2400 }}
        goal={30}
        week={[45, 35, 40, 20, null, null, null]}
        streak={3}
        format={{ style: 'unit', unit: 'minute', unitDisplay: 'narrow' }}
        copy={{ points: 'min', total: 'Active minutes', toGo: (p) => `${p} to go`, steps: (n) => `${n} workouts`, completed: (title, gained) => `${title} done, +${gained}` }}
      />,
    )
    expect(screen.getByText('2 workouts')).toBeInTheDocument()
    expect(screen.getByText('540m to go')).toBeInTheDocument()
    // Today is Thursday, 20 of 30 so far.
    expect(screen.getByText(/^20/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Continue/ }))
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Easy run done, +35m min')
    // Thursday's 20 + 35 passes the goal of 30.
    expect(screen.getByText('Goal met')).toBeInTheDocument()
  })

  test('no sections shows the empty message; your own node replaces it', () => {
    const { unmount } = reduced(<StepPath sections={[]} />)
    expect(screen.getByText('No steps yet')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Course path' })).not.toBeInTheDocument()
    unmount()
    reduced(<StepPath sections={[]} empty={<p>Add a unit</p>} />)
    expect(screen.getByText('Add a unit')).toBeInTheDocument()
  })

  test('an error shows its message with Retry and dashes for the figures', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<StepPath error="No connection." onRetry={onRetry} />)
    expect(screen.getByText('No connection.')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Course path' })).not.toBeInTheDocument()
    expect(screen.queryByText('1,240')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  test('loading shows skeletons and none of the demo figures', () => {
    const { container } = reduced(<StepPath loading />)
    expect(screen.getByText('Loading the course')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(8)
    expect(screen.queryByText('12 days')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Course path' })).not.toBeInTheDocument()
  })
})
