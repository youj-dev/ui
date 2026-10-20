'use client'

import { DistributionStrip } from '@youj/react'

/** Search latencies in ms: a fast body and a long tail of cold queries, from a fixed seed. */
function sampleLatencies(count: number, seed: number) {
  let t = seed
  const random = () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
  const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
  return Array.from({ length: count }, () => {
    const cold = random() < 0.08
    return Math.exp(Math.log(cold ? 260 : 24) + normal() * (cold ? 0.6 : 0.5))
  })
}

const SEARCH = sampleLatencies(360, 5)

export default function DistributionStripPercentiles() {
  // No objective: the dots stay in the neutral ink and the header has no share.
  return <DistributionStrip samples={SEARCH} percentiles={[75, 95, 99.9]} label="search-api · p75, p95, p99.9" className="w-full max-w-2xl" />
}
