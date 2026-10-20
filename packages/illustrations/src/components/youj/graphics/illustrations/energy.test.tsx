import { waitFor } from '@testing-library/react'
import { installObservers, liveObservers, renderFull, renderReduced } from '@youj/core/test-utils'
import { IllustrationSolarPanel, IllustrationWindTurbine } from './energy'

beforeAll(installObservers)

/** The turned group's transform, as the six numbers of its matrix. */
const turn = (container: HTMLElement) => {
  const g = [...container.querySelectorAll('g')].find((el) => (el as SVGGElement).style.transform.startsWith('matrix'))!
  return (g as SVGGElement).style.transform.match(/-?[\d.e-]+/g)!.map(Number)
}

const expectRest = (matrix: number[]) => [1, 0, 0, 1, 0, 0].forEach((v, i) => expect(matrix[i]).toBeCloseTo(v, 6))

describe('energy scenes', () => {
  test('the turbine’s blades turn with motion, carried round the hub', async () => {
    const { container } = renderFull(<IllustrationWindTurbine />)
    await waitFor(() => expect(turn(container)[0]).not.toBeCloseTo(1, 3), { timeout: 3000 })
    // A turn about the hub keeps its area: the matrix's determinant stays 1.
    const [a, b, c, d] = turn(container)
    expect(a! * d! - b! * c!).toBeCloseTo(1, 4)
  })

  test('the turbine holds still under reduced motion, and when asked to', async () => {
    const reduced = renderReduced(<IllustrationWindTurbine />)
    const held = renderFull(<IllustrationWindTurbine float={false} />)
    await new Promise((resolve) => setTimeout(resolve, 300))
    expectRest(turn(reduced.container))
    expectRest(turn(held.container))
  })

  test('the solar panel rests at its tilt, and taken apart it has turned, finished and still under reduced motion', () => {
    expectRest(turn(renderReduced(<IllustrationSolarPanel />).container))
    const [a, b, c, d] = turn(renderReduced(<IllustrationSolarPanel explode={1} />).container)
    expect([a, b, c, d].some((v, i) => Math.abs(v! - [1, 0, 0, 1][i]!) > 0.05)).toBe(true)
  })

  test('stops observing and turning on unmount', () => {
    const before = liveObservers.size
    const { unmount } = renderFull(<IllustrationWindTurbine />)
    expect(liveObservers.size).toBeGreaterThan(before)
    unmount()
    expect(liveObservers.size).toBe(before)
  })
})
