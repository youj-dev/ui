import { forwardRef } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { FeatureSteps } from './feature-steps'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const moving = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="never">{ui}</YoujProvider>)

const stepButtons = () => screen.getAllByRole('button', { name: /^Step \d of \d/ })
const pictures = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('[inert]')]

describe('feature steps', () => {
  test('four steps, in order, as an ordered list of titled items', () => {
    reduced(<FeatureSteps />)
    const section = screen.getByRole('region', { name: 'From repository to production in four steps' })
    const list = within(section).getByRole('list', { name: 'Steps' })
    expect(list.tagName).toBe('OL')
    const items = within(list).getAllByRole('listitem')
    expect(items.map((li) => within(li).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Connect a repository',
      'Push a branch',
      'Review the preview',
      'Promote to production',
    ])
    expect(within(section).getByRole('link', { name: /Import a repository/ })).toHaveAttribute('href', '#import')
  })

  test('each number is a named button; the pictures and the lens are decoration', () => {
    const { container } = reduced(<FeatureSteps />)
    expect(stepButtons().map((b) => b.getAttribute('aria-label'))).toEqual([
      'Step 1 of 4: Connect a repository',
      'Step 2 of 4: Push a branch',
      'Step 3 of 4: Review the preview',
      'Step 4 of 4: Promote to production',
    ])
    expect(pictures(container)).toHaveLength(4)
    for (const el of pictures(container)) expect(el).toHaveAttribute('aria-hidden', 'true')
    for (const button of stepButtons()) for (const child of button.children) expect(child).toHaveAttribute('aria-hidden', 'true')
  })

  test('under reduced motion every step shows its finished picture, the first is current and there is no tour to pause', () => {
    const { container } = reduced(<FeatureSteps />)
    expect(pictures(container).map((el) => el.dataset.state)).toEqual(['done', 'done', 'done', 'done'])
    expect(stepButtons()[0]).toHaveAttribute('aria-current', 'step')
    expect(screen.queryByRole('button', { name: /the tour/ })).not.toBeInTheDocument()
  })

  test('with motion the first step plays, the rest wait, and the tour can be paused and played', async () => {
    const user = userEvent.setup()
    const { container } = moving(<FeatureSteps />)
    expect(pictures(container).map((el) => el.dataset.state)).toEqual(['active', 'idle', 'idle', 'idle'])
    await user.click(screen.getByRole('button', { name: 'Pause the tour' }))
    await user.click(screen.getByRole('button', { name: 'Play the tour' }))
    expect(screen.getByRole('button', { name: 'Pause the tour' })).toBeInTheDocument()
  })

  test('picking a step moves the lens there, reports it and stops the tour', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = moving(<FeatureSteps onValueChange={onValueChange} />)
    await user.click(stepButtons()[2]!)
    expect(onValueChange).toHaveBeenCalledWith('review')
    expect(stepButtons()[2]).toHaveAttribute('aria-current', 'step')
    expect(stepButtons()[0]).not.toHaveAttribute('aria-current')
    expect(pictures(container).map((el) => el.dataset.state)).toEqual(['done', 'done', 'active', 'idle'])
    expect(screen.getByRole('button', { name: 'Play the tour' })).toBeInTheDocument()
  })

  test('the app can own the step in play, and a picture can follow its state', () => {
    const seen: string[] = []
    moving(
      <FeatureSteps
        value="b"
        steps={[
          { id: 'a', title: 'One', description: 'First.', media: (state) => (seen.push(`a:${state}`), <span>a</span>) },
          { id: 'b', title: 'Two', description: 'Second.', media: (state) => (seen.push(`b:${state}`), <span>b</span>) },
          { id: 'c', title: 'Three', description: 'Third.', media: (state) => (seen.push(`c:${state}`), <span>c</span>) },
        ]}
      />,
    )
    expect(stepButtons()[1]).toHaveAttribute('aria-current', 'step')
    expect(seen.slice(-3)).toEqual(['a:done', 'b:active', 'c:idle'])
  })

  test('when the ring closes the next step opens, and the tour holds while off screen', async () => {
    const animations: { pause: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn>; finish: () => void }[] = []
    const animate = vi.fn(() => {
      let finish = () => {}
      const finished = new Promise<void>((resolve) => (finish = resolve))
      const animation = { finished, pause: vi.fn(), play: vi.fn(), cancel: vi.fn(), finish }
      animations.push(animation)
      return animation as unknown as Animation
    })
    Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate })
    try {
      const onValueChange = vi.fn()
      moving(<FeatureSteps onValueChange={onValueChange} />)
      expect(animations).toHaveLength(1)
      await act(async () => animations[0]!.finish())
      expect(onValueChange).toHaveBeenLastCalledWith('push')
      expect(stepButtons()[1]).toHaveAttribute('aria-current', 'step')
      expect(animations).toHaveLength(2)
      expect(animations[1]!.play).toHaveBeenCalled()
    } finally {
      delete (Element.prototype as { animate?: unknown }).animate
    }
  })

  test('autoAdvance false: no tour and no tour button', () => {
    const { container } = moving(<FeatureSteps autoAdvance={false} defaultValue="push" />)
    expect(screen.queryByRole('button', { name: /the tour/ })).not.toBeInTheDocument()
    expect(stepButtons()[1]).toHaveAttribute('aria-current', 'step')
    expect(pictures(container).map((el) => el.dataset.state)).toEqual(['done', 'active', 'idle', 'idle'])
  })

  test('embedded: laid out by the host; theme: rendered in a ThemeScope', () => {
    const { container, unmount } = reduced(<FeatureSteps embedded />)
    expect(screen.getByRole('region').className).not.toMatch(/\bpy-|bg-canvas/)
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
    unmount()
    const themed = reduced(<FeatureSteps theme={brutal} />)
    expect(themed.container.querySelector('[data-yj-theme]')).toContainElement(screen.getByRole('region'))
  })

  test('steps, copy and the call to action replace the demo, through linkComponent', async () => {
    const user = userEvent.setup()
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const { container } = reduced(
      <FeatureSteps
        copy={{ title: 'Paid in three steps', eyebrow: '', stepsLabel: 'Getting paid', stepName: (i, n, title) => `${title} (${i}/${n})` }}
        steps={[
          { title: 'Send the invoice', description: 'From a template.', media: <span>invoice</span> },
          { title: 'Remind on the due date', description: 'Automatically.' },
          { title: 'Match the payment', description: 'When it lands.' },
        ]}
        cta={{ label: 'Send your first invoice', href: '/invoices/new', onClick }}
        linkComponent={RouterLink}
        className="mine"
      />,
    )
    const section = screen.getByRole('region', { name: 'Paid in three steps' })
    expect(section).toHaveClass('mine')
    expect(within(section).getByRole('list', { name: 'Getting paid' })).toBeInTheDocument()
    expect(within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Send the invoice',
      'Remind on the due date',
      'Match the payment',
    ])
    expect(screen.getByRole('button', { name: 'Remind on the due date (2/3)' })).toBeInTheDocument()
    expect(pictures(container)).toHaveLength(1)
    const link = screen.getByRole('link', { name: 'Send your first invoice' })
    expect(link).toHaveAttribute('href', '/invoices/new')
    expect(link).toHaveAttribute('data-router')
    await user.click(link)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('cta null hides the call to action; headingLevel sets the heading', () => {
    reduced(<FeatureSteps cta={null} headingLevel={3} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'From repository to production in four steps' })).toBeInTheDocument()
  })
})
