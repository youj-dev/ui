import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { illustrations } from '@youj/illustrations'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '../../components/ui/dialog'
import { AuthFlow, type AuthFlowProps } from './auth-flow'
import { AUTH_VIEWS, wait } from './auth-flow/data'

const meta: Meta<typeof AuthFlow> = {
  title: 'Blocks/App/Auth Flow',
  component: AuthFlow,
  parameters: {
    layout: 'fullscreen',
    // The way into a product is a page of its website, though it's filed with the app's blocks: a white page.
    showcase: { kind: 'screen', illustration: true, page: 'white' },
    docs: {
      description: {
        component:
          'Run the whole way in as one flow: sign in or create an account, reset a forgotten password, confirm a second step or send a sign-in link, with each step sliding in as the card resizes. Use it full page or as a card in a dialog, and let it own its steps or drive them from your router.',
      },
    },
  },
  argTypes: {
    illustration: { control: 'select', options: illustrations.map((i) => i.id) },
    view: { control: 'select', options: [undefined, ...AUTH_VIEWS] },
  },
}
export default meta
type Story = StoryObj<typeof AuthFlow>

/** Try it all: "Forgot password?", "Create an account", "Email me a sign-in link", or sign in with any details to reach the second step (any code but 000000 works). */
export const Page: Story = {}

export const CreateAccount: Story = { args: { defaultView: 'sign-up' } }

export const ForgotPassword: Story = { args: { defaultView: 'forgot' } }

export const CheckYourEmail: Story = { args: { defaultView: 'forgot-sent', email: 'ada@northwind.dev' } }

/** Where the reset link in the email lands: `view="reset"` on your auth route. */
export const ResetPassword: Story = { args: { defaultView: 'reset', email: 'ada@northwind.dev' } }

export const TwoStepVerification: Story = { args: { defaultView: 'two-factor' } }

export const MagicLinkSent: Story = { args: { defaultView: 'magic-link-sent', email: 'ada@northwind.dev' } }

export const SignedIn: Story = { args: { defaultView: 'signed-in' } }

/** The server says no: try any email and password. */
export const WrongPassword: Story = {
  args: {
    onSignIn: async () => {
      await wait(900)
      throw new Error('That email and password don’t match. Check them, or reset your password.')
    },
  },
}

/** The same flow as a card, for a page of your own. */
export const Card: Story = {
  args: { mode: 'card' },
  render: (args) => (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <AuthFlow {...args} />
    </div>
  ),
}

/** Sign in without leaving the page: the dialog is the card, and it closes itself once you're in. */
export const InADialog: Story = {
  name: 'In a dialog',
  args: { mode: 'card' },
  render: (args) => <SignInDialog {...args} />,
}

function SignInDialog(args: AuthFlowProps) {
  const [open, setOpen] = useState(true)
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="lg" />}>Sign in</DialogTrigger>
        <DialogContent className="max-w-sm" aria-label="Sign in to Northwind">
          <AuthFlow
            {...args}
            onViewChange={(view) => {
              args.onViewChange?.(view)
              if (view === 'signed-in') setTimeout(() => setOpen(false), 1600)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
