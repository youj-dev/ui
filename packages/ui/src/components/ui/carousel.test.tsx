import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import {
  Carousel,
  CarouselAutoplayToggle,
  CarouselCaption,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselThumb,
  CarouselThumbs,
} from './carousel'

/* Embla measures offsets; jsdom has none. Give the viewport 600px and lay the
 * slides out side by side at 600px each. */
const W = 600
const descriptors = new Map<string, PropertyDescriptor | undefined>()
beforeAll(() => {
  // The thumbnail strip scrolls itself; jsdom lacks element scrolling.
  Element.prototype.scrollTo = () => {}
  const proto = HTMLElement.prototype
  for (const key of ['offsetWidth', 'offsetHeight', 'offsetLeft', 'offsetTop']) descriptors.set(key, Object.getOwnPropertyDescriptor(proto, key))
  const slideIndex = (el: HTMLElement) => (el.dataset.slot === 'carousel-item' ? [...el.parentElement!.children].indexOf(el) : -1)
  Object.defineProperty(proto, 'offsetWidth', { configurable: true, get() { return this.dataset?.slot === 'carousel-item' || this.dataset?.slot === 'carousel-content' ? W : 0 } })
  Object.defineProperty(proto, 'offsetHeight', { configurable: true, get: () => 300 })
  Object.defineProperty(proto, 'offsetLeft', { configurable: true, get() { const i = slideIndex(this); return i >= 0 ? i * W : 0 } })
  Object.defineProperty(proto, 'offsetTop', { configurable: true, get: () => 0 })
})
afterAll(() => {
  for (const [key, d] of descriptors) if (d) Object.defineProperty(HTMLElement.prototype, key, d)
})

function Gallery({ autoplay, reduced }: { autoplay?: number; reduced?: boolean }) {
  return (
    <YoujProvider reducedMotion={reduced ? 'always' : 'never'}>
      <Carousel aria-label="Photos" autoplay={autoplay}>
        <CarouselContent>
          {['Front', 'Side', 'Back'].map((name) => (
            <CarouselItem key={name}>
              {name}
              <CarouselCaption>{name} caption</CarouselCaption>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
        <CarouselDots />
        <CarouselThumbs>
          {[0, 1, 2].map((i) => (
            <CarouselThumb key={i} index={i}>
              {i}
            </CarouselThumb>
          ))}
        </CarouselThumbs>
        <CarouselAutoplayToggle />
        <input aria-label="Note" />
      </Carousel>
    </YoujProvider>
  )
}

const current = (group: string) => within(screen.getByRole('group', { name: group })).getAllByRole('button').findIndex((b) => b.hasAttribute('aria-current'))

describe('Carousel', () => {
  test('is a named carousel region of labelled slides', async () => {
    render(<Gallery />)
    const region = screen.getByRole('region', { name: 'Photos' })
    expect(region).toHaveAttribute('aria-roledescription', 'carousel')
    const slides = within(region).getAllByRole('group').filter((g) => g.getAttribute('aria-roledescription') === 'slide')
    expect(slides).toHaveLength(3)
    await waitFor(() => expect(slides[1]).toHaveAttribute('aria-label', '2 of 3'))
    await waitFor(() => expect(slides[0]).toHaveAttribute('data-active'))
  })

  test('next / previous move a slide, update the dots and announce it', async () => {
    const user = userEvent.setup()
    render(<Gallery reduced />)
    const prev = screen.getByRole('button', { name: 'Previous slide' })
    const next = screen.getByRole('button', { name: 'Next slide' })
    await waitFor(() => expect(next).not.toHaveAttribute('aria-disabled', 'true'))
    // Disabled at the ends but still focusable, so focus never falls to <body>.
    expect(prev).toHaveAttribute('aria-disabled', 'true')

    await user.click(next)
    await waitFor(() => expect(current('Choose slide')).toBe(1))
    expect(screen.getByText('Slide 2 of 3')).toHaveAttribute('aria-live', 'polite')
    expect(prev).not.toHaveAttribute('aria-disabled', 'true')

    await user.click(screen.getAllByRole('button', { name: 'Slide 3' })[0]!)
    await waitFor(() => expect(current('Choose slide')).toBe(2))
    expect(next).toHaveAttribute('aria-disabled', 'true')
  })

  test('arrow keys, Home and End navigate, but not from a text field', async () => {
    const user = userEvent.setup()
    render(<Gallery reduced />)
    const next = screen.getByRole('button', { name: 'Next slide' })
    await waitFor(() => expect(next).not.toHaveAttribute('aria-disabled', 'true'))
    next.focus()
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(current('Choose slide')).toBe(1))
    await user.keyboard('{End}')
    await waitFor(() => expect(current('Choose slide')).toBe(2))
    await user.keyboard('{Home}')
    await waitFor(() => expect(current('Choose slide')).toBe(0))

    await user.click(screen.getByRole('textbox', { name: 'Note' }))
    await user.keyboard('{ArrowRight}')
    expect(current('Choose slide')).toBe(0)
  })

  test('autoplay advances, pauses while hovered and stops from its toggle', async () => {
    const user = userEvent.setup()
    render(<Gallery autoplay={150} />)
    const region = screen.getByRole('region', { name: 'Photos' })
    const toggle = screen.getByRole('button', { name: 'Pause slide rotation' })
    // Silent while it rotates.
    expect(region.querySelector('[data-slot=carousel-status]')).toHaveAttribute('aria-live', 'off')
    await waitFor(() => expect(current('Choose slide')).toBe(1), { timeout: 3000 })

    fireEvent.pointerEnter(region)
    expect(region.querySelector('[data-slot=carousel-status]')).toHaveAttribute('aria-live', 'polite')
    const held = current('Choose slide')
    await new Promise((r) => setTimeout(r, 400))
    expect(current('Choose slide')).toBe(held)
    fireEvent.pointerLeave(region)

    await user.click(toggle)
    expect(toggle).toHaveAccessibleName('Start slide rotation')
  })

  test('autoplay never starts under reduced motion', async () => {
    render(<Gallery autoplay={100} reduced />)
    expect(screen.getByRole('button', { name: 'Start slide rotation' })).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 350))
    expect(current('Choose slide')).toBe(0)
  })

  test('without autoplay there is no rotation control', () => {
    render(<Gallery />)
    expect(screen.queryByRole('button', { name: /slide rotation/ })).not.toBeInTheDocument()
  })
})
