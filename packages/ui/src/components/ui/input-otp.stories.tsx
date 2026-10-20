import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Specimen } from '../../stories/kit'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { InputOTP, InputOTPResend, useOTPVerification } from './input-otp'

const meta: Meta<typeof InputOTP> = {
  title: 'UI/Inputs/InputOTP',
  component: InputOTP,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A one-time code field for 2FA and email verification. It is one real input (`autocomplete="one-time-code"`, so SMS autofill and password managers work) laid over 4–8 slots that only draw it, so a screen reader meets one labeled field, not six. The caret is a single focus frame (motion’s SlidingIndicator) that glides between slots on the smooth spring; characters rise into their slot; pasting fills the whole code, ignoring spaces and dashes. `useOTPVerification(verify)` verifies on completion and drives `status`: verifying shows a spinner, success turns the slots green left to right and draws a check, error shakes 4/3/2px and clears for another try. `InputOTPResend` holds “Resend code” behind a countdown. Reduced motion: the frame jumps, no shake, the caret holds still.',
      },
    },
  },
  args: { length: 6 },
}
export default meta
type Story = StoryObj<typeof InputOTP>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function TwoFactor() {
  const otp = useOTPVerification(async (code) => {
    await wait(900)
    return code === '424242'
  })
  return (
    <Card className="w-full max-w-[400px]">
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field invalid={otp.status === 'error'}>
          <FieldLabel>Authentication code</FieldLabel>
          <InputOTP groups={[3, 3]} {...otp.field} />
          <FieldError>{otp.status === 'error' ? 'That code didn’t match. Try again.' : undefined}</FieldError>
          <FieldDescription>
            Try <span className="font-mono text-fg">424242</span>; anything else fails.
          </FieldDescription>
        </Field>
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="text-ui-sm text-fg-muted">Didn’t get it?</span>
          <InputOTPResend seconds={15} onResend={() => wait(700)} className="-me-2" />
        </div>
        {otp.status === 'success' && (
          <Button variant="outline" size="sm" className="self-start" onClick={otp.reset}>
            Start over
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/** Verify on completion: 424242 succeeds with a drawn check; anything else shakes and clears. */
export const Hero: Story = {
  render: () => <TwoFactor />,
}

export const Playground: Story = {
  render: (args) => (
    <Field className="w-fit max-w-full">
      <FieldLabel>Verification code</FieldLabel>
      <InputOTP {...args} />
    </Field>
  ),
}

/** 4 to 8 slots; grouping splits a long code into readable chunks. */
export const Lengths: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Specimen label="length 4">
        <InputOTP length={4} aria-label="PIN" defaultValue="12" />
      </Specimen>
      <Specimen label="length 6 · groups [3, 3]">
        <InputOTP groups={[3, 3]} aria-label="Code" defaultValue="4829" />
      </Specimen>
      <Specimen label="length 8 · groups [4, 4]">
        <InputOTP length={8} groups={[4, 4]} aria-label="Code" />
      </Specimen>
    </div>
  ),
}

/** Letters and digits, upper-cased, for recovery and invite codes. */
export const Alphanumeric: Story = {
  render: () => (
    <Field className="w-fit max-w-full">
      <FieldLabel>Recovery code</FieldLabel>
      <InputOTP mode="alphanumeric" length={8} groups={[4, 4]} defaultValue="A7C9" />
      <FieldDescription>From the backup codes you saved when you turned on 2FA.</FieldDescription>
    </Field>
  ),
}

/** Every status, held still. */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Specimen label="verifying">
        <InputOTP aria-label="Code" defaultValue="424242" status="verifying" />
      </Specimen>
      <Specimen label="success">
        <InputOTP aria-label="Code" defaultValue="424242" status="success" />
      </Specimen>
      <Specimen label="error">
        <InputOTP aria-label="Code" defaultValue="123456" status="error" />
      </Specimen>
      <Specimen label="disabled">
        <InputOTP aria-label="Code" defaultValue="42" disabled />
      </Specimen>
    </div>
  ),
}

function AutoSubmitForm() {
  const [submitted, setSubmitted] = useState<string | null>(null)
  return (
    <form
      className="flex w-fit flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(String(new FormData(event.currentTarget).get('code')))
      }}
    >
      <Field>
        <FieldLabel>Email code</FieldLabel>
        <InputOTP name="code" autoSubmit />
        <FieldDescription>The form submits itself as soon as the last digit lands.</FieldDescription>
      </Field>
      <p role="status" className="text-ui-sm text-fg-muted">
        {submitted ? `Submitted ${submitted}` : ''}
      </p>
    </form>
  )
}

/** `autoSubmit` submits the owning form once the code is complete. */
export const AutoSubmit: Story = {
  render: () => <AutoSubmitForm />,
}

/** Reduced motion: the frame jumps, characters appear, the caret holds still, no shake. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <TwoFactor />
    </YoujProvider>
  ),
}
