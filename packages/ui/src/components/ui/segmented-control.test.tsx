import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SegmentedControl, SegmentedControlItem, type SegmentedControlProps } from './segmented-control'

function Range(props: Partial<SegmentedControlProps>) {
  return (
    <SegmentedControl aria-label="Range" defaultValue="7d" {...props}>
      <SegmentedControlItem value="24h">24h</SegmentedControlItem>
      <SegmentedControlItem value="7d">7d</SegmentedControlItem>
      <SegmentedControlItem value="30d">30d</SegmentedControlItem>
    </SegmentedControl>
  )
}

const pressed = () => screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent)

describe('SegmentedControl', () => {
  test('is a named group of pressable segments with one raised key', () => {
    const { container } = render(<Range />)
    expect(screen.getByRole('group', { name: 'Range' })).toHaveAttribute('data-slot', 'segmented-control')
    expect(pressed()).toEqual(['7d'])
    const indicator = container.querySelector('[data-slot=toggle-group-indicator]')
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveAttribute('aria-hidden', 'true')
  })

  test('reports the pressed value as a string, and never empties', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Range onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: '30d' }))
    expect(onValueChange).toHaveBeenLastCalledWith('30d')
    expect(pressed()).toEqual(['30d'])
    await user.click(screen.getByRole('button', { name: '30d' }))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(pressed()).toEqual(['30d'])
  })

  test('controlled: follows value, and the owner decides', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState('24h')
      return (
        <>
          <Range defaultValue={undefined} value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      )
    }
    render(<Controlled />)
    expect(pressed()).toEqual(['24h'])
    await user.click(screen.getByRole('button', { name: '7d' }))
    expect(screen.getByRole('status')).toHaveTextContent('7d')
    expect(pressed()).toEqual(['7d'])
  })

  test('one tab stop; arrow keys rove and Space presses', async () => {
    const user = userEvent.setup()
    render(<Range />)
    await user.tab()
    expect(screen.getByRole('button', { name: '24h' })).toHaveFocus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByRole('button', { name: '30d' })).toHaveFocus()
    await user.keyboard(' ')
    expect(pressed()).toEqual(['30d'])
    await user.keyboard('{Home}')
    expect(screen.getByRole('button', { name: '24h' })).toHaveFocus()
    await user.tab()
    expect(document.body).toHaveFocus()
  })

  test('starts with no segment pressed when there is no default', () => {
    const { container } = render(<Range defaultValue={undefined} />)
    expect(pressed()).toEqual([])
    expect(container.querySelector('[data-slot=segmented-control-item]')).toBeInTheDocument()
  })

  test('marks its segments for reduced motion, so presses do not scale', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Range />
      </YoujProvider>,
    )
    for (const item of screen.getAllByRole('button')) expect(item).toHaveAttribute('data-reduced-motion', 'true')
  })

  test('unmounts cleanly', () => {
    const { unmount } = render(<Range />)
    unmount()
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })
})
