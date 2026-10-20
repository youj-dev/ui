'use client'

import { ShareRing } from '@youj/react'

// A bowl's calories by where they come from: `value` sizes each part (kcal),
// `amount` is what the legend shows (grams).
const MACROS = [
  { id: 'protein', label: 'Protein', value: 152, amount: 38 },
  { id: 'carbs', label: 'Carbs', value: 256, amount: 64 },
  { id: 'fat', label: 'Fat', value: 198, amount: 22 },
]

export default function ShareRingDemo() {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6">
      <ShareRing size="lg" segments={MACROS} unit="kcal" amountFormat={{ style: 'unit', unit: 'gram', unitDisplay: 'short' }} />
    </div>
  )
}
