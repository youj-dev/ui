import { render, screen } from '@testing-library/react'
import { AppPage } from './app-page'

const PAGE_WIDTH = 'max-w-[calc(var(--container-7xl)+--spacing(16))]'
const READABLE_WIDTH = 'max-w-[calc(var(--container-5xl)+--spacing(16))]'

describe('AppPage', () => {
  test('sets the title, description and actions in the slots the frame reads', () => {
    render(
      <AppPage title="Capacity" description="Forecast demand." actions={<button type="button">Export</button>}>
        <p>Body</p>
      </AppPage>,
    )
    const title = screen.getByRole('heading', { level: 1, name: 'Capacity' })
    expect(title).toHaveAttribute('data-slot', 'app-page-title')
    const header = title.closest('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByText('Forecast demand.'))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Export' }))
    expect(screen.getByText('Body').closest('[data-slot=app-page-header]')).toBeNull()
  })

  test('takes the page’s density, is a container with the gutter and page width inside it', () => {
    const { container } = render(<AppPage title="Capacity" />)
    const page = container.querySelector('[data-slot=app-page]')!
    expect(page).not.toHaveAttribute('data-yj-density')
    expect(page).toHaveClass('@container')
    // A container's queries reach only what's inside it, so the gutter and the width sit on the body.
    const body = page.querySelector(':scope > [data-slot=app-page-body]')!
    expect(body).toHaveClass('p-4', '@3xl:p-6', '@6xl:p-8', 'own:mx-auto', PAGE_WIDTH)
  })

  test('`fill` spans the width and `readable` stops at 64rem, centered', () => {
    const { container, rerender } = render(<AppPage title="Customers" width="fill" />)
    const body = () => container.querySelector('[data-slot=app-page-body]')!
    expect(body()).not.toHaveClass(PAGE_WIDTH)
    expect(body()).not.toHaveClass(READABLE_WIDTH)
    rerender(<AppPage title="Settings" width="readable" />)
    expect(body()).toHaveClass(READABLE_WIDTH)
    expect(body()).toHaveClass('own:mx-auto')
  })

  test('takes a heading level, the app’s density and its own props, and leaves the header out when it has nothing', () => {
    const { container, rerender } = render(<AppPage title="Usage" headingLevel={2} data-yj-density="roomy" data-page="usage" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Usage' })).toBeInTheDocument()
    const page = container.querySelector('[data-slot=app-page]')!
    expect(page).toHaveAttribute('data-yj-density', 'roomy')
    expect(page).toHaveAttribute('data-page', 'usage')
    rerender(<AppPage>Only a body</AppPage>)
    expect(container.querySelector('[data-slot=app-page-header]')).toBeNull()
    expect(screen.getByText('Only a body')).toBeInTheDocument()
  })
})
