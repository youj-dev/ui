import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DemoSite } from '../../docs/demo-site'
import { NavbarFullscreen } from './navbar-fullscreen'

const meta: Meta<typeof NavbarFullscreen> = {
  title: 'Blocks/Marketing/Navbar Fullscreen',
  component: NavbarFullscreen,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'A slim bar whose Menu opens the whole screen: large entries that rise into place, levels that drill in and back with focus kept in step, a picture that follows the entry you point at, and the small print at the foot.',
      },
    },
  },
  render: (args) => <DemoSite>{(scroller) => <NavbarFullscreen {...args} scrollContainer={scroller} />}</DemoSite>,
}
export default meta
type Story = StoryObj<typeof NavbarFullscreen>

export const Default: Story = {}

/** Open, on the current page: Studio carries a dot because the page shown is inside it. Point at an entry to change the picture; Studio drills in. */
export const Open: Story = {
  args: { defaultOpen: true, current: '#studio/careers', onOpenChange: fn() },
}

/** Your own sitemap, without pictures: the list takes the full width. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    defaultOpen: true,
    brand: { name: 'Fernhill', href: '/' },
    items: [
      { label: 'Coffee', items: [{ label: 'Single origin', href: '/coffee/single-origin' }, { label: 'Blends', href: '/coffee/blends' }, { label: 'Decaf', href: '/coffee/decaf' }] },
      { label: 'Cafés', href: '/cafes' },
      { label: 'Wholesale', href: '/wholesale', badge: 'New' },
      { label: 'Journal', href: '/journal' },
    ],
    cta: { label: 'Subscribe', href: '/subscribe', onClick: fn() },
    footerLinks: [{ label: 'Shipping', href: '/shipping' }],
    socials: [],
    contact: { label: 'Visit us', href: '/cafes' },
    current: '/cafes',
    copy: { menu: 'Menü', close: 'Schließen', back: 'Zurück' },
  },
}
