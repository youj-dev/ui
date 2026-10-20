import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

function Faq(props: Partial<Parameters<typeof Accordion>[0]>) {
  return (
    <Accordion {...props}>
      <AccordionItem value="seats">
        <AccordionTrigger>What counts as a seat?</AccordionTrigger>
        <AccordionContent>Anyone who can sign in.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="plans">
        <AccordionTrigger>Can I change plans?</AccordionTrigger>
        <AccordionContent>Yes, at any time.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="legacy" disabled>
        <AccordionTrigger>Legacy plans</AccordionTrigger>
        <AccordionContent>Retired.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

const trigger = (name: string) => screen.getByRole('button', { name })
const chevron = (name: string) => trigger(name).querySelector('[data-icon=chevron-down]')

describe('Accordion', () => {
  test('triggers are heading buttons wired to labelled regions', async () => {
    const user = userEvent.setup()
    render(<Faq />)
    const seats = trigger('What counts as a seat?')
    expect(seats.closest('h3')).not.toBeNull()
    expect(seats).toHaveAttribute('aria-expanded', 'false')

    await user.click(seats)
    expect(seats).toHaveAttribute('aria-expanded', 'true')
    const region = screen.getByRole('region', { name: 'What counts as a seat?' })
    expect(region).toHaveTextContent('Anyone who can sign in.')
    expect(seats).toHaveAttribute('aria-controls', region.id)
  })

  test('headingLevel sets the heading around the trigger', () => {
    render(
      <Accordion>
        <AccordionItem value="details">
          <AccordionTrigger headingLevel={2}>Details</AccordionTrigger>
          <AccordionContent>Oak and felt.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Details' })).toContainElement(trigger('Details'))
  })

  test('keyboard: Tab moves between triggers, Enter and Space toggle', async () => {
    const user = userEvent.setup()
    render(<Faq />)
    await user.tab()
    expect(trigger('What counts as a seat?')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(trigger('What counts as a seat?')).toHaveAttribute('aria-expanded', 'true')

    await user.tab()
    expect(trigger('Can I change plans?')).toHaveFocus()
    await user.keyboard(' ')
    expect(trigger('Can I change plans?')).toHaveAttribute('aria-expanded', 'true')
    // Single mode: opening one closes the other.
    expect(trigger('What counts as a seat?')).toHaveAttribute('aria-expanded', 'false')
  })

  test('multiple keeps several open', async () => {
    const user = userEvent.setup()
    render(<Faq multiple />)
    await user.click(trigger('What counts as a seat?'))
    await user.click(trigger('Can I change plans?'))
    expect(trigger('What counts as a seat?')).toHaveAttribute('aria-expanded', 'true')
    expect(trigger('Can I change plans?')).toHaveAttribute('aria-expanded', 'true')
  })

  test('a disabled item does not open', async () => {
    const user = userEvent.setup()
    render(<Faq />)
    await user.click(trigger('Legacy plans'))
    expect(trigger('Legacy plans')).toHaveAttribute('aria-expanded', 'false')
  })

  test('the chevron is decorative and turns with the item', async () => {
    const user = userEvent.setup()
    render(<Faq defaultValue={['plans']} />)
    // Mounted in its real state, not turned over on first paint.
    expect(chevron('Can I change plans?')).toHaveAttribute('data-state', 'active')
    expect(chevron('What counts as a seat?')).toHaveAttribute('data-state', 'rest')
    expect(chevron('What counts as a seat?')).toHaveAttribute('aria-hidden', 'true')

    await user.click(trigger('What counts as a seat?'))
    await waitFor(() => expect(chevron('What counts as a seat?')).toHaveAttribute('data-state', 'active'))
    await waitFor(() => expect(chevron('Can I change plans?')).toHaveAttribute('data-state', 'rest'))
  })

  test('panels use the yj-collapse preset and still toggle under reduced motion', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <Faq />
      </YoujProvider>,
    )
    await user.click(trigger('What counts as a seat?'))
    const region = screen.getByRole('region', { name: 'What counts as a seat?' })
    expect(region).toHaveClass('yj-collapse')
    await waitFor(() => expect(chevron('What counts as a seat?')).toHaveAttribute('data-state', 'active'))
  })

  test('opening content settles in from 6px up out of a slight blur, timed by tokens that stop under reduced motion', async () => {
    const user = userEvent.setup()
    render(<Faq />)
    await user.click(trigger('Can I change plans?'))
    const region = screen.getByRole('region', { name: 'Can I change plans?' })
    const content = region.firstElementChild!
    expect(region).toHaveClass('group/accordion-panel')
    expect(content).toHaveClass('group-data-starting-style/accordion-panel:-translate-y-1.5', 'group-data-starting-style/accordion-panel:blur-[2px]')
    // Every duration is a token × --yj-motion: the rise on the CSS spring, the blur on the fast tween.
    const transition = content.className.match(/\[transition:([^\]]+)\]/)![1]!
    expect(transition).toContain('translate_calc(var(--yj-duration-spring)*var(--yj-motion,1))_var(--ease-spring)')
    expect(transition).toContain('filter_calc(var(--yj-duration-fast)*var(--yj-motion,1))')
  })
})
