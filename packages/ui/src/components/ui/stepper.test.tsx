import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Stepper, type StepperStep } from './stepper'

const steps: StepperStep[] = [
  { id: 'cart', title: 'Cart' },
  { id: 'shipping', title: 'Shipping', optional: true },
  { id: 'payment', title: 'Payment' },
  { id: 'review', title: 'Review' },
]

const items = () => screen.getAllByRole('listitem')

describe('Stepper', () => {
  test('an ordered list whose steps speak their state, with the current one marked', () => {
    render(<Stepper steps={steps} current={1} />)
    const list = screen.getByRole('list', { name: 'Progress' })
    expect(list.tagName).toBe('OL')
    expect(items().map((item) => item.getAttribute('data-status'))).toEqual(['complete', 'current', 'upcoming', 'upcoming'])
    expect(items()[0]).toHaveTextContent('Cart, completed')
    expect(items()[1]).toHaveTextContent('Shipping')
    expect(items()[1]).toHaveTextContent('Optional')
    expect(items()[1]).toHaveAttribute('aria-current', 'step')
    expect(items()[2]).not.toHaveAttribute('aria-current')
  })

  test('an error overrides the step state and is announced', () => {
    render(<Stepper steps={steps.map((s) => (s.id === 'payment' ? { ...s, invalid: true } : s))} current={2} />)
    expect(items()[2]).toHaveAttribute('data-status', 'error')
    expect(items()[2]).toHaveAttribute('aria-current', 'step')
    expect(items()[2]).toHaveTextContent('Payment, has an error')
  })

  test('connectors fill up to the current step', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Stepper steps={steps} current={2} />
      </YoujProvider>,
    )
    const connectors = document.querySelectorAll('[data-slot=stepper-connector]')
    expect(connectors).toHaveLength(3)
    expect(Array.from(connectors, (c) => c.hasAttribute('data-filled'))).toEqual([true, true, false])
  })

  test('reduced motion: a connector is filled at once', async () => {
    const { rerender } = render(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Stepper steps={steps} current={0} />
      </YoujProvider>,
    )
    rerender(
      <YoujProvider reducedMotion="always" timeScale={50}>
        <Stepper steps={steps} current={1} />
      </YoujProvider>,
    )
    // At timeScale 50 a real tween would take seconds; this lands on the next frame.
    const fill = document.querySelector<HTMLElement>('[data-slot=stepper-connector] > span')!
    await waitFor(() => expect(fill.style.transform).toBe('none'), { timeout: 500 })
  })

  test('with onStepClick, done steps and the current one are buttons; later ones are not', async () => {
    const user = userEvent.setup()
    const onStepClick = vi.fn()
    render(<Stepper steps={steps} current={2} onStepClick={onStepClick} />)
    expect(within(items()[3]!).queryByRole('button')).toBeNull()
    await user.click(within(items()[0]!).getByRole('button', { name: /Cart/ }))
    expect(onStepClick).toHaveBeenCalledWith(0)
    await user.keyboard('{Tab}{Enter}')
    expect(onStepClick).toHaveBeenLastCalledWith(1)
  })

  test('in a narrow container a horizontal stepper shows only the current step’s label; every label stays spoken', () => {
    const { rerender } = render(<Stepper steps={steps} current={1} />)
    const text = () => screen.getAllByRole('listitem').map((li) => li.querySelector('[data-slot=stepper-title]')!.parentElement!)
    expect(text().map((el) => el.className.includes('@max-lg:sr-only'))).toEqual(steps.map((_, i) => i !== 1))
    expect(screen.getAllByRole('listitem')[1]).toHaveClass('@max-lg:flex-1')
    // Under 20rem, the current one's too.
    expect(text()[1]).toHaveClass('own:@max-xs:sr-only')
    rerender(<Stepper steps={steps} current={1} orientation="vertical" />)
    expect(text().some((el) => /@max-(lg|xs):sr-only/.test(el.className))).toBe(false)
    rerender(<Stepper steps={steps} current={1} compact />)
    expect(text().every((el) => el.className.includes('@max-lg:sr-only'))).toBe(true)
  })

  test('vertical orientation', () => {
    render(<Stepper steps={steps} current={0} orientation="vertical" />)
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'vertical')
  })

  test('stepHref makes reachable steps links to their pages', async () => {
    const user = userEvent.setup()
    const onStepClick = vi.fn()
    render(<Stepper steps={steps} current={1} stepHref={(i) => `#${steps[i]!.id}`} onStepClick={onStepClick} />)
    expect(screen.getByRole('link', { name: /Cart/ })).toHaveAttribute('href', '#cart')
    expect(screen.getByRole('link', { name: /Shipping/ })).toHaveAttribute('href', '#shipping')
    expect(screen.queryByRole('link', { name: /Payment/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Cart/ }))
    expect(onStepClick).toHaveBeenCalledWith(0)
  })

  test('a detour marks the steps it bypasses and is read after the step it leaves', () => {
    render(
      <YoujProvider reducedMotion="always">
        <Stepper steps={steps} current={1} detour={{ from: 0, to: 2, label: 'Via the ring road', detail: '−31 min' }} />
      </YoujProvider>,
    )
    expect(items().map((item) => item.hasAttribute('data-bypassed'))).toEqual([false, true, false, false])
    const detour = document.querySelector('[data-slot=stepper-detour]')!
    expect(items()[0]).toContainElement(detour as HTMLElement)
    expect(items()[0]).toHaveTextContent('Detour, rejoins at step 3')
    expect(detour).toHaveTextContent('Via the ring road')
    expect(detour).toHaveTextContent('−31 min')
  })

  test('ignores a detour that runs backwards, off the end, or on a vertical stepper', () => {
    const { rerender } = render(<Stepper steps={steps} current={1} detour={{ from: 2, to: 1, label: 'Back' }} />)
    expect(document.querySelector('[data-slot=stepper-detour]')).toBeNull()
    rerender(<Stepper steps={steps} current={1} detour={{ from: 1, to: 9, label: 'Off' }} />)
    expect(document.querySelector('[data-slot=stepper-detour]')).toBeNull()
    rerender(<Stepper steps={steps} current={1} orientation="vertical" detour={{ from: 0, to: 2, label: 'Down' }} />)
    expect(document.querySelector('[data-slot=stepper-detour]')).toBeNull()
  })
})

describe('Stepper flagged steps', () => {
  test('an upcoming flagged step wears the flag and keeps its description as the reason', () => {
    render(
      <Stepper
        steps={[
          { id: 'a', title: 'Design' },
          { id: 'b', title: 'Submission', description: 'Oct 30, deadline', flagged: true },
        ]}
        current={0}
      />,
    )
    const items = screen.getAllByRole('listitem')
    const disc = items[1]!.querySelector('[data-slot=stepper-indicator]')
    expect(disc).toHaveAttribute('data-yj-flagged')
    expect(disc).toHaveAttribute('data-status', 'upcoming')
    expect(within(items[1]!).getByText('Oct 30, deadline')).toHaveClass('own:text-danger-text')
  })

  test('a flagged step that is done drops the flag', () => {
    render(<Stepper steps={[{ id: 'a', title: 'Submission', flagged: true }, { id: 'b', title: 'Launch' }]} current={1} />)
    const disc = screen.getAllByRole('listitem')[0]!.querySelector('[data-slot=stepper-indicator]')
    expect(disc).toHaveAttribute('data-status', 'complete')
    expect(disc).not.toHaveAttribute('data-yj-flagged')
  })
})
