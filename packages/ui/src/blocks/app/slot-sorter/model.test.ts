import { SLOTS, ITEMS } from './data'
import { moveItem, splitCounts } from './model'

describe('slot sorter model', () => {
  test('counts are the slots’ own until an item is moved', () => {
    expect(splitCounts(SLOTS, ITEMS, {})).toEqual({ vip: 14, 'needs-you': 6, fyi: 31, receipts: 12 })
  })

  test('moving an item takes one from its slot and gives one to the other', () => {
    const next = moveItem(SLOTS, ITEMS, {}, 'dana', 'needs-you')
    expect(next).toEqual({ dana: 'needs-you' })
    expect(splitCounts(SLOTS, ITEMS, next)).toEqual({ vip: 14, 'needs-you': 7, fyi: 30, receipts: 12 })
  })

  test('moving it back restores the counts', () => {
    const away = moveItem(SLOTS, ITEMS, {}, 'dana', 'vip')
    const back = moveItem(SLOTS, ITEMS, away, 'dana', 'fyi')
    expect(splitCounts(SLOTS, ITEMS, back)).toEqual(splitCounts(SLOTS, ITEMS, {}))
  })

  test('a slot that is off takes nothing, and neither does one that does not exist', () => {
    const none = {}
    expect(moveItem(SLOTS, ITEMS, none, 'dana', 'receipts')).toBe(none)
    expect(moveItem(SLOTS, ITEMS, none, 'dana', 'nowhere')).toBe(none)
    expect(moveItem(SLOTS, ITEMS, none, 'ghost', 'vip')).toBe(none)
  })

  test('dropping an item on the slot it is in changes nothing', () => {
    const none = {}
    expect(moveItem(SLOTS, ITEMS, none, 'dana', 'fyi')).toBe(none)
  })
})
