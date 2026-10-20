import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MarketingFooter } from './footer'

const meta: Meta<typeof MarketingFooter> = {
  title: 'Blocks/Marketing/Footer',
  component: MarketingFooter,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          "Round off your site with a sitemap: grouped links with tags, a newsletter sign-up, trust badges, legal links, a language switch and a live status pill.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MarketingFooter>

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-dvh flex-col justify-end bg-canvas">
      <MarketingFooter {...args} />
    </div>
  ),
}

/** A degraded service, with the cookie button and a German site. */
export const DegradedGerman: Story = {
  args: { statusState: 'degraded', defaultLanguage: 'de', onCookieSettings: fn(), onLanguageChange: fn() },
  render: (args) => (
    <div className="flex min-h-dvh flex-col justify-end bg-canvas">
      <MarketingFooter {...args} />
    </div>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fernhill Coffee', href: '/', tagline: 'Roasted to order in Leeds.' },
    columns: [
      { title: 'Shop', links: [{ label: 'Beans', href: '/beans' }, { label: 'Gear', href: '/gear' }, { label: 'Gift cards', href: '/gifts' }] },
      { title: 'Visit', links: [{ label: 'Cafés', href: '/cafes' }, { label: 'Roastery tours', href: '/tours' }] },
      { title: 'Help', links: [{ label: 'Shipping', href: '/shipping' }, { label: 'Returns', href: '/returns' }, { label: 'Contact', href: '/contact' }] },
    ],
    social: [],
    languages: [],
    badges: [],
    legalLinks: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }],
    copy: {
      subscribeLabel: 'New roasts, first',
      subscribeHint: 'One email when a new lot lands.',
      placeholder: 'you@example.com',
      legal: '© 2026 Fernhill Coffee Roasters',
      status: '',
    },
    onSubscribe: fn(),
  },
  render: (args) => (
    <div className="flex min-h-dvh flex-col justify-end bg-canvas">
      <MarketingFooter {...args} />
    </div>
  ),
}
