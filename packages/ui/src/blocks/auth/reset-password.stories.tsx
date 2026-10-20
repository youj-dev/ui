import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { wait } from './shell'
import { ResetPassword } from './reset-password'

const meta: Meta<typeof ResetPassword> = {
  title: 'Blocks/Auth/Reset password',
  component: ResetPassword,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', partOf: 'app-auth-flow' },
    docs: {
      description: {
        component:
          'Help your users choose a new password with clear rules, a strength indicator and confirmation.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ResetPassword>

export const Card: Story = {}

export const Split: Story = { args: { layout: 'split' } }

export const ExpiredLink: Story = {
  args: {
    onReset: async () => {
      await wait(900)
      throw new Error('This reset link has expired. Ask for a new one from the sign-in page.')
    },
  },
}

/** Another product's account, brand and words, and the save in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fernleaf Health', href: '/' },
    email: 'sam.okafor@fernleaf.health',
    copy: { resetTitle: 'Set a new portal password' },
    links: { signIn: '/sign-in' },
    onReset: fn(async () => wait(900)),
  },
}
