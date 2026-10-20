import { render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PageTransition, type PageVariant } from './page-transition'

function App({ route, variant }: { route: string; variant: PageVariant }) {
  return (
    <YoujProvider reducedMotion="never" timeScale={0.25}>
      <PageTransition routeKey={route} variant={variant}>
        {route === '/list' ? <h1>List page</h1> : <h1>Detail page</h1>}
      </PageTransition>
    </YoujProvider>
  )
}

test.each<PageVariant>(['fade-through', 'slide', 'clip-reveal', 'curtain'])('%s renders the page for the current route', async (variant) => {
  const { rerender } = render(<App route="/list" variant={variant} />)
  expect(screen.getByRole('heading')).toHaveTextContent('List page')

  rerender(<App route="/detail" variant={variant} />)
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Detail page' })).toBeInTheDocument())
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'List page' })).not.toBeInTheDocument())

  rerender(<App route="/list" variant={variant} />)
  await waitFor(() => expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(['List page']))
})

test('reduced motion still swaps to the right page', async () => {
  const { rerender } = render(
    <YoujProvider reducedMotion="always">
      <PageTransition routeKey="a">A</PageTransition>
    </YoujProvider>,
  )
  rerender(
    <YoujProvider reducedMotion="always">
      <PageTransition routeKey="b">B</PageTransition>
    </YoujProvider>,
  )
  await waitFor(() => expect(screen.queryByText('A')).not.toBeInTheDocument())
  expect(screen.getByText('B')).toBeInTheDocument()
})

test('the leaving page is inert while it fades out, and the incoming one is not', async () => {
  const app = (route: string) => (
    <YoujProvider reducedMotion="never" timeScale={20}>
      <PageTransition routeKey={route}>
        <button>{route}</button>
      </PageTransition>
    </YoujProvider>
  )
  const { rerender } = render(app('a'))
  expect(screen.getByRole('button', { name: 'a' }).closest('[inert]')).toBeNull()

  rerender(app('b'))
  await waitFor(() => expect(screen.getByText('a').closest('[inert]')).not.toBeNull())
  expect(screen.getByText('b').closest('[inert]')).toBeNull()
})
