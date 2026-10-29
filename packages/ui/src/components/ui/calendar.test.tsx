import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Calendar } from './calendar'

const sept = new Date(2026, 8, 1)

describe('Calendar', () => {
  test('is a labelled grid of day buttons; clicking a day selects it', async () => {
    const onSelect = vi.fn()
    render(<Calendar mode="single" defaultMonth={sept} onSelect={onSelect} />)
    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /September 15, 2026/ }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect((onSelect.mock.calls[0]![0] as Date).getDate()).toBe(15)
  })

  test('arrow keys move focus by day and Enter selects', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Calendar mode="single" defaultMonth={sept} selected={new Date(2026, 8, 15)} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /September 15/ }))
    onSelect.mockClear()
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(document.activeElement).toHaveAccessibleName(/September 23/)
    await user.keyboard('{Enter}')
    expect((onSelect.mock.calls[0]![0] as Date).getDate()).toBe(23)
  })

  test('disabled days cannot be picked and bounds stop the arrows', async () => {
    const onSelect = vi.fn()
    render(
      <Calendar
        mode="single"
        defaultMonth={sept}
        startMonth={sept}
        endMonth={sept}
        disabled={{ before: new Date(2026, 8, 10) }}
        onSelect={onSelect}
      />,
    )
    const early = screen.getByRole('button', { name: /September 5/ })
    expect(early).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous month/i })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: /next month/i })).toHaveAttribute('aria-disabled', 'true')
  })

  test('marks today, selection and range ends for styling', () => {
    const { container } = render(
      <Calendar mode="range" defaultMonth={sept} selected={{ from: new Date(2026, 8, 3), to: new Date(2026, 8, 6) }} />,
    )
    expect(container.querySelector('[data-day="2026-09-03"][data-range-start]')).toBeInTheDocument()
    expect(container.querySelector('[data-day="2026-09-04"][data-range-middle]')).toBeInTheDocument()
    expect(container.querySelector('[data-day="2026-09-06"][data-range-end]')).toBeInTheDocument()
  })

  test('slides months with motion, and not under reduced motion', () => {
    const { container, unmount } = render(<Calendar mode="single" defaultMonth={sept} />)
    expect(container.querySelector('[data-animated-month]')).toBeInTheDocument()
    unmount()
    const reduced = render(
      <YoujProvider reducedMotion="always">
        <Calendar mode="single" defaultMonth={sept} />
      </YoujProvider>,
    )
    expect(reduced.container.querySelector('[data-animated-month]')).not.toBeInTheDocument()
  })
})
