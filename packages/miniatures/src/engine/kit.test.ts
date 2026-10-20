import { describe, expect, it } from 'vitest'
import { createKit } from './kit'

function kitEngine() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const drawing = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  svg.append(drawing)
  let root: Element = drawing
  return { svg, drawing, kit: createKit(svg, () => root), into: (g: Element) => (root = g) }
}

describe('the kit', () => {
  it('draws into whatever group the figure points it at', () => {
    const { kit, into, drawing } = kitEngine()
    const g = kit.group('')
    into(g)
    kit.rect(g, 0, 0, 1, 1)
    kit.box(0, 0, 0, 1, 1, 1)
    expect(drawing.children).toHaveLength(1)
    expect(g.children).toHaveLength(2)
  })
})
