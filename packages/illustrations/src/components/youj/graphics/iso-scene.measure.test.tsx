import { act } from '@testing-library/react'
import { renderReduced } from '@youj/core/test-utils'
import { IsoBox } from './iso-box'
import { IsoScene } from './iso-scene'
import { IsoStack } from './iso-stack'

/* Scenes measure in a ResizeObserver's callback, after the browser's layout,
 * from one observer shared by every scene: all of them read, then all of them
 * update. Its own file, so the shared observer is built on this stub. */
const observed: Element[] = []
let deliver: ResizeObserverCallback = () => {}
beforeAll(() => {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as never
  globalThis.ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      deliver = callback
    }
    observe(el: Element) {
      observed.push(el)
    }
    unobserve() {}
    disconnect() {}
  } as never
})

test('reads nothing while mounting, then sizes every scene from one callback, reads before writes', () => {
  const read = vi.spyOn(window, 'getComputedStyle')
  const widths = vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(600)
  const { container } = renderReduced(
    <div dir="rtl">
      <IsoScene title="One" explode={1}>
        <IsoStack x={0} y={0} w={2} d={2} layers={[{ id: 'base', h: 0.5, label: 'base' }, { id: 'lid', h: 0.5, label: 'lid' }]} />
      </IsoScene>
      <IsoScene title="Two">
        <IsoBox x={0} y={0} w={1} d={1} h={1} />
      </IsoScene>
    </div>,
  )
  const svgs = [...container.querySelectorAll<SVGSVGElement>('svg[data-slot=iso-scene]')]
  expect(read.mock.calls.filter(([el]) => svgs.includes(el as SVGSVGElement))).toHaveLength(0)
  expect(observed).toEqual(expect.arrayContaining(svgs))
  const before = svgs.map((svg) => svg.getAttribute('viewBox'))
  act(() => deliver(svgs.map((target) => ({ target }) as unknown as ResizeObserverEntry), {} as ResizeObserver))
  expect(read.mock.calls.filter(([el]) => svgs.includes(el as SVGSVGElement))).toHaveLength(2)
  // Measured RTL, the rail moves to the start side: the viewBox now begins left of the drawing.
  const [x0] = before[0]!.split(' ').map(Number)
  const [x1] = svgs[0]!.getAttribute('viewBox')!.split(' ').map(Number)
  expect(x1).toBeLessThan(x0!)
  widths.mockRestore()
  read.mockRestore()
})
