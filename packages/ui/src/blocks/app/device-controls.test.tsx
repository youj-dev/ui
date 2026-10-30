import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DeviceControls } from './device-controls'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Device controls card', () => {
  test('the dial sets the picked room’s target, and a room’s lights switch updates the count', async () => {
    const user = userEvent.setup()
    reduced(<DeviceControls />)
    expect(screen.getByRole('heading', { level: 2, name: 'Home' })).toBeInTheDocument()
    const dial = screen.getByRole('slider', { name: 'Living room target temperature' })
    dial.focus()
    await user.keyboard('{ArrowUp}')
    expect(dial).toHaveAttribute('aria-valuenow', '22')
    await user.click(screen.getByRole('button', { name: /^Show Bedroom .* on the thermostat$/ }))
    expect(screen.getByRole('slider', { name: 'Bedroom target temperature' })).toHaveAttribute('aria-valuenow', '19')
    expect(screen.getByText('2 lights on')).toBeInTheDocument()
    await user.click(screen.getByRole('switch', { name: 'Lights in Bedroom' }))
    expect(screen.getByText('3 lights on')).toBeInTheDocument()
    // Off turns the thermostat off: the dial can't be turned.
    await user.click(within(screen.getByRole('group', { name: 'Mode' })).getByRole('button', { name: 'Off' }))
    expect(screen.getByRole('slider', { name: 'Bedroom target temperature' })).toBeDisabled()
    expect(screen.getByText('Heating and cooling are off')).toBeInTheDocument()
  })

  test('rooms, unit, range and schedule come from the props: zones in Fahrenheit with their own day', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    reduced(
      <DeviceControls
        unit="fahrenheit"
        range={{ min: 55, max: 90, step: 1 }}
        rooms={[
          { id: 'seedlings', name: 'Seedlings', temperature: 68, target: 72, humidity: 70, lights: true, lamps: 6 },
          { id: 'tomatoes', name: 'Tomatoes', temperature: 74, target: 75, humidity: 62, lights: false, lamps: 4 },
        ]}
        schedule={[
          { id: 'dawn', name: 'Dawn', at: '05:30', target: 68 },
          { id: 'day', name: 'Day', at: '09:00', target: 76 },
          { id: 'dusk', name: 'Dusk', at: '19:00', target: 66 },
        ]}
        nowSlot="day"
        copy={{ title: 'Greenhouse', subtitle: (n: number) => `${n} zones`, locale: 'en-US', hold: (time: string) => `Hold until ${time}` }}
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Greenhouse' })).toBeInTheDocument()
    expect(screen.getByText('2 zones')).toBeInTheDocument()
    const dial = screen.getByRole('slider', { name: 'Seedlings target temperature' })
    expect(dial).toHaveAttribute('aria-valuenow', '72')
    expect(dial).toHaveAttribute('aria-valuetext', expect.stringContaining('°F'))
    dial.focus()
    await user.keyboard('{ArrowUp}')
    expect(dial).toHaveAttribute('aria-valuenow', '73')
    expect(onChange).toHaveBeenCalled()
    expect(within(screen.getByText('Schedule').parentElement as HTMLElement).getAllByRole('listitem')).toHaveLength(3)
    expect(document.querySelector('[aria-current="time"]')).toHaveTextContent('Day')
    expect(screen.getByRole('button', { name: 'Hold until 19:00' })).toBeEnabled()
  })

  test('loading takes the rooms and the dial, no rooms shows the message, an error offers Retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<DeviceControls loading />)
    expect(screen.getByText('Loading the rooms')).toBeInTheDocument()
    expect(screen.queryByRole('slider')).toBeNull()
    expect(screen.queryByRole('switch')).toBeNull()
    const again = (ui: React.ReactNode) => rerender(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
    again(<DeviceControls rooms={[]} />)
    expect(screen.getByText('No rooms yet')).toBeInTheDocument()
    again(<DeviceControls error="Couldn’t reach the hub." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t reach the hub.')).toBeInTheDocument()
    expect(screen.queryByRole('slider')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
