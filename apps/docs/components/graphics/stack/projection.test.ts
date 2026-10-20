import { footprint, planeZ, project, REST, rigTransform, smoothstep, type StackPose } from './projection'

const flat: StackPose = { tiltX: 0, tiltZ: 0, gap: 100, perspective: 1000 }
const close = (a: readonly number[], b: readonly number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 6))

describe('the stack camera', () => {
  it('leaves an assembled stack untouched', () => {
    const pose: StackPose = { tiltX: 58, tiltZ: -26, gap: 150, perspective: 2400 }
    close(project(pose, REST, [120, -40, 0]), [120, -40])
    expect(rigTransform(pose, REST)).toBe('translate3d(0px, 0px, 0) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateX(0deg) rotateZ(0deg)')
  })

  it('turns clockwise on screen for a positive rotateZ, as CSS does (y points down)', () => {
    close(project({ ...flat, tiltZ: 90 }, { ...REST, e: 1 }, [10, 0, 0]), [0, 10])
  })

  it('tips the top edge away for a positive rotateX, so it foreshortens toward the center', () => {
    const [, y] = project({ ...flat, tiltX: 60 }, { ...REST, e: 1 }, [0, -100, 0])
    expect(y).toBeGreaterThan(-100)
    expect(y).toBeLessThan(0)
  })

  it('magnifies what comes toward the viewer, by the perspective distance', () => {
    close(project(flat, { ...REST, e: 1 }, [100, 0, 500]), [200, 0])
  })

  it('applies scale and shift inside the perspective, like the rig transform', () => {
    close(project(flat, { ...REST, e: 1, scale: 0.5, shiftX: 30, shiftY: -10 }, [100, 40, 0]), [80, 10])
  })

  it('spreads planes about the middle of the stack, in proportion to the separation', () => {
    expect([0, 1, 2, 3].map((i) => planeZ(i, 4, flat, 1))).toEqual([-150, -50, 50, 150])
    expect(planeZ(3, 4, flat, 0.5)).toBe(75)
    expect(planeZ(2, 4, flat, 0)).toBe(0)
  })

  it('measures the separated footprint, bleed included', () => {
    const box = footprint(flat, 1, 200, 100, 10)
    expect(box).toEqual({ minX: -110, maxX: 110, minY: -60, maxY: 60 })
  })

  it('takes a bleed that reaches further below the planes than above them (a floor plate past the card)', () => {
    const box = footprint(flat, 1, 200, 100, { x: 10, top: 5, bottom: 40 })
    expect(box).toEqual({ minX: -110, maxX: 110, minY: -55, maxY: 90 })
  })

  it('eases between its edges and holds outside them', () => {
    expect(smoothstep(0.2, 0.6, 0)).toBe(0)
    expect(smoothstep(0.2, 0.6, 0.4)).toBeCloseTo(0.5)
    expect(smoothstep(0.2, 0.6, 1)).toBe(1)
  })
})
