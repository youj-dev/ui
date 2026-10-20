'use client'

import { AvatarUpload } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// The avatar's right margin tops every row up to the 96px column, so the buttons share one left edge.
const SIZES = [
  { size: 48, gutter: '[&>div>:first-child]:me-12' },
  { size: 96, gutter: '' },
]

export default function AvatarUploadSizes() {
  return (
    <div className="flex flex-col gap-6">
      {SIZES.map(({ size, gutter }) => (
        <AvatarUpload key={size} size={size} fallback="KL" className={gutter} onSave={() => wait(600)} />
      ))}
      <AvatarUpload disabled fallback="AL" className="[&>div>:first-child]:me-8" onSave={() => {}} />
    </div>
  )
}
