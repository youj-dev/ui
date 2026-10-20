import { render } from '@testing-library/react'
import { LoaderCue } from './signal/cue'

/* Sizes are the shared scale: sm | default | lg (or px). */

const px = (container: HTMLElement) => (container.querySelector('[style*="--yj-anim-size"]') as HTMLElement).style.getPropertyValue('--yj-anim-size')

test('the middle size is `default`, and it is the default', () => {
  const none = render(<LoaderCue />)
  const named = render(<LoaderCue size="default" />)
  expect(px(named.container)).toBe(px(none.container))
  expect(px(named.container)).not.toBe(px(render(<LoaderCue size="sm" />).container))
})

