import { forwardRef } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { ProductTour, type ProductTourStep } from './product-tour'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'See it work in four steps'
const step = (n: number, title: string, done = false) => screen.getByRole('tab', { name: `Step ${n} of 4: ${title}${done ? ', done' : ''}` })

describe('ProductTour', () => {
  test('a labelled section with a tab per step, the first open, and nothing tried yet', () => {
    reduced(<ProductTour />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    const list = screen.getByRole('tablist', { name: 'Tour steps' })
    expect(within(list).getAllByRole('tab')).toHaveLength(4)
    expect(step(1, 'Connect a repository')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('0 of 4 steps tried', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('acme/web')
  })

  test('arrow keys move between steps, and Next and Back walk them', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<ProductTour onValueChange={onValueChange} />)
    step(1, 'Connect a repository').focus()
    await user.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith('guardrails')
    await user.click(screen.getByRole('button', { name: 'Next step' }))
    expect(onValueChange).toHaveBeenLastCalledWith('review')
    expect(step(3, 'Review on the real thing')).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(step(2, 'Set the guardrails')).toHaveAttribute('aria-selected', 'true')
  })

  test('connecting a repository checks the step off, moves progress and announces it; going away and back keeps it', async () => {
    const user = userEvent.setup()
    const onDoneChange = vi.fn()
    reduced(<ProductTour onDoneChange={onDoneChange} />)
    await user.click(screen.getByRole('button', { name: 'Connect acme/web' }))
    await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument(), { timeout: 3000 })
    expect(onDoneChange).toHaveBeenCalledWith(['connect'])
    expect(step(1, 'Connect a repository', true)).toBeInTheDocument()
    expect(screen.getByText('1 of 4 steps tried', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getAllByRole('status').map((el) => el.textContent)).toContain('Connect a repository: done')
    await user.click(step(2, 'Set the guardrails'))
    await user.click(step(1, 'Connect a repository', true))
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  test('flipping a guardrail completes its step', async () => {
    const user = userEvent.setup()
    reduced(<ProductTour />)
    await user.click(step(2, 'Set the guardrails'))
    await user.click(screen.getByRole('switch', { name: /Run visual tests/ }))
    expect(screen.getByRole('switch', { name: /Run visual tests/ })).toBeChecked()
    expect(step(2, 'Set the guardrails', true)).toBeInTheDocument()
  })

  test('replying to a comment on the preview completes its step', async () => {
    const user = userEvent.setup()
    reduced(<ProductTour />)
    await user.click(step(3, 'Review on the real thing'))
    await user.click(screen.getByRole('button', { name: 'Comment on the button' }))
    await user.type(screen.getByRole('textbox', { name: 'Reply to Theo' }), 'Done, bigger on mobile.')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByText('Done, bigger on mobile.')).toBeInTheDocument()
    expect(step(3, 'Review on the real thing', true)).toBeInTheDocument()
  })

  test('the canary can only be promoted once enough traffic has moved, and promoting makes it live', async () => {
    const user = userEvent.setup()
    reduced(<ProductTour />)
    await user.click(step(4, 'Ship with a canary'))
    const promote = screen.getByRole('button', { name: 'Promote to 100%' })
    expect(promote).toBeDisabled()
    // jsdom has no layout, so Base UI keeps the thumb hidden: find it by its aria-label.
    const thumb = screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === 'Traffic on the new build')!
    thumb.focus()
    await user.keyboard('{End}')
    expect(promote).toBeEnabled()
    await user.click(promote)
    await waitFor(() => expect(screen.getByText('Live')).toBeInTheDocument(), { timeout: 3000 })
    expect(step(4, 'Ship with a canary', true)).toBeInTheDocument()
  })

  test('the last step ends on the call to action, and the tour can be restarted', async () => {
    const user = userEvent.setup()
    const onDoneChange = vi.fn()
    reduced(<ProductTour done={['connect']} onDoneChange={onDoneChange} cta={{ label: 'Open the app', href: '/signup' }} defaultValue="ship" />)
    expect(screen.getByRole('link', { name: /Open the app/ })).toHaveAttribute('href', '/signup')
    expect(screen.queryByRole('button', { name: 'Next step' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start the tour again' }))
    expect(onDoneChange).toHaveBeenLastCalledWith([])
  })

  test('your own steps drive the rail and their render gets done and complete', async () => {
    const user = userEvent.setup()
    const steps: ProductTourStep[] = [
      { id: 'a', title: 'Pick a plan', description: 'Choose one.', render: ({ complete, done }) => <button onClick={complete}>{done ? 'Picked' : 'Pick'}</button> },
      { id: 'b', title: 'Pay', description: 'Enter a card.', render: () => <p>Card form</p> },
    ]
    reduced(<ProductTour steps={steps} copy={{ stepName: (i, n, title, done) => `${i}/${n} ${title}${done ? ' ✓' : ''}` }} />)
    await user.click(screen.getByRole('button', { name: 'Pick' }))
    expect(screen.getByRole('tab', { name: '1/2 Pick a plan ✓' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Picked' })).toBeInTheDocument()
    expect(screen.getByText('1 of 2 steps tried', { selector: 'p' })).toBeInTheDocument()
  })

  test('a beacon points at the control a step marks to try, and goes once the step is done', async () => {
    const steps: ProductTourStep[] = [
      { id: 'a', title: 'Pick a plan', description: 'Choose one.', render: ({ complete }) => <button data-yj-tour-target="" onClick={complete}>Pick</button> },
      { id: 'b', title: 'Pay', description: 'Enter a card.', render: () => <p>Card form</p> },
    ]
    const user = userEvent.setup()
    const { container } = reduced(<ProductTour steps={steps} />)
    const beacon = container.querySelector('[data-slot="tour-beacon"]')!
    expect(beacon).toHaveAttribute('aria-hidden', 'true')
    await waitFor(() => expect(beacon).toHaveAttribute('data-state', 'shown'))
    await user.click(screen.getByRole('button', { name: 'Pick' }))
    await waitFor(() => expect(beacon).toHaveAttribute('data-state', 'hidden'))
    // A step that marks nothing gets no beacon.
    await user.click(screen.getByRole('tab', { name: /Pay/ }))
    await waitFor(() => expect(beacon).toHaveAttribute('data-state', 'hidden'))
  })

  test('the closing call to action renders through linkComponent', () => {
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<ProductTour defaultValue="ship" linkComponent={RouterLink} />)
    expect(screen.getByRole('link', { name: /Start with your own project/ })).toHaveAttribute('data-router')
  })

  test('headingLevel moves the title and each step heading; rest props apply; embedded and theme', () => {
    reduced(<ProductTour embedded theme={brutal} headingLevel={3} id="tour" />)
    const section = screen.getByRole('region', { name: TITLE })
    expect(section).toHaveAttribute('id', 'tour')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 3, name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: /Connect a repository/ })).toBeInTheDocument()
  })
})
