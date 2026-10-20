import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DemoSite } from '../../docs/demo-site'
import { MarketingNavbar } from './navbar'

const meta: Meta<typeof MarketingNavbar> = {
  title: 'Blocks/Marketing/Navbar',
  component: MarketingNavbar,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Help visitors find their way with mega menus that morph from panel to panel and preview each destination, media cards, search, an announcement bar, signed-in and signed-out states, and a drawer with folding sections on phones.',
      },
    },
  },
  render: (args) => <DemoSite>{(scroller) => <MarketingNavbar {...args} scrollContainer={scroller} />}</DemoSite>,
}
export default meta
type Story = StoryObj<typeof MarketingNavbar>

export const Default: Story = {
  args: { current: '#pricing' },
}

/** Product open, on the Analytics page: point at another link and the preview rises in from the way you moved; move to Resources and the panel morphs to its media cards. */
export const MenuOpen: Story = {
  args: { defaultMenu: 'Product', current: '#analytics', announcement: null, onMenuChange: fn() },
}

/** Signed in: a Dashboard button and the account menu take the place of Sign in and Start free. */
export const SignedIn: Story = {
  args: { user: { name: 'Ada Lovelace', email: 'ada@analytical.dev' }, onSignOut: fn(), announcement: null },
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    current: '/menu',
    brand: { name: 'Fernhill', href: '/' },
    links: [
      {
        label: 'Coffee',
        groups: [
          {
            title: 'Shop',
            links: [
              { label: 'Single origin', href: '/beans/single-origin', description: 'One farm, one lot, roasted weekly.' },
              { label: 'Blends', href: '/beans/blends', description: 'Built for espresso and milk.' },
            ],
          },
          { title: 'Brew', links: [{ label: 'Guides', href: '/guides', description: 'Pour-over, AeroPress and more.' }] },
        ],
        cards: [{ href: '/journal/harvest', eyebrow: 'Journal', title: 'The 2026 harvest, cup by cup', meta: '5 min read' }],
      },
      { label: 'Menu', href: '/menu' },
      { label: 'Cafés', href: '/cafes' },
    ],
    announcement: { label: 'Autumn roast is in.', href: '/beans/autumn', cta: 'Shop it' },
    onDismissAnnouncement: fn(),
    searchItems: [{ id: 'visit', label: 'Visit a café', href: '/cafes', keywords: ['hours', 'map'] }],
    onSearchSelect: fn(),
    primaryCta: { label: 'Subscribe', href: '/subscribe', onClick: fn() },
    secondaryCta: null,
    copy: { navLabel: 'Site' },
  },
}
