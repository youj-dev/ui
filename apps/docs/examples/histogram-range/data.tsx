'use client'

import { useState } from 'react'
import { HistogramRange, SegmentedControl, SegmentedControlItem } from '@youj/react'

/** Nightly prices, as raw values: HistogramRange counts them into bins. */
function prices(seed: number, median: number) {
  let s = seed
  const random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  return Array.from({ length: 1500 }, () => Math.round(median * Math.exp(0.5 * (random() + random() + random() + random() - 2) * Math.sqrt(3))))
}

const CITIES = { Lisbon: prices(7, 110), Paris: prices(11, 190), Kyoto: prices(3, 150) }
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function HistogramRangeData() {
  const [city, setCity] = useState<keyof typeof CITIES>('Lisbon')

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <SegmentedControl value={city} onValueChange={(value) => setCity(value as keyof typeof CITIES)} aria-label="City">
        {Object.keys(CITIES).map((name) => (
          <SegmentedControlItem key={name} value={name}>
            {name}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      {/* New data glides the bars to their new heights; the range stays where you left it. */}
      <HistogramRange
        label="Price per night"
        data={CITIES[city]}
        binCount={36}
        min={0}
        max={450}
        step={5}
        defaultValue={[80, 260]}
        format={usd.format}
        ticks={[0, 150, 300, 450]}
      />
    </div>
  )
}
