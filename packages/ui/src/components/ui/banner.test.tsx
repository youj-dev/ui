import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Banner, BannerAction, BannerTitle, type BannerProps } from './banner'

function Usage(props: Partial<BannerProps>) {
  return (
    <>
      <Banner dismissible {...props}>
        <BannerTitle>
          <strong>Youj 1.0</strong> is out.
        </BannerTitle>
        <BannerAction href="#notes">Read the notes</BannerAction>
      </Banner>
      <button type="button">Sign in</button>
    </>
  )
}

describe('Banner', () => {
  test('is a named region with its message and action', () => {
    render(<Usage variant="accent" />)
    const region = screen.getByRole('region', { name: 'Announcement' })
    expect(region).toHaveAttribute('data-variant', 'accent')
    expect(region).toHaveTextContent('Youj 1.0 is out.')
    expect(screen.getByRole('link', { name: 'Read the notes' })).toHaveAttribute('href', '#notes')
  })

  test('takes its own name', () => {
    render(<Banner aria-label="Maintenance">Down for ten minutes at 02:00 UTC.</Banner>)
    expect(screen.getByRole('region', { name: 'Maintenance' })).toBeInTheDocument()
  })

  test('not dismissible unless asked; onOpenChange implies it', () => {
    const { rerender } = render(<Banner>Plain.</Banner>)
    expect(screen.queryByRole('button', { name: 'Dismiss announcement' })).not.toBeInTheDocument()
    rerender(<Banner onOpenChange={() => {}}>Plain.</Banner>)
    expect(screen.getByRole('button', { name: 'Dismiss announcement' })).toBeInTheDocument()
  })

  test('dismissing from the keyboard reports it, hands focus on, and removes the bar', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Usage onOpenChange={onOpenChange} />)
    await user.tab()
    expect(screen.getByRole('link', { name: 'Read the notes' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Dismiss announcement' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('button', { name: 'Sign in' })).toHaveFocus()
    await waitFor(() => expect(screen.queryByRole('region')).not.toBeInTheDocument())
  })

  test('controlled: open={false} hides it, open again brings it back', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <Banner open={open} onOpenChange={setOpen}>
            Scheduled maintenance tonight.
          </Banner>
          <button type="button" onClick={() => setOpen(true)}>
            Show again
          </button>
        </>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole('button', { name: 'Dismiss announcement' }))
    await waitFor(() => expect(screen.queryByRole('region')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Show again' }))
    expect(await screen.findByRole('region')).toHaveTextContent('Scheduled maintenance tonight.')
  })

  test('defaultOpen={false} starts hidden', () => {
    render(<Banner defaultOpen={false}>Hidden.</Banner>)
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  test('under reduced motion a dismissed banner leaves at once', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Usage />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Dismiss announcement' }))
    // At this Speed any animation would take seconds: settling inside waitFor's timeout proves it was instant.
    await waitFor(() => expect(screen.queryByRole('region')).not.toBeInTheDocument())
  })

  test('unmounts cleanly mid-collapse', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Usage />)
    await user.click(screen.getByRole('button', { name: 'Dismiss announcement' }))
    unmount()
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })
})
