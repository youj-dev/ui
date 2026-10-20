import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AnnotatedImage, type ImageAnnotation } from './annotated-image'

const NOTES: ImageAnnotation[] = [
  { id: 'reefer', x: 70, y: 30, title: 'Reefer unit', detail: '34.1°F' },
  { id: 'load', x: 30, y: 45, title: 'Load', detail: '14 of 26 pallets' },
  { id: 'axles', x: 20, y: 80, title: 'Axles', side: 'right' },
]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('AnnotatedImage', () => {
  test('numbers each callout and describes it by its label, in an ordered list', () => {
    reduced(<AnnotatedImage src="truck.png" alt="A refrigerated truck" annotations={NOTES} caption="Unit TR-5531" />)
    expect(screen.getByRole('img', { name: 'A refrigerated truck' })).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Annotations' })
    expect(list.tagName).toBe('OL')
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['1Reefer unit, 34.1°F', '2Load, 14 of 26 pallets', '3Axles'])
    const callouts = screen.getAllByRole('button')
    expect(callouts.map((b) => b.textContent)).toEqual(['1', '2', '3'])
    expect(callouts[1]).toHaveAccessibleDescription(/^Load,\s*14 of 26 pallets$/)
    expect(screen.getByText('Unit TR-5531').tagName).toBe('FIGCAPTION')
  })

  test('puts each label on its point’s side unless it names one', () => {
    reduced(<AnnotatedImage annotations={NOTES} media={<div />} />)
    expect([...document.querySelectorAll('[data-slot=annotated-image-label]')].map((el) => el.getAttribute('data-side'))).toEqual(['right', 'left', 'right'])
  })

  test('callouts are keyboard reachable, light their pair on focus and pin on press', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<AnnotatedImage annotations={NOTES} media={<div />} onValueChange={onValueChange} />)
    await user.tab()
    const first = screen.getAllByRole('button')[0]!
    expect(first).toHaveFocus()
    expect(first).toHaveAttribute('data-active')
    expect(document.querySelector('[data-slot=annotated-image-label][data-active]')).toHaveTextContent('Reefer unit')
    await user.keyboard('{Enter}')
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(onValueChange).toHaveBeenLastCalledWith('reefer')
    await user.tab()
    expect(screen.getAllByRole('button')[1]).toHaveFocus()
    // The pin holds while focus moves on; pressing it again lets go.
    await user.click(first)
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  test('a controlled value lights its pair', () => {
    reduced(<AnnotatedImage annotations={NOTES} media={<div />} value="load" />)
    expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('[data-slot=annotated-image-label][data-active]')).toHaveTextContent('Load')
  })

  test('without room for gutters (as in a test DOM, which has no layout) the labels stay a list and no lines are drawn', () => {
    reduced(<AnnotatedImage annotations={NOTES} media={<div />} />)
    expect(document.querySelector('[data-slot=annotated-image-stage]')).toHaveAttribute('data-layout', 'stacked')
    expect(document.querySelector('[data-slot=annotated-image-lines]')).toBeNull()
  })
})
