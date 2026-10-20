'use client'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  InputOTP,
  InputOTPResend,
  useOTPVerification,
} from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function InputOTPDemo() {
  // Runs when the last slot fills: verifying, then success or a shake and a cleared code.
  const otp = useOTPVerification(async (code) => {
    await wait(900)
    return code === '424242'
  })

  return (
    <Card className="w-full max-w-[440px] min-w-0">
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>Enter your 6-digit code.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field invalid={otp.status === 'error'}>
          <FieldLabel>Authentication code</FieldLabel>
          <InputOTP groups={[3, 3]} {...otp.field} />
          <FieldError>{otp.status === 'error' ? 'That code didn’t match. Try again.' : undefined}</FieldError>
          <FieldDescription>
            Try <span className="font-mono text-fg">424242</span>. Anything else fails.
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
