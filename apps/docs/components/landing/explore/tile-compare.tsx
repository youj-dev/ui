'use client'

import { IllustrationPadlock } from '@youj/illustrations'
import { ImageCompare } from '@youj/react'
import { Demo } from './demo'

/** One scene twice: the kit's gray before, the theme's hues after. */
function Scene({ color }: { color?: boolean }) {
  return (
    <div className="grid size-full place-items-center bg-surface [&_svg]:h-4/5 [&_svg]:w-auto">
      <IllustrationPadlock unit={16} float={false} title="A padlock" {...(color ? { colors: 'theme' as const } : {})} />
    </div>
  )
}

/** The same padlock in gray and in the theme's colors: drag the divider across. */
export default function CompareTile() {
  return (
    <Demo>
      <div className="w-full max-w-72 xl:max-w-sm">
        <ImageCompare before={<Scene />} after={<Scene color />} beforeLabel="Mono" afterLabel="Theme" className="aspect-[16/9]" />
      </div>
    </Demo>
  )
}
