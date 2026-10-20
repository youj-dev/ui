import { render } from '@testing-library/react'
import { KindStage } from './kind-stage'

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect

describe('KindStage', () => {
  it('centers a card laid out at its stage’s start edge, as its thumbnail shows it', () => {
    // The stage is 1000 wide and 600 tall; the card sits at the left of a full-width wrapper.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const own = this as HTMLElement
      if (own.hasAttribute('data-kind-stage')) return rect(0, 0, 1000, 600)
      if (own.hasAttribute('data-kind-root')) return rect(40 + Number.parseFloat(own.style.left || '0'), 40, 920, 520)
      if (own.dataset.testid === 'wrapper') return rect(40 + Number.parseFloat(own.closest<HTMLElement>('[data-kind-root]')!.style.left || '0'), 40, 920, 520)
      return rect(40 + Number.parseFloat(own.closest<HTMLElement>('[data-kind-root]')!.style.left || '0'), 40, 200, 100)
    })
    const { getByTestId } = render(
      <KindStage framing="card">
        <div data-testid="wrapper">
          <button data-testid="item">Save</button>
        </div>
      </KindStage>,
    )
    const root = getByTestId('item').closest<HTMLElement>('[data-kind-root]')!
    // Its box is 200 wide at x=40: moved right to the stage's middle (400..600), and down to 250..350.
    expect(root.style.left).toBe('360px')
    expect(root.style.top).toBe('210px')
    vi.restoreAllMocks()
  })
})
