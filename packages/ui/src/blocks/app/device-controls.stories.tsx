import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DeviceControls } from './device-controls'

const meta: Meta<typeof DeviceControls> = {
  title: 'Blocks/App/Device Controls',
  component: DeviceControls,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Keep an eye on a set of rooms with their temperatures, light controls and a thermostat dial: a home, an office floor, a greenhouse.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DeviceControls>

export const Default: Story = { name: 'Home' }

/** Cooling: the lit stretch runs down from the room to the target, in blue. */
export const Cooling: Story = {
  args: {
    defaultMode: 'cool',
    rooms: [
      { id: 'living', name: 'Living room', temperature: 25.8, target: 23, humidity: 58, lights: false, lamps: 4 },
      { id: 'kitchen', name: 'Kitchen', temperature: 26.4, target: 24, humidity: 55, lights: true, lamps: 3 },
      { id: 'bedroom', name: 'Bedroom', temperature: 24.9, target: 22, humidity: 61, lights: false, lamps: 2 },
      { id: 'office', name: 'Office', temperature: 25.1, target: 23.5, humidity: 49, lights: false, lamps: 2 },
    ],
  },
}

/** An office floor: meeting rooms in °C, a working-day schedule and the whole floor's lights. */
export const OfficeFloor: Story = {
  name: 'Office floor',
  args: {
    defaultMode: 'auto',
    rooms: [
      { id: 'atlas', name: 'Atlas · 10 seats', temperature: 22.4, target: 22, humidity: 44, lights: true, lamps: 6 },
      { id: 'fjord', name: 'Fjord · 6 seats', temperature: 21.6, target: 22, humidity: 47, lights: true, lamps: 4 },
      { id: 'studio', name: 'Studio', temperature: 23.1, target: 22.5, humidity: 42, lights: false, lamps: 8 },
      { id: 'quiet', name: 'Quiet room', temperature: 21.2, target: 21.5, humidity: 49, lights: false, lamps: 2 },
      { id: 'desks', name: 'Open desks', temperature: 22.8, target: 22, humidity: 45, lights: true, lamps: 14 },
      { id: 'kitchen', name: 'Kitchen', temperature: 23.5, target: 23, humidity: 51, lights: true, lamps: 5 },
    ],
    schedule: [
      { id: 'open', name: 'Opening', at: '07:30', target: 21.5 },
      { id: 'core', name: 'Core hours', at: '09:00', target: 22 },
      { id: 'lunch', name: 'Lunch', at: '12:30', target: 23 },
      { id: 'after', name: 'After hours', at: '18:30', target: 18 },
    ],
    nowSlot: 'core',
    energy: { used: 41.6, budget: 64 },
    copy: {
      title: 'Floor 3',
      subtitle: (rooms: number, lit: number) => `${rooms} rooms · ${lit} lit`,
      more: 'Floor options',
      rooms: 'Meeting rooms and spaces',
      litCount: (n: number) => `${n} ${n === 1 ? 'room' : 'rooms'} lit`,
      lightsIn: (room: string) => `Lights in ${room}`,
      lamps: (on: boolean, n: number) => (on ? `${n} on` : 'Off'),
      allOff: 'All lights off',
      thermostat: 'Climate',
      showRoom: (room: string) => `Show ${room} in the climate panel`,
      hold: (time: string) => `Hold until ${time}`,
      energy: 'Climate today',
    },
    onChange: fn(),
  },
}

/** A greenhouse in °F: zones instead of rooms, grow lights, a day plan around the sun and a tighter range. */
export const Greenhouse: Story = {
  args: {
    unit: 'fahrenheit',
    range: { min: 55, max: 90, step: 1 },
    defaultMode: 'auto',
    rooms: [
      { id: 'seedlings', name: 'Seedlings', temperature: 68, target: 72, humidity: 70, lights: true, lamps: 6 },
      { id: 'tomatoes', name: 'Tomatoes', temperature: 77, target: 76, humidity: 62, lights: true, lamps: 4 },
      { id: 'herbs', name: 'Herbs', temperature: 71, target: 70, humidity: 55, lights: false, lamps: 3 },
      { id: 'orchids', name: 'Orchids', temperature: 66, target: 68, humidity: 75, lights: false, lamps: 2 },
    ],
    schedule: [
      { id: 'sunrise', name: 'Sunrise', at: '05:30', target: 68 },
      { id: 'midday', name: 'Midday', at: '11:00', target: 76 },
      { id: 'dusk', name: 'Dusk', at: '18:30', target: 70 },
      { id: 'night', name: 'Night', at: '21:00', target: 62 },
    ],
    nowSlot: 'midday',
    energy: { used: 14.2, budget: 22 },
    copy: {
      locale: 'en-US',
      title: 'Greenhouse',
      subtitle: (zones: number, lit: number) => `${zones} zones · ${lit} grow ${lit === 1 ? 'light' : 'lights'} on`,
      more: 'Greenhouse options',
      rooms: 'Zones',
      litCount: (n: number) => `${n} grow ${n === 1 ? 'light' : 'lights'} on`,
      lights: 'Grow lights',
      lightsIn: (zone: string) => `Grow lights in ${zone}`,
      allOff: 'All grow lights off',
      thermostat: 'Climate',
      showRoom: (zone: string) => `Show ${zone} in the climate panel`,
      schedule: 'Day plan',
    },
  },
}

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** Skeletons in the rooms, the readings and the dial. */
export const Loading: Story = { args: { loading: true } }

/** No rooms yet. */
export const Empty: Story = { args: { rooms: [] } }

/** The rooms failed to load: the message and Retry take the tiles' place. */
export const Error: Story = { args: { error: 'Couldn’t reach the hub.', onRetry: fn() } }
