'use client'

import { ParticleConstellation } from '@youj/motion/backgrounds'

export default function ParticleConstellationSignals() {
  return (
    <div className="relative isolate mx-auto h-[280px] w-full max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-line bg-canvas sm:max-w-[calc(100%-4rem)]">
      <ParticleConstellation signals density={1.6} linkDistance={110} interactive={false} />
    </div>
  )
}
