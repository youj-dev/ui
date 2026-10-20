import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DemoSite } from '../../docs/demo-site'
import { NavbarFloating } from './navbar-floating'

const meta: Meta<typeof NavbarFloating> = {
  title: 'Blocks/Marketing/Navbar Floating',
  component: NavbarFloating,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'A floating island of navigation that draws in around its links as the page scrolls under it, follows the section in view, steps aside while you read and grows into its own menu on phones.',
      },
    },
  },
  render: (args) => <DemoSite overlap>{(scroller) => <NavbarFloating {...args} scrollContainer={scroller} />}</DemoSite>,
}
export default meta
type Story = StoryObj<typeof NavbarFloating>

/** Scroll the page: the island draws in, its pill follows the section in view and its foot fills with your progress; scroll on and it steps aside. */
export const Default: Story = {}

/** Pages rather than sections: `current` marks the page your router is on, and the island keeps its place while you scroll. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Oriel', href: '/' },
    links: [
      { label: 'Shows', href: '/shows' },
      { label: 'Live', href: '/live', badge: 'On air' },
      { label: 'Archive', href: '/archive' },
      { label: 'About', href: '/about' },
    ],
    current: '/shows',
    hideOnScroll: false,
    progress: false,
    primaryCta: { label: 'Listen', href: '/listen', onClick: fn() },
    secondaryCta: null,
    copy: { navLabel: 'Site', openMenu: 'Menu', closeMenu: 'Close' },
  },
}
