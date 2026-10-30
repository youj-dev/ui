import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Checklist } from './checklist'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('onboarding checklist block', () => {
  test('a named region with its progress, and the next step open', () => {
    reduced(<Checklist />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const title = screen.getByRole('heading', { level: 2 })
    const card = screen.getByRole('region', { name: title.textContent! })
    expect(within(card).getByText('1 of 5 steps done')).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Connect a repository' })).toHaveAttribute('aria-expanded', 'true')
    expect(within(card).getByRole('button', { name: /Create your workspace.*done/ })).toBeDisabled()
  })

  test('finishing a step moves it to Done, opens the next and announces it', async () => {
    const user = userEvent.setup()
    reduced(<Checklist />)
    await user.click(screen.getByRole('button', { name: 'Connect repository' }))
    expect(await screen.findByText('2 of 5 steps done', undefined, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Connect a repository.*done/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Ship your first deploy' })).toHaveAttribute('aria-expanded', 'true')
    // Button's own async announcer is a status too; find the checklist's by its message.
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'Connect a repository done. 2 of 5 complete.')).toBe(true)
  })

  test('minimizes to a pill and back', async () => {
    const user = userEvent.setup()
    reduced(<Checklist defaultCompleted={['workspace', 'repo', 'deploy']} />)
    await user.click(screen.getByRole('button', { name: 'Minimize' }))
    const pill = screen.getByRole('button', { name: 'Get started 3 of 5, Open the checklist (3 of 5 done)' })
    await user.click(pill)
    expect(screen.getByRole('heading', { name: 'Get started with Fern' })).toBeInTheDocument()
  })

  test('embedded, it sits in the host: no page landmark or h1, its title an h2, the product named', async () => {
    const user = userEvent.setup()
    reduced(<Checklist embedded product="Relay" />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    const region = screen.getByRole('region', { name: 'Get started with Relay' })
    expect(within(region).getByRole('heading', { level: 2, name: 'Get started with Relay' })).toBeInTheDocument()
    expect(within(region).getByText(/Relay builds every push/)).toBeInTheDocument()
    await user.click(within(region).getByRole('button', { name: 'Minimize' }))
    expect(screen.getByRole('region', { name: 'Getting started' })).toBeInTheDocument()
  })

  test('the last step gives way to the celebration', async () => {
    const user = userEvent.setup()
    reduced(<Checklist defaultCompleted={['workspace', 'repo', 'deploy', 'invite']} />)
    await user.click(screen.getByRole('button', { name: 'Add domain' }))
    expect(await screen.findByText('You’re all set', undefined, { timeout: 3000 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('complementary', { name: 'Getting started' })).not.toBeInTheDocument()
  })

  const steps = [
    { id: 'catalog', title: 'Import your catalog', description: 'Upload a CSV of products.', action: 'Import' },
    { id: 'payments', title: 'Turn on payments', description: 'Connect a payout account.', action: 'Connect payouts' },
  ]

  test('your steps, brand and copy drive the card; onComplete gets the step and the done ids are reported', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const onCompletedChange = vi.fn()
    reduced(
      <Checklist
        steps={steps}
        defaultCompleted={[]}
        brand={{ name: 'Shopfront' }}
        copy={{ stepsDone: (n, t) => `${n}/${t} finished` }}
        onComplete={onComplete}
        onCompletedChange={onCompletedChange}
        className="root-x"
        data-testid="root"
      />,
    )
    expect(screen.getByTestId('root')).toHaveClass('root-x')
    expect(screen.getByRole('heading', { level: 2, name: 'Get started with Shopfront' })).toBeInTheDocument()
    expect(screen.getByText('0/2 finished')).toBeInTheDocument()
    expect(screen.queryByText('Create your workspace')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Import' }))
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ id: 'catalog' }))
    await waitFor(() => expect(onCompletedChange).toHaveBeenCalledWith(['catalog']), { timeout: 3000 })
    expect(screen.getByText('1/2 finished')).toBeInTheDocument()
  })

  test('a failed step stays open and says why', async () => {
    const user = userEvent.setup()
    reduced(<Checklist steps={steps} defaultCompleted={[]} onComplete={() => Promise.reject(new Error('The CSV has no price column.'))} />)
    await user.click(screen.getByRole('button', { name: 'Import' }))
    expect(await screen.findByText('The CSV has no price column.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import your catalog' })).toHaveAttribute('aria-expanded', 'true')
  })

  test('completed and minimized can be controlled', async () => {
    const user = userEvent.setup()
    const onMinimizedChange = vi.fn()
    reduced(<Checklist steps={steps} completed={['catalog']} minimized={false} onMinimizedChange={onMinimizedChange} />)
    expect(screen.getByText('1 of 2 steps done')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Minimize' }))
    expect(onMinimizedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument()
  })

  test('another world: steps, brand and copy rename the card and its summary', () => {
    reduced(
      <Checklist
        brand={{ name: 'Corner & Co.' }}
        defaultCompleted={['location']}
        steps={[
          { id: 'location', title: 'Pick your location', description: 'Set the address.', action: 'Set location' },
          { id: 'register', title: 'Set up the register', description: 'Pair the card reader.', action: 'Pair reader' },
        ]}
        copy={{ title: (name) => `Open ${name}`, region: 'Store setup' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Open Corner & Co.' })).toBeInTheDocument()
    expect(screen.getByText('1 of 2 steps done')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pair reader' })).toBeInTheDocument()
    expect(screen.queryByText('Create your workspace')).not.toBeInTheDocument()
  })
})
