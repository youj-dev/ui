import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { EmptyStates, NoAccess, NoProjects, NoResults } from './empty-states'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Empty states block', () => {
  test('copy rewrites the gallery and every state', () => {
    reduced(<EmptyStates headingLevel={2} illustration={null} query="invoice 88" copy={{ galleryTitle: 'Nothing here', projectsTitle: 'No pipelines yet', resultsTitle: (q) => `Nothing matches ${q}` }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Nothing here' })).toBeInTheDocument()
    expect(screen.getByText('No pipelines yet')).toBeInTheDocument()
    expect(screen.getByText('Nothing matches invoice 88')).toBeInTheDocument()
  })

  test('the buttons call their callbacks', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    const onImport = vi.fn()
    const onClear = vi.fn()
    reduced(
      <>
        <NoProjects illustration={null} onCreate={onCreate} onImport={onImport} />
        <NoResults illustration={null} onClear={onClear} />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'New project' }))
    await user.click(screen.getByRole('button', { name: 'Import from Git' }))
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onCreate).toHaveBeenCalledOnce()
    expect(onImport).toHaveBeenCalledOnce()
    expect(onClear).toHaveBeenCalledOnce()
  })

  test('request access runs onRequest; the switch link renders through linkComponent', async () => {
    const user = userEvent.setup()
    const onRequest = vi.fn(() => Promise.resolve())
    reduced(<NoAccess illustration={null} onRequest={onRequest} switchHref="/workspaces" linkComponent={(props: React.ComponentProps<'a'>) => <a data-router="" {...props} />} />)
    expect(screen.getByRole('link', { name: 'switch workspace' })).toHaveAttribute('href', '/workspaces')
    expect(screen.getByRole('link', { name: 'switch workspace' })).toHaveAttribute('data-router')
    await user.click(screen.getByRole('button', { name: 'Request access' }))
    expect(onRequest).toHaveBeenCalledOnce()
  })

  test('actions replace a state’s own buttons; rest props reach the root', () => {
    reduced(<NoProjects illustration={null} data-testid="state" className="min-h-40" actions={<button type="button">Connect a source</button>} />)
    expect(screen.getByTestId('state')).toHaveClass('min-h-40')
    expect(screen.getByRole('button', { name: 'Connect a source' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'New project' })).not.toBeInTheDocument()
  })
})
