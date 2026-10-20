import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Waitlist } from './waitlist'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('waitlist block', () => {
  test('names the page, the countdown and the waiting list', () => {
    reduced(<Waitlist />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'See every frame before you shoot it.' })).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Time until launch' })).toHaveTextContent(/Days.*Hours.*Minutes.*Seconds/)
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /People waiting/ })).toBeInTheDocument()
  })

  test('a bad email is explained; a good one reveals your place, and sharing moves you up', async () => {
    const user = userEvent.setup()
    reduced(<Waitlist />)
    await user.click(screen.getByRole('button', { name: /Join the waitlist/ }))
    expect(await screen.findByText('Enter an email like you@studio.com.')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'mira@studio.com')
    await user.click(await screen.findByRole('button', { name: /Join the waitlist/ }, { timeout: 4000 }))
    const place = await screen.findByRole('region', { name: 'Your place in line' }, { timeout: 4000 })
    expect(place).toBeInTheDocument()
    expect(await screen.findByText('aperture.cam/r/mira', undefined, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getAllByText('1,284').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(screen.getAllByText('1,184').length).toBeGreaterThan(0)
  })

  test('brand, people, count and copy drive the page; onJoin gets the email and its place is shown', async () => {
    const user = userEvent.setup()
    const onJoin = vi.fn(async (email: string) => ({ position: 312, referralLink: `fieldnote.app/i/${email.split('@')[0]}` }))
    const onShare = vi.fn()
    reduced(
      <Waitlist
        brand={{ name: 'Fieldnote' }}
        cta={null}
        people={[{ id: 'r', name: 'Rosa Diaz' }]}
        waitingCount={1207}
        live={false}
        onJoin={onJoin}
        onShare={onShare}
        headingLevel={2}
        id="waitlist"
        copy={{ title: 'Lab notes that write themselves.', join: 'Request access', waiting: 'researchers are waiting', timerLabel: 'Until launch' }}
      />,
    )
    expect(screen.getByText('Fieldnote')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Lab notes that write themselves.' })).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Until launch' })).toBeInTheDocument()
    expect(screen.getByText('researchers are waiting')).toBeInTheDocument()
    expect(screen.getAllByText('1,207').length).toBeGreaterThan(0)
    expect(document.getElementById('waitlist')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'rosa@lab.org')
    await user.click(screen.getByRole('button', { name: /Request access/ }))
    expect(onJoin).toHaveBeenCalledWith('rosa@lab.org')
    expect(await screen.findByText('fieldnote.app/i/rosa', undefined, { timeout: 4000 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Email a friend' }))
    expect(onShare).toHaveBeenCalledWith('email', 'https://fieldnote.app/i/rosa')
    expect(screen.getAllByText('312').length).toBeGreaterThan(0)
  })

  test('a failed join explains the error’s message under the field', async () => {
    const user = userEvent.setup()
    reduced(<Waitlist live={false} onJoin={() => Promise.reject(new Error('The list is full.'))} />)
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'mira@studio.com')
    await user.click(screen.getByRole('button', { name: /Join the waitlist/ }))
    expect(await screen.findByText('The list is full.')).toBeInTheDocument()
  })
})
