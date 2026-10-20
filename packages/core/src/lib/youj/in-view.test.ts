import { resolveInView } from './in-view'

describe('resolveInView', () => {
  test('waits for the viewport, once, at the component’s own amount, by default', () => {
    expect(resolveInView(undefined, { amount: 0.3 })).toEqual({ onView: true, once: true, amount: 0.3, margin: undefined })
  })

  test('false plays on mount; true and options play in view', () => {
    expect(resolveInView(false, { amount: 0.3 }).onView).toBe(false)
    expect(resolveInView(true, { amount: 0.3 }).onView).toBe(true)
    expect(resolveInView({ once: false, amount: 'all', margin: '10px' }, { amount: 0.3 })).toEqual({ onView: true, once: false, amount: 'all', margin: '10px' })
  })
})
