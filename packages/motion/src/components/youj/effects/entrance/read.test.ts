import { read } from './read'

/* jsdom has no layout: each element's box is given by hand, by its id. */

const boxes: Record<string, [number, number, number, number]> = {
  demo: [0, 0, 400, 300],
  wrap: [10, 10, 0, 0],
  plot: [10, 10, 380, 200],
}

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const [x, y, w, h] = boxes[this.id] ?? [0, 0, 0, 0]
    return { x, y, left: x, top: y, width: w, height: h, right: x + w, bottom: y + h, toJSON() {} } as DOMRect
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

test('reads through a box of no size whose content overflows it, as a responsive chart is wrapped', () => {
  document.body.innerHTML = '<div id="demo"><div id="wrap"><svg id="plot"><path d="M0 0L10 10" stroke="black"></path></svg></div></div>'
  const node = document.getElementById('demo')!
  const plan = read(node, document.body)
  expect(plan.parts.map((p) => p.kind)).toEqual(['chart'])
})

test('leaves out what a box of no size clips away', () => {
  document.body.innerHTML = '<div id="demo"><div id="wrap" style="overflow:hidden"><svg id="plot"></svg></div></div>'
  const plan = read(document.getElementById('demo')!, document.body)
  expect(plan.parts).toHaveLength(0)
})
