import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core'
import { Field, FieldLabel } from './field'
import { InputOTP, InputOTPResend, useOTPVerification } from './input-otp'

function Labelled(props: Parameters<typeof InputOTP>[0]) {
  return (
    <Field>
      <FieldLabel>Verification code</FieldLabel>
      <InputOTP {...props} />
    </Field>
  )
}

describe('InputOTP', () => {
  test('is one labelled field for assistive tech, with the slots hidden', () => {
    const { container } = render(<Labelled />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(1)
    expect(inputs[0]).toHaveAccessibleName('Verification code')
    expect(inputs[0]).toHaveAttribute('autocomplete', 'one-time-code')
    expect(inputs[0]).toHaveAttribute('inputmode', 'numeric')
    expect(container.querySelectorAll('[data-slot=input-otp-slot]')).toHaveLength(6)
    expect(container.querySelector('[data-slot=input-otp-slot]')!.closest('[aria-hidden]')).not.toBeNull()
  })

  test('typing fills the slots, drops what the mode rejects, and completes once', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const { container } = render(<Labelled length={4} onComplete={onComplete} />)
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('1a2-3 4')
    expect(input).toHaveValue('1234')
    const slots = container.querySelectorAll('[data-slot=input-otp-slot]')
    expect([...slots].map((s) => s.textContent)).toEqual(['1', '2', '3', '4'])
    expect(onComplete).toHaveBeenCalledExactlyOnceWith('1234')
    await user.keyboard('5')
    expect(input).toHaveValue('1235')
    expect(onComplete).toHaveBeenCalledOnce()
  })

  test('pasting a formatted code fills every slot', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Labelled onValueChange={onValueChange} />)
    await user.click(screen.getByRole('textbox'))
    await user.paste('424 - 242')
    expect(screen.getByRole('textbox')).toHaveValue('424242')
    expect(onValueChange).toHaveBeenLastCalledWith('424242')
  })

  test('alphanumeric codes are upper-cased', async () => {
    const user = userEvent.setup()
    render(<Labelled mode="alphanumeric" length={4} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('inputmode', 'text')
    await user.click(input)
    await user.keyboard('a7c9')
    expect(input).toHaveValue('A7C9')
  })

  test('arrow keys move between slots, selecting the character to replace', async () => {
    const user = userEvent.setup()
    render(<Labelled defaultValue="1234" />)
    const input = screen.getByRole<HTMLInputElement>('textbox')
    await user.click(input)
    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 3])
    await user.keyboard('9')
    expect(input).toHaveValue('1294')
    await user.keyboard('{Home}')
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 1])
  })

  test('autoSubmit submits the owning form with the code', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault())
    render(
      <form onSubmit={(e) => onSubmit(e.nativeEvent as SubmitEvent)}>
        <Labelled length={4} name="code" autoSubmit />
      </form>,
    )
    await user.click(screen.getByRole('textbox'))
    await user.keyboard('4242')
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  test('disabled blocks input', async () => {
    const user = userEvent.setup()
    render(<Labelled disabled />)
    await user.type(screen.getByRole('textbox'), '12')
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  test('marks itself for reduced motion', () => {
    const { container } = render(
      <YoujProvider reducedMotion="always">
        <InputOTP aria-label="Code" />
      </YoujProvider>,
    )
    expect(container.querySelector('[data-slot=input-otp]')).toHaveAttribute('data-reduced-motion')
  })
})

function Verified({ verify }: { verify: (code: string) => unknown }) {
  const otp = useOTPVerification(verify)
  return (
    <>
      <InputOTP aria-label="Code" length={4} {...otp.field} />
      <output data-testid="status">{otp.status}</output>
    </>
  )
}

describe('useOTPVerification', () => {
  test('verifies on completion and locks the field on success', async () => {
    const user = userEvent.setup()
    const verify = vi.fn(async () => true)
    render(<Verified verify={verify} />)
    await user.click(screen.getByRole('textbox'))
    await user.keyboard('1234')
    expect(verify).toHaveBeenCalledWith('1234')
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('success'))
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
    expect(await screen.findByText('Code verified')).toBeInTheDocument()
  })

  test('a failed code is invalid, announced assertively, then cleared for another try', async () => {
    const user = userEvent.setup()
    render(<Verified verify={async () => false} />)
    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('9999')
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
    expect(screen.getByRole('alert')).toHaveTextContent('That code didn’t work')
    await waitFor(() => expect(input).toHaveValue(''))
  })

  test('a throwing verifier counts as an error', async () => {
    const user = userEvent.setup()
    render(
      <Verified
        verify={() => {
          throw new Error('network')
        }}
      />,
    )
    await user.click(screen.getByRole('textbox'))
    await user.keyboard('1111')
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'))
  })
})

describe('InputOTPResend', () => {
  afterEach(() => vi.useRealTimers())

  test('waits out the countdown, then resends and waits again', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onResend = vi.fn(async () => {})
    render(<InputOTPResend seconds={3} onResend={onResend} />)
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Resend in 0:03')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await act(async () => {
      vi.advanceTimersByTime(3500)
    })
    expect(button).toHaveTextContent('Resend code')
    await user.click(button)
    expect(onResend).toHaveBeenCalledOnce()
    await waitFor(() => expect(button).toHaveAttribute('aria-disabled', 'true'))
  })
})
