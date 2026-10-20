import { act, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { sceneEntries } from './catalog'
import { SceneStill, stillMarkup } from './scene-frame'

/* A thumbnail's still frame: drawn live once, in its turn, then kept as markup, with nothing live under it. */

const scene = sceneEntries().find((s) => s.id === 'mail')!
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)))

test('draws a scene once in its turn, keeps it as markup, and draws the markup from then on', async () => {
  const first = render(
    <YoujProvider reducedMotion="always">
      <SceneStill scene={scene} />
    </YoujProvider>,
  )
  // Its turn hasn't come yet: a well the drawing's shape, empty.
  expect(first.container.querySelector('svg')).toBeNull()
  await act(frame)
  const kept = stillMarkup('mail')
  expect(kept).toMatch(/^<svg[^>]*data-slot="iso-scene"/)
  expect(first.container.querySelector('svg')?.outerHTML).toBe(kept)
  first.unmount()
  // Kept: the next one is the markup at once, with no turn to wait for.
  const again = render(<SceneStill scene={scene} />)
  expect(again.container.querySelector('svg')?.outerHTML).toBe(kept)
})
