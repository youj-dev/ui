export type DeviceControlsMode = 'heat' | 'cool' | 'auto' | 'off'
export const MODES: DeviceControlsMode[] = ['heat', 'cool', 'auto', 'off']

/** One room, office floor or greenhouse zone: what it reads, what it is set to and its lights. */
export interface DeviceControlsRoom {
  id: string
  name: string
  /** Measured, in the card's `unit` (°C by default). */
  temperature: number
  /** The room's setpoint, in the card's `unit`. */
  target: number
  /** Relative humidity, %. */
  humidity: number
  lights: boolean
  /** How many lights the room has. */
  lamps: number
}

/** A step of the day's schedule. */
export interface DeviceControlsSlot {
  id: string
  name: string
  /** "06:30". */
  at: string
  /** The setpoint it sets, in the card's `unit`. */
  target: number
}

export type DeviceControlsUnit = 'celsius' | 'fahrenheit'

export const ROOMS: DeviceControlsRoom[] = [
  { id: 'living', name: 'Living room', temperature: 20.4, target: 21.5, humidity: 46, lights: true, lamps: 4 },
  { id: 'kitchen', name: 'Kitchen', temperature: 21.1, target: 21, humidity: 44, lights: true, lamps: 3 },
  { id: 'bedroom', name: 'Bedroom', temperature: 18.9, target: 19, humidity: 52, lights: false, lamps: 2 },
  { id: 'office', name: 'Office', temperature: 19.6, target: 20.5, humidity: 41, lights: false, lamps: 2 },
]

export const SCHEDULE: DeviceControlsSlot[] = [
  { id: 'morning', name: 'Morning', at: '06:30', target: 21 },
  { id: 'away', name: 'Away', at: '09:00', target: 17 },
  { id: 'evening', name: 'Evening', at: '17:30', target: 21.5 },
  { id: 'night', name: 'Night', at: '22:30', target: 18 },
]
/** The slot running at the demo's time (17:52). */
export const NOW_SLOT = 'evening'

/** The dial's span and step, in the card's `unit`. */
export interface DeviceControlsRange {
  min: number
  max: number
  step: number
}
export const RANGE: DeviceControlsRange = { min: 12, max: 28, step: 0.5 }
/** Heating energy so far today against the day's budget, kWh. */
export const ENERGY = { used: 3.4, budget: 6 }
export type DeviceControlsEnergy = typeof ENERGY

export const DEFAULT_COPY = {
  locale: 'en-GB',
  title: 'Home',
  subtitle: (rooms: number, lit: number) => `${rooms} rooms · ${lit} ${lit === 1 ? 'light' : 'lights'} on`,
  more: 'Home options',
  litCount: (n: number) => `${n} ${n === 1 ? 'light' : 'lights'} on`,
  thermostat: 'Thermostat',
  mode: 'Mode',
  modes: { heat: 'Heat', cool: 'Cool', auto: 'Auto', off: 'Off' } as Record<DeviceControlsMode, string>,
  captions: { heat: 'Heating to', cool: 'Cooling to', auto: 'Holding at', off: 'Off' } as Record<DeviceControlsMode, string>,
  target: (room: string) => `${room} target temperature`,
  heating: (minutes: number) => `Heating · about ${minutes} min to go`,
  cooling: (minutes: number) => `Cooling · about ${minutes} min to go`,
  holding: 'Holding steady',
  idle: 'Heating and cooling are off',
  schedule: 'Schedule',
  now: 'Now',
  hold: (time: string) => `Hold until ${time}`,
  held: 'Held',
  resume: 'Resume schedule',
  rooms: 'Rooms',
  temperature: 'Temp',
  humidity: 'Humidity',
  lights: 'Lights',
  lightsIn: (room: string) => `Lights in ${room}`,
  lamps: (on: boolean, n: number) => (on ? `${n} on` : 'Off'),
  showRoom: (room: string) => `Show ${room} on the thermostat`,
  allOff: 'All lights off',
  energy: 'Heating today',
  energyValue: (kwh: string, budget: string) => `${kwh} of ${budget} kWh`,
  loadingLabel: 'Loading the rooms',
  emptyTitle: 'No rooms yet',
  emptyDescription: 'Add a room and its readings show up here.',
  retry: 'Retry',
}

export type DeviceControlsCopy = typeof DEFAULT_COPY
