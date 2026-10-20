/** The least-squares line through values taken at 0, 1, 2…: its slope per step, where it starts, and the line's value at every step. */
export function linearTrend(values: readonly number[]) {
  const n = values.length
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, fitted: [...values] }
  const meanX = (n - 1) / 2
  const meanY = values.reduce((sum, v) => sum + v, 0) / n
  let covariance = 0
  let variance = 0
  values.forEach((v, x) => {
    covariance += (x - meanX) * (v - meanY)
    variance += (x - meanX) ** 2
  })
  const slope = covariance / variance
  const intercept = meanY - slope * meanX
  return { slope, intercept, fitted: values.map((_, x) => intercept + slope * x) }
}

/** Adds up every `size` values: twelve months become four quarters. */
export function sumEvery(values: readonly number[], size: number) {
  const sums: number[] = []
  for (let i = 0; i < values.length; i += size) sums.push(values.slice(i, i + size).reduce((sum, v) => sum + v, 0))
  return sums
}
