import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { ImageAccordion, type ImageAccordionItem, type ImageAccordionProps } from './image-accordion'

const ITEMS: ImageAccordionItem[] = [
  { id: 'dunes', media: { src: '/dunes.jpg', alt: 'Dunes at dusk' }, title: 'Dunes', description: 'Wind-cut ridges at dusk' },
  { id: 'reef', media: <div data-testid="reef-media" />, title: 'Reef', description: 'Shallow water, noon' },
  { id: 'pines', media: <div />, title: 'Pines' },
]

const view = (props: Partial<ImageAccordionProps> = {}) =>
  render(
    <YoujProvider reducedMotion="always">
      <ImageAccordion items={ITEMS} {...props} />
    </YoujProvider>,
  )

// A panel's name is its title, then the line it shows with it.
const panel = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}\\b`) })

describe('ImageAccordion', () => {
  test('is a named group of panels with the first open, each named by its title and its line', () => {
    view()
    const group = screen.getByRole('group', { name: 'Gallery' })
    expect(group).toHaveAttribute('data-slot', 'image-accordion')
    expect(group).toHaveAttribute('data-orientation', 'horizontal')
    expect(group).toHaveAttribute('data-yj-activation', 'hover')
    expect(panel('Dunes')).toHaveAttribute('aria-current', 'true')
    expect(panel('Dunes')).toHaveAttribute('data-state', 'active')
    expect(panel('Reef')).toHaveAttribute('data-state', 'inactive')
    expect(panel('Dunes')).toHaveAccessibleName('Dunes Wind-cut ridges at dusk')
    expect(panel('Pines')).not.toHaveAttribute('aria-describedby')
    expect(screen.getByRole('img', { name: 'Dunes at dusk' })).toHaveAttribute('src', '/dunes.jpg')
    expect(screen.getByTestId('reef-media')).toBeInTheDocument()
  })

  test('the open panel grows while the strips share the rest, so the box keeps its size', () => {
    view()
    expect(panel('Dunes').style.flexGrow).toBe('3')
    expect(panel('Reef').style.flexGrow).toBe('1')
    fireEvent.click(panel('Reef'))
    expect(panel('Reef').style.flexGrow).toBe('3')
    expect(panel('Dunes').style.flexGrow).toBe('1')
    expect(screen.getByRole('group').className).toContain('own:h-80')
  })

  test('hover mode opens on pointer hover and on focus, but not on a touch pass', () => {
    const onValueChange = vi.fn()
    view({ onValueChange })
    fireEvent.pointerEnter(panel('Reef'), { pointerType: 'mouse' })
    expect(onValueChange).toHaveBeenLastCalledWith('reef')
    fireEvent.pointerEnter(panel('Pines'), { pointerType: 'touch' })
    expect(panel('Reef')).toHaveAttribute('aria-current', 'true')
    fireEvent.click(panel('Pines'))
    expect(onValueChange).toHaveBeenLastCalledWith('pines')
    fireEvent.focus(panel('Dunes'))
    expect(onValueChange).toHaveBeenLastCalledWith('dunes')
    expect(onValueChange).toHaveBeenCalledTimes(3)
  })

  test('click mode ignores hover and focus and opens on a press, Enter or Space', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    view({ activation: 'click', onValueChange })
    fireEvent.pointerEnter(panel('Reef'), { pointerType: 'mouse' })
    await user.tab()
    expect(panel('Dunes')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(panel('Reef')).toHaveFocus()
    expect(onValueChange).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith('reef')
    await user.keyboard('{ArrowRight}{ }')
    expect(onValueChange).toHaveBeenLastCalledWith('pines')
  })

  test('one tab stop; arrows wrap, Home and End jump, and focus opens in hover mode', async () => {
    const user = userEvent.setup()
    view()
    expect(screen.getAllByRole('button').map((b) => b.tabIndex)).toEqual([0, -1, -1])
    await user.tab()
    await user.keyboard('{ArrowLeft}')
    expect(panel('Pines')).toHaveFocus()
    expect(panel('Pines')).toHaveAttribute('aria-current', 'true')
    await user.keyboard('{Home}')
    expect(panel('Dunes')).toHaveFocus()
    await user.keyboard('{End}')
    expect(panel('Pines')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(panel('Dunes')).toHaveAttribute('aria-current', 'true')
  })

  test('vertical panels move with Up and Down; RTL mirrors Left and Right', async () => {
    const user = userEvent.setup()
    const { unmount } = view({ orientation: 'vertical' })
    expect(screen.getByRole('group')).toHaveAttribute('data-orientation', 'vertical')
    await user.tab()
    await user.keyboard('{ArrowDown}')
    expect(panel('Reef')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(panel('Reef')).toHaveFocus()
    unmount()
    render(
      <YoujProvider reducedMotion="always" dir="rtl">
        <ImageAccordion items={ITEMS} />
      </YoujProvider>,
    )
    await user.tab()
    await user.keyboard('{ArrowLeft}')
    expect(panel('Reef')).toHaveFocus()
  })

  test('follows a controlled value', () => {
    function Controlled() {
      const [value, setValue] = useState('pines')
      return (
        <YoujProvider reducedMotion="always">
          <ImageAccordion items={ITEMS} value={value} onValueChange={setValue} activation="click" />
          <button type="button" onClick={() => setValue('reef')}>
            show reef
          </button>
        </YoujProvider>
      )
    }
    render(<Controlled />)
    expect(panel('Pines')).toHaveAttribute('aria-current', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'show reef' }))
    expect(panel('Reef')).toHaveAttribute('aria-current', 'true')
  })

  test('a press or key plays select, hover stays silent, and sound={false} keeps it quiet', () => {
    const sink = vi.fn()
    const { rerender } = render(
      <SoundCueContext.Provider value={sink}>
        <ImageAccordion items={ITEMS} />
      </SoundCueContext.Provider>,
    )
    fireEvent.pointerEnter(panel('Reef'), { pointerType: 'mouse' })
    expect(sink).not.toHaveBeenCalled()
    fireEvent.click(panel('Pines'))
    expect(sink).toHaveBeenCalledWith('select', false)
    sink.mockClear()
    rerender(
      <SoundCueContext.Provider value={sink}>
        <ImageAccordion items={ITEMS} sound={false} />
      </SoundCueContext.Provider>,
    )
    fireEvent.click(panel('Dunes'))
    expect(sink).not.toHaveBeenCalled()
  })

  test('takes its name from the language pack', () => {
    render(
      <YoujProvider reducedMotion="always" labels={de} locale="de">
        <ImageAccordion items={ITEMS} />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Galerie' })).toBeInTheDocument()
  })
})
