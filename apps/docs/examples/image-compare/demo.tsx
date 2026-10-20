'use client'

import { Illustration } from '@youj/illustrations'
import { ImageCompare } from '@youj/react'

/* One scene twice: the kit's gray before, the theme's hues after. */
function Scene({ color }: { color?: boolean }) {
  return (
    <div className="grid size-full place-items-center bg-surface py-6">
      <Illustration scene="design-tools" assemble={false} unit={16} {...(color ? { colors: 'theme' as const } : {})} />
    </div>
  )
}

export default function ImageCompareDemo() {
  return (
    <div className="w-full max-w-lg p-4">
      <ImageCompare before={<Scene />} after={<Scene color />} beforeLabel="Mono" afterLabel="Theme" className="aspect-[4/3]" />
    </div>
  )
}
