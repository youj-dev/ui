import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { wait } from './shell'
import { ForgotPassword } from './forgot-password'

const meta: Meta<typeof ForgotPassword> = {
  title: 'Blocks/Auth/Forgot password',
  component: ForgotPassword,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', partOf: 'app-auth-flow' },
    docs: {
      description: {
        component:
          "Help your users get back into their account with a form for requesting a password reset link.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ForgotPassword>

export const Card: Story = {}

export const Split: Story = { args: { layout: 'split' } }

/** Another product's brand, words and links, and the send in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fernleaf Health', href: '/' },
    copy: { forgotTitle: 'Forgot your portal password?', forgotDescription: 'We’ll email a link to set a new one.' },
    links: { signIn: '/sign-in' },
    onSend: fn(async () => wait(900)),
  },
}
