import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ConnectSources } from './connect-sources'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const tiles = () => within(screen.getByRole('list', { name: 'Sources' })).getAllByRole('listitem')

describe('ConnectSources', () => {
  test('says how many are connected and where each source stands, as a section with an h2', () => {
    reduced(<ConnectSources />)
    expect(screen.getByRole('heading', { level: 2, name: 'Data sources' })).toBeInTheDocument()
    expect(screen.getByText('3 of 6 connected')).toBeInTheDocument()
    const [identity, , cloud, mail] = tiles()
    expect(identity).toHaveTextContent('Connected')
    expect(identity).toHaveTextContent('4.1K / day')
    expect(cloud).toHaveTextContent('64%')
    expect(cloud).toHaveTextContent('Backfilling 7 days')
    expect(mail).toHaveTextContent('+8% coverage')
    expect(within(mail!).getByRole('button', { name: 'Connect Mail' })).toBeInTheDocument()
  })

  test('the coverage meter sums the sources that are in', () => {
    reduced(<ConnectSources />)
    expect(screen.getByRole('meter', { name: 'Coverage' })).toHaveAttribute('aria-valuetext', '41%')
    expect(screen.getByText('41%')).toBeInTheDocument()
  })

  test('connecting a source awaits the app, plugs it in and adds its coverage', async () => {
    const user = userEvent.setup()
    const onConnect = vi.fn()
    reduced(<ConnectSources onConnect={onConnect} />)
    await user.click(screen.getByRole('button', { name: 'Connect Mail' }))
    expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ id: 'mail' }))
    await waitFor(() => expect(screen.getByText('4 of 6 connected')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Connect Mail' })).not.toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Coverage' })).toHaveAttribute('aria-valuetext', '49%')
    expect(screen.getByText('Mail connected')).toBeInTheDocument()
  })

  test('a failed connect says so and keeps the source available', async () => {
    const user = userEvent.setup()
    reduced(<ConnectSources onConnect={() => Promise.reject(new Error('nope'))} />)
    await user.click(screen.getByRole('button', { name: 'Connect Network' }))
    await waitFor(() => expect(screen.getByText('Network didn’t connect. Try again.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Connect Network' })).toBeEnabled()
  })

  test('Skip and Continue call the app; the drawing can be left out', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    const onContinue = vi.fn()
    reduced(<ConnectSources illustration={null} onSkip={onSkip} onContinue={onContinue} />)
    expect(document.querySelector('[data-slot=connect-sources-illustration]')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Skip for now' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onSkip).toHaveBeenCalledOnce()
    expect(onContinue).toHaveBeenCalledOnce()
  })

  test('your sources and words drive the content', () => {
    reduced(
      <ConnectSources
        sources={[{ id: 'fw', label: 'Firewall', tone: 'chart-2', status: 'available', coverage: 0.25, volume: [1, 2, 3] }]}
        copy={{ title: 'Inputs', adds: (p: string) => `adds ${p}` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Inputs' })).toBeInTheDocument()
    expect(screen.getByText('0 of 1 connected')).toBeInTheDocument()
    expect(screen.getByText('adds 25%')).toBeInTheDocument()
  })

  test('format writes the daily volume and copy words its unit', () => {
    reduced(
      <ConnectSources
        illustration={null}
        format={(n) => `${n} raw`}
        copy={{ perDay: (v: string) => `${v} readings / day`, connected: 'Added' }}
        sources={[{ id: 't', label: 'Thermostat', tone: 'chart-5', status: 'connected', perDay: 1440, coverage: 0.3, volume: [1, 2, 3] }]}
      />,
    )
    expect(tiles()[0]).toHaveTextContent('1440 raw readings / day')
    expect(screen.getByRole('meter', { name: 'Coverage' })).toHaveAttribute('aria-valuetext', '30%')
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<ConnectSources embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Data sources' })).toBeInTheDocument()
  })
})
