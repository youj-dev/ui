import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Alert, AlertAction, AlertDescription, AlertTitle, type AlertProps } from './alert'

function Usage(props: Partial<AlertProps>) {
  return (
    <>
      <Alert variant="warning" dismissible {...props}>
        <AlertTitle>82% of bandwidth used</AlertTitle>
        <AlertDescription>Upgrade to avoid overage.</AlertDescription>
        <AlertAction>
          <button type="button">Upgrade</button>
        </AlertAction>
      </Alert>
      <button type="button">Plan details</button>
    </>
  )
}

describe('Alert', () => {
  test('warning and destructive interrupt; info and success are polite', () => {
    render(
      <>
        <Alert variant="info">Maintenance on Friday.</Alert>
        <Alert variant="success">Domain verified.</Alert>
        <Alert variant="warning">Token expires soon.</Alert>
        <Alert variant="danger">Payment failed.</Alert>
      </>,
    )
    expect(screen.getAllByRole('status').map((el) => el.textContent)).toEqual(['Maintenance on Friday.', 'Domain verified.'])
    expect(screen.getAllByRole('alert').map((el) => el.textContent)).toEqual(['Token expires soon.', 'Payment failed.'])
  })

  test('an explicit role wins', () => {
    render(
      <Alert variant="danger" role="status">
        Quietly broken.
      </Alert>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Quietly broken.')
  })

  test('each variant brings a decorative youj icon that plays on mount; icon={false} drops it', () => {
    const { unmount } = render(<Alert variant="success">Done.</Alert>)
    const icon = document.querySelector('[data-slot=alert-icon]')!
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon.querySelector('[data-icon=check-circle]')).toHaveAttribute('data-state', 'active')
    unmount()
    render(<Alert icon={false}>No icon.</Alert>)
    expect(document.querySelector('[data-slot=alert-icon]')).toBeNull()
  })

  test('dismissing collapses the alert away and hands focus to the next control', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Usage onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole('button', { name: 'Upgrade' }))
    await user.tab()
    const dismiss = screen.getByRole('button', { name: 'Dismiss' })
    expect(dismiss).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('button', { name: 'Plan details' })).toHaveFocus()
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  test('controlled: open={false} hides it, open again brings it back', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <Alert variant="info" open={open} onOpenChange={setOpen}>
            Heads up.
          </Alert>
          <button type="button" onClick={() => setOpen(true)}>
            Show again
          </button>
        </>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Show again' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Heads up.')
  })

  test('not dismissible unless asked', () => {
    render(<Alert>Plain.</Alert>)
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument()
  })

  test('under reduced motion a dismissed alert leaves at once and the icon rests', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Usage />
      </YoujProvider>,
    )
    expect(document.querySelector('[data-icon=alert-triangle]')).toHaveAttribute('data-state', 'rest')
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    // At this Speed any animation would take seconds: settling inside waitFor's timeout proves it was instant, without racing a busy runner.
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })
})
