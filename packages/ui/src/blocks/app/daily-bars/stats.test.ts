import { changeBetween, dayStats, placeAcross, tickIndexes, wrapWords } from './stats'

describe('Daily bars stats', () => {
  test('reads the total, average, busiest and quietest day from the readings', () => {
    expect(dayStats([4, 9, 2, 9, 6])).toEqual({ total: 30, average: 6, top: 1, quietest: 2 })
    expect(dayStats([])).toBeUndefined()
  })

  test('the change is a fraction of the period before, and absent without one', () => {
    expect(changeBetween(112, 100)).toBeCloseTo(0.12)
    expect(changeBetween(80, 100)).toBeCloseTo(-0.2)
    expect(changeBetween(50, 0)).toBeUndefined()
    expect(changeBetween(50, undefined)).toBeUndefined()
  })

  test('wraps a note on word boundaries and ends it with an ellipsis when it would need more lines', () => {
    expect(wrapWords('one post on the front page', 12, 3)).toEqual(['one post on', 'the front', 'page'])
    expect(wrapWords('one post on the front page', 12, 2)).toEqual(['one post on', 'the front p…'])
    expect(wrapWords('short', 12, 2)).toEqual(['short'])
  })

  test('callouts keep their centres where they fit, and give way to each other where they would touch', () => {
    expect(placeAcross([100, 300], [60, 60], 400, 10)).toEqual([70, 270])
    // Pressed against the end, one pushes the other back.
    expect(placeAcross([380, 390], [60, 60], 400, 10)).toEqual([270, 340])
    // Clamped inside the plot at the start.
    expect(placeAcross([10], [60], 400, 10)).toEqual([0])
    // Too wide to sit side by side at all.
    expect(placeAcross([50, 60, 70], [120, 120, 120], 300, 10)).toBeUndefined()
  })

  test('ticks fall on calendar-friendly steps that keep 56px between them', () => {
    expect(tickIndexes(30, 16)).toEqual([0, 7, 14, 21, 28])
    expect(tickIndexes(7, 80)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})
