import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { wait } from './shell'
import { Signup } from './signup'

const meta: Meta<typeof Signup> = {
  title: 'Blocks/Auth/Signup',
  component: Signup,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', partOf: 'app-auth-flow' },
    docs: {
      description: {
        component:
          "Give new users a sign-up page with social login or a name, email and password form.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Signup>

export const Card: Story = {}

export const Split: Story = { args: { layout: 'split' } }

export const EmailTaken: Story = {
  args: {
    onSignUp: async () => {
      await wait(900)
      throw new Error('An account with that email already exists. Sign in instead, or reset your password.')
    },
  },
}

/** Another product's sign-up: its own brand and words, no providers, and the submit in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fernleaf Health', href: '/' },
    copy: {
      signUpTitle: 'Register as a patient',
      signUpDescription: 'It takes two minutes. Your records stay private.',
      workEmail: 'Email',
      terms: 'I agree to the patient terms and the privacy notice',
    },
    links: { signIn: '/sign-in' },
    providers: [],
    onSignUp: fn(async () => wait(900)),
  },
}
