import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { wait } from './shell'
import { TwoFactor } from './two-factor'

const meta: Meta<typeof TwoFactor> = {
  title: 'Blocks/Auth/Two-factor',
  component: TwoFactor,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', partOf: 'app-auth-flow' },
    docs: {
      description: {
        component:
          'Guide your users through a verification code with clear feedback when it succeeds or needs another try.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TwoFactor>

export const Card: Story = {}

export const Split: Story = { args: { layout: 'split' } }

/** Another product's brand, words and destination, and the checks in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fernleaf Health', href: '/' },
    destination: '•••• 0917',
    copy: { twoFactorTitle: 'Confirm it’s you' },
    links: { signIn: '/sign-in' },
    onVerify: fn(async () => wait(700)),
    onResend: fn(),
  },
}
