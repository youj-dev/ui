import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  BugIcon,
  CloudIcon,
  CodeIcon,
  CreditCardIcon,
  GaugeIcon,
  GiftIcon,
  GitPullRequestIcon,
  PackageIcon,
  PlugIcon,
  ScanFaceIcon,
  ShieldAlertIcon,
  ShoppingCartIcon,
  StoreIcon,
  TrendingDownIcon,
  type YoujIconComponent,
} from './index'
import { autoplayParameters, morphMeta, morphParameters, MorphsView, type MorphArgs } from './story-kit'

/* Grouped the way they appear in product: commerce, then development, then security and data. */
const GROUPS: { title: string; icons: YoujIconComponent[] }[] = [
  { title: 'Commerce', icons: [ShoppingCartIcon, CreditCardIcon, GiftIcon, PackageIcon, StoreIcon] },
  { title: 'Development', icons: [GitPullRequestIcon, BugIcon, CodeIcon, CloudIcon, PlugIcon] },
  { title: 'Security & data', icons: [ShieldAlertIcon, ScanFaceIcon, GaugeIcon, TrendingDownIcon] },
]
const ALL = GROUPS.flatMap((g) => g.icons)

const meta = {
  ...morphMeta,
  title: 'Icons/Morphs/Commerce, dev & security',
  parameters: morphParameters(
    `The ${ALL.length} state icons from the commerce, development, security and data batch. Each takes a controlled \`active\` and morphs between its two states, with paths that share one structure so they interpolate point for point (stripe → check, tape → check, ! → check, smile → check, < > → { }, falling ↔ rising), masked mechanics (prongs sliding out of a socket, a slash cut through a bug) and sequenced transforms (a lid popping off, a shutter coming down). State keyframes start from the current value, so toggling mid-morph reverses from wherever the icon is. Under reduced motion the state switches instantly.`,
  ),
} satisfies Meta<MorphArgs>

export default meta
type Story = StoryObj<MorphArgs>

const render: Story['render'] = ({ auto }) => (
  <MorphsView
    auto={auto}
    groups={GROUPS}
    iconSize={48}
    strokeWidth={1.5}
    minCol={160}
    heading="Commerce, dev &amp; security"
    intro="Every one of these is a real state in product: paid, delivered, merged, synced, resolved, verified. Click a card to toggle it, and click again mid-morph to watch it reverse."
  />
)

export const Morphs: Story = { render }

export const Autoplay: Story = {
  args: { auto: true },
  parameters: autoplayParameters,
  render,
}
