import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MagicLinkSent } from './magic-link-sent'

const meta: Meta<typeof MagicLinkSent> = {
  title: 'Blocks/Auth/Magic link sent',
  component: MagicLinkSent,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', partOf: 'app-auth-flow' },
    docs: {
      description: {
        component:
          "Show your users where to look next after they request a passwordless sign-in link.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MagicLinkSent>

export const Card: Story = {}

export const Split: Story = { args: { layout: 'split' } }

/** Another product's address, brand and words, and the resend in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fernleaf Health', href: '/' },
    email: 'sam.okafor@fernleaf.health',
    copy: { inboxTitle: 'Your sign-in link is on its way' },
    links: { signIn: '/sign-in' },
    onResend: fn(),
  },
}
