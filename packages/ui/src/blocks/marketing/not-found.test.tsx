import { forwardRef, type ComponentProps } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { NotFound } from './not-found'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('NotFound', () => {
  test('the 404 stands beside a decorative lighthouse; media={null} sets the code large instead', async () => {
    const { container, unmount } = reduced(<NotFound />)
    await waitFor(() => expect(container.querySelector('.yjm-lighthouse')).not.toBeNull())
    expect(container.querySelector('.yjm-lighthouse')!.closest('[aria-hidden]')).not.toBeNull()
    expect(screen.getByText('Error 404')).toBeInTheDocument()
    unmount()
    const plain = reduced(<NotFound media={null} />)
    await act(async () => {})
    expect(plain.container.querySelector('.yjm')).toBeNull()
    expect(screen.queryByText('Error 404')).toBeNull()
  })

  test('destinations, homeCta and copy drive the 404', () => {
    reduced(
      <NotFound
        media={null}
        homeCta={{ label: 'Back to the shop', href: '/' }}
        destinations={[{ title: 'Coffee', description: 'Roasts.', href: '/coffee' }]}
        copy={{ title: 'This bag is empty', destinationsLabel: 'Try these' }}
      />,
    )
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('This bag is empty')
    expect(within(main).getByRole('link', { name: /Back to the shop/ })).toHaveAttribute('href', '/')
    const nav = within(main).getByRole('navigation', { name: 'Try these' })
    expect(within(nav).getByRole('link', { name: /Coffee/ })).toHaveAttribute('href', '/coffee')
  })

  test('search sends the query to onSearch and shows why it failed', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Search is down for a moment.'))
    reduced(<NotFound media={null} onSearch={onSearch} copy={{ searchLabel: 'Find a page' }} />)
    const search = screen.getByRole('search', { name: 'Find a page' })
    const field = within(search).getByRole('searchbox', { name: 'Find a page' })
    await user.click(within(search).getByRole('button', { name: /Search/ }))
    expect(onSearch).not.toHaveBeenCalled()
    await user.type(field, '  pricing {Enter}')
    expect(onSearch).toHaveBeenCalledWith('pricing')
    await user.click(within(search).getByRole('button', { name: /Search/ }))
    expect(await screen.findByText('Search is down for a moment.')).toBeInTheDocument()
  })

  test('onBack runs on Go back; an empty back label hides it', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const { unmount } = reduced(<NotFound media={null} onBack={onBack} />)
    await user.click(screen.getByRole('button', { name: /Go back/ }))
    expect(onBack).toHaveBeenCalledTimes(1)
    unmount()
    reduced(<NotFound media={null} copy={{ back: '' }} destinations={[]} />)
    expect(screen.queryByRole('button', { name: /Go back/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  test('coming soon: a rejected onNotify shows its message', async () => {
    const user = userEvent.setup()
    const onNotify = vi.fn().mockRejectedValue(new Error('The beta is full.'))
    reduced(
      <NotFound
        variant="coming-soon"
        launch={new Date(Date.now() + 86_400_000)}
        onNotify={onNotify}
        copy={{ notify: 'Tell me', comingTitle: 'Soon' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Soon')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'ana@fernhill.coffee')
    await user.click(screen.getByRole('button', { name: 'Tell me' }))
    expect(onNotify).toHaveBeenCalledWith('ana@fernhill.coffee')
    await waitFor(() => expect(screen.getByText('The beta is full.')).toBeInTheDocument())
  })

  test('linkComponent, headingLevel and extra props', () => {
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<NotFound media={null} linkComponent={Link} headingLevel={2} id="missing" />)
    for (const link of screen.getAllByRole('link')) expect(link).toHaveAttribute('data-router')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('This page drifted off')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'missing')
  })
})
