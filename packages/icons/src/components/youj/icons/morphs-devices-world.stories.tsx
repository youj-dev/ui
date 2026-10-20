import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  BluetoothIcon,
  CastIcon,
  CloudSunIcon,
  CrosshairIcon,
  FlagIcon,
  LightbulbIcon,
  MapPinIcon,
  NavigationIcon,
  PinIcon,
  ResponsiveIcon,
  RocketIcon,
  SmartphoneIcon,
  TabletIcon,
  ThermometerIcon,
  TrophyIcon,
  type YoujIconComponent,
} from './index'
import { autoplayParameters, morphMeta, morphParameters, MorphsView, type MorphArgs } from './story-kit'

const GROUPS: { title: string; note: string; icons: YoujIconComponent[] }[] = [
  { title: 'Devices', note: 'Modes a device can be in', icons: [SmartphoneIcon, TabletIcon, ResponsiveIcon, BluetoothIcon, CastIcon] },
  { title: 'Location', note: 'Where you are, and whether you got there', icons: [MapPinIcon, NavigationIcon, CrosshairIcon] },
  { title: 'Weather', note: 'Conditions that change', icons: [CloudSunIcon, ThermometerIcon] },
  { title: 'System', note: 'Things you switch, mark and earn', icons: [RocketIcon, FlagIcon, PinIcon, TrophyIcon, LightbulbIcon] },
]
const ALL = GROUPS.flatMap((g) => g.icons)

const meta = {
  ...morphMeta,
  title: 'Icons/Morphs/Devices, location & weather',
  parameters: morphParameters(
    `The ${ALL.length} state icons from the devices, location, weather and system batch. Each takes a controlled \`active\` and moves between its two states with a real path morph or a choreographed transformation: the monitor draws itself into a phone, the arrow swells into a pin, the cloud swells over the sun and starts to rain. Every morph reverses from wherever it is, so toggling mid-way never jumps. Under reduced motion the state switches instantly. Use the toolbar's ¼× speed to study them.`,
  ),
} satisfies Meta<MorphArgs>

export default meta
type Story = StoryObj<MorphArgs>

const render: Story['render'] = ({ auto }) => (
  <MorphsView
    auto={auto}
    groups={GROUPS}
    heading="Devices, places and weather, in two states"
    intro="Click a card to toggle it. Click again mid-morph and it reverses from where it is."
  />
)

export const Morphs: Story = { render }

export const Autoplay: Story = {
  args: { auto: true },
  parameters: autoplayParameters,
  render,
}
