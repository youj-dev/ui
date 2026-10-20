import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Webhooks } from './webhooks'
import { DELIVERIES, ENDPOINTS, NOW } from './webhooks/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Webhooks block', () => {
  test('lists endpoints with their health, and opens the first one’s delivery log', () => {
    reduced(<Webhooks embedded={false} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Webhooks' })).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Endpoints' })
    const billing = within(table).getByRole('button', { name: /^https:\/\/api\.northwind\.dev\/hooks\/billing/ })
    expect(billing).toHaveAttribute('aria-pressed', 'true')
    expect(within(table).getByText('Failing')).toBeInTheDocument()
    expect(within(table).getByText('Disabled')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Recent deliveries to https://api.northwind.dev/hooks/billing' })).toBeInTheDocument()
  })

  test('picking an endpoint shows its deliveries; a timeout shows no response; filters narrow the list', async () => {
    const user = userEvent.setup()
    reduced(<Webhooks embedded={false} />)
    await user.click(screen.getByRole('button', { name: /^https:\/\/ops\.northwind\.dev/ }))
    const log = screen.getByRole('region', { name: /Recent deliveries to https:\/\/ops/ })
    const list = within(log).getByRole('list', { name: 'Deliveries' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(4)

    await user.click(within(list).getByRole('button', { name: /Timeout/ }))
    await user.click(within(log).getByRole('tab', { name: 'Response' }))
    expect(within(log).getByText('No response within 10 seconds.')).toBeInTheDocument()

    await user.click(within(log).getByRole('button', { name: 'Succeeded' }))
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
  })

  test('Resend adds a new attempt at the top and selects it', async () => {
    const user = userEvent.setup()
    reduced(<Webhooks embedded={false} />)
    await user.click(screen.getByRole('button', { name: /^https:\/\/ops\.northwind\.dev/ }))
    const log = screen.getByRole('region', { name: /ops\.northwind/ })
    await user.click(within(log).getByRole('button', { name: 'Resend' }))
    await waitFor(() => expect(within(log).getAllByRole('listitem')).toHaveLength(5))
    const first = within(within(log).getAllByRole('listitem')[0]!).getByRole('button')
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(first).toHaveTextContent('Attempt #2')
  })

  test('adding an endpoint validates the URL and events, then adds the row', async () => {
    const user = userEvent.setup()
    reduced(<Webhooks embedded={false} />)
    await user.click(screen.getByRole('button', { name: 'Add endpoint' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add endpoint' })
    await user.click(within(sheet).getByRole('button', { name: 'Save endpoint' }))
    expect(await within(sheet).findByText('Enter the URL to send events to.')).toBeInTheDocument()
    expect(within(sheet).getByText('Choose at least one event.')).toBeInTheDocument()

    const url = within(sheet).getByRole('textbox', { name: /Endpoint URL/ })
    await user.type(url, 'http://example.com/hooks')
    expect(within(sheet).getByText('Use https:// so payloads are encrypted in transit.')).toBeInTheDocument()
    await user.clear(url)
    await user.type(url, 'https://api.northwind.dev/hooks/billing')
    expect(within(sheet).getByText('Another endpoint already uses this URL.')).toBeInTheDocument()
    await user.clear(url)
    await user.type(url, 'https://example.com/hooks')

    // A group's box checks the whole group.
    const invoices = within(within(sheet).getByRole('group', { name: 'Invoices' })).getAllByRole('checkbox')
    await user.click(invoices[0]!)
    expect(within(sheet).getByText('3 of 11 selected')).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Save endpoint' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(within(screen.getByRole('table')).getByRole('button', { name: /^https:\/\/example\.com\/hooks/ })).toHaveAttribute('aria-pressed', 'true')
  })

  test('editing shows the signing secret masked until revealed, and rotating replaces it', async () => {
    const user = userEvent.setup()
    reduced(<Webhooks embedded={false} />)
    await user.click(screen.getByRole('button', { name: 'Actions for https://api.northwind.dev/hooks/billing' }))
    await user.click(await screen.findByRole('menuitem', { name: /Edit/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Edit endpoint' })
    const secret = within(sheet).getByLabelText('Signing secret', { selector: 'code' })
    expect(secret).toHaveTextContent(/^whsec_•+g9h1$/)
    await user.click(within(sheet).getByRole('button', { name: 'Reveal' }))
    expect(within(sheet).getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(sheet).getByRole('button', { name: 'Rotate…' }))
    const confirm = await screen.findByRole('alertdialog', { name: 'Rotate the signing secret?' })
    await user.click(within(confirm).getByRole('button', { name: 'Rotate secret' }))
    expect(await within(sheet).findByText('New secret issued. The old one expires in 24 hours.')).toBeInTheDocument()
  })

  test('its handlers get the delivery to resend, the endpoint to delete, and the secret it rotates to', async () => {
    const user = userEvent.setup()
    const onResend = vi.fn()
    const onDeleteEndpoint = vi.fn()
    const onRotateSecret = vi.fn(async () => 'whsec_fromyourapi1234')
    reduced(<Webhooks embedded={false} onResend={onResend} onDeleteEndpoint={onDeleteEndpoint} onRotateSecret={onRotateSecret} />)
    await user.click(screen.getByRole('button', { name: /^https:\/\/ops\.northwind\.dev/ }))
    const log = screen.getByRole('region', { name: /ops\.northwind/ })
    await user.click(within(log).getByRole('button', { name: 'Resend' }))
    await waitFor(() => expect(onResend).toHaveBeenCalledWith(expect.objectContaining({ attempt: 1 })))

    await user.click(screen.getByRole('button', { name: 'Actions for https://api.northwind.dev/hooks/billing' }))
    await user.click(await screen.findByRole('menuitem', { name: /Edit/ }))
    const sheet = await screen.findByRole('dialog', { name: 'Edit endpoint' })
    await user.click(within(sheet).getByRole('button', { name: 'Rotate…' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Rotate secret' }))
    await waitFor(() => expect(onRotateSecret).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://api.northwind.dev/hooks/billing' })))
    await waitFor(() => expect(within(sheet).getByLabelText('Signing secret', { selector: 'code' })).toHaveTextContent('whsec_fromyourapi1234'))
    await user.keyboard('{Escape}')

    await user.click(screen.getByRole('button', { name: 'Actions for https://api.northwind.dev/hooks/billing' }))
    await user.click(await screen.findByRole('menuitem', { name: /Delete/ }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: /Delete/ }))
    await waitFor(() => expect(onDeleteEndpoint).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://api.northwind.dev/hooks/billing' })))
  })

  test('by default, a page of the app’s frame: the shared header holds the title, the demo marker and Add, with no main', () => {
    const { container } = reduced(<Webhooks />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Webhooks' }))
    expect(header).toContainElement(screen.getByText('Demo data'))
    expect(header).toContainElement(screen.getByRole('button', { name: /Add/ }))
    expect(screen.getByRole('heading', { level: 2, name: 'Deliveries' })).toBeInTheDocument()
  })

  test('with no endpoints, it says so and offers to add one', () => {
    reduced(<Webhooks embedded={false} endpoints={[]} deliveries={[]} copy={{ emptyTitle: 'Keine Endpunkte' }} />)
    expect(screen.getByText('Keine Endpunkte')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Add endpoint' })).toHaveLength(2)
  })

  test('marks the demo endpoints as demo data; yours get no marker, and a resend logs only what your handler returns', async () => {
    const user = userEvent.setup()
    const demo = reduced(<Webhooks embedded={false} />)
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    demo.unmount()
    const onResend = vi.fn(async () => undefined)
    reduced(<Webhooks embedded={false} endpoints={ENDPOINTS} deliveries={DELIVERIES} now={NOW} onResend={onResend} />)
    expect(screen.queryByText('Demo data')).toBeNull()
    const log = screen.getByRole('region', { name: /billing/ })
    const before = within(log).getAllByRole('button').length
    await user.click(within(log).getByRole('button', { name: 'Resend' }))
    await waitFor(() => expect(onResend).toHaveBeenCalled())
    expect(within(log).getAllByRole('button')).toHaveLength(before)
  })

  test('Send test event calls onTest and logs the delivery it resolves with', async () => {
    const user = userEvent.setup()
    const sent = { ...DELIVERIES[0]!, id: 'from-your-api', at: NOW, attempt: 1 }
    const onTest = vi.fn(async () => sent)
    reduced(<Webhooks embedded={false} now={NOW} onTest={onTest} />)
    await user.click(screen.getByRole('button', { name: 'Actions for https://api.northwind.dev/hooks/billing' }))
    await user.click(await screen.findByRole('menuitem', { name: /Send test event/ }))
    await waitFor(() => expect(onTest).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://api.northwind.dev/hooks/billing' }), expect.any(String)))
  })
})
