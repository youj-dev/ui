'use client'

import { Rating } from '@youj/react'

const PRODUCTS = [
  { name: 'Linen overshirt', rating: 4.5, reviews: 128 },
  { name: 'Merino crew', rating: 4, reviews: 86 },
  { name: 'Canvas tote', rating: 3.5, reviews: 41 },
]

export default function RatingReadOnly() {
  return (
    <ul className="flex w-full max-w-xs flex-col divide-y divide-line">
      {PRODUCTS.map((product) => (
        <li key={product.name} className="flex items-center justify-between gap-3 py-2.5">
          <span className="text-ui">{product.name}</span>
          <span className="flex items-center gap-2">
            <Rating readOnly value={product.rating} allowHalf size="sm" />
            <span className="text-ui-sm text-fg-muted tabular-nums">({product.reviews})</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
