import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { illustrations } from '@youj/illustrations'
import { wait } from './shell'
import { Login } from './login'

const meta: Meta<typeof Login> = {
  title: 'Blocks/Auth/Login',
  component: Login,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', illustration: true, partOf: 'app-auth-flow' },
    docs: {
      description: {
        component:
          'Welcome returning users with a sign-in page offering social login or email and password.',
      },
    },
  },
  argTypes: { illustration: { control: 'select', options: illustrations.map((i) => i.id) } },
}
export default meta
type Story = StoryObj<typeof Login>

export const Card: Story = {}

export const Split: Story = { args: { layout: 'split' } }

/** The server says no: try any email and password. */
export const WrongPassword: Story = {
  args: {
    onSignIn: async () => {
      await wait(900)
      throw new Error('That email and password don’t match. Check them, or reset your password.')
    },
  },
}

/** Another product's sign-in: its own brand, words and links, one provider, and callbacks you can watch in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fernleaf Health', href: '/' },
    copy: {
      signInTitle: 'Sign in to your care portal',
      signInDescription: 'Appointments, results and messages with your care team.',
      newHere: 'First visit?',
      createAccountLink: 'Register as a patient',
    },
    links: { signUp: '/register', forgot: '/reset', terms: '/legal/terms', privacy: '/legal/privacy' },
    providers: [{ id: 'apple', label: 'Continue with Apple' }],
    defaultValues: { email: 'sam.okafor@fernleaf.health' },
    onSignIn: fn(async () => wait(900)),
    onProvider: fn(),
  },
}
