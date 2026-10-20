import { fireEvent, screen } from '@testing-library/react'
import { Magnetic, MagneticInner } from './magnetic'
import { Tilt } from './tilt'
import { installObservers, renderFull, renderReduced } from '@youj/core/test-utils'

beforeAll(installObservers)
afterEach(() => vi.restoreAllMocks())

const finePointer = () =>
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (q) => ({ matches: q.includes('pointer: fine'), addEventListener() {}, removeEventListener() {} }) as never,
  )

test('Magnetic removes its window listeners on unmount', () => {
  finePointer()
  const add = vi.spyOn(window, 'addEventListener')
  const remove = vi.spyOn(window, 'removeEventListener')
  const { unmount } = renderFull(
    <Magnetic>
      <button>
        <MagneticInner>Start</MagneticInner>
      </button>
    </Magnetic>,
  )
  expect(add).toHaveBeenCalledWith('pointermove', expect.any(Function), { passive: true })
  unmount()
  expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function))
})

test('Magnetic ignores the pointer with reduced motion', () => {
  finePointer()
  const add = vi.spyOn(window, 'addEventListener')
  renderReduced(
    <Magnetic>
      <button>Start</button>
    </Magnetic>,
  )
  expect(add).not.toHaveBeenCalledWith('pointermove', expect.anything(), expect.anything())
  expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
})

test('Tilt renders flat, without glare, when reduced', () => {
  const { container } = renderReduced(
    <Tilt glare data-testid="t">
      Card
    </Tilt>,
  )
  const inner = screen.getByTestId('t').firstElementChild as HTMLElement
  fireEvent.pointerMove(screen.getByTestId('t'), { clientX: 10, clientY: 10, pointerType: 'mouse' })
  expect(inner.style.transform === '' || inner.style.transform === 'none').toBe(true)
  expect(container.querySelector('[aria-hidden]')).toBeNull()
})
