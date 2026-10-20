'use client'

import { LoaderBuild } from '@youj/loaders/build'
import { LoaderInscribe } from '@youj/loaders/inscribe'
import { LoaderSustain } from '@youj/loaders/sustain'
import { LoaderTittle } from '@youj/loaders/tittle'

/* Four of the set, one from each corner of it, each a polite status with its
 * label shown under it and moving in time with its loop: the youj o in depth,
 * a field of waveforms, the wordmark inscribing itself (its label typed) and
 * a build going through its stages. Solid planes paint over --yj-anim-paper,
 * set here to the canvas they sit on. */

export default function AnimationsDemo() {
  return (
    <div className="grid gap-x-16 gap-y-8 p-6 text-sm [--yj-anim-paper:var(--color-canvas)] sm:grid-cols-2 sm:p-8">
      <LoaderTittle size="lg" label="Loading" showLabel />
      <LoaderSustain size="lg" label="Listening" showLabel />
      <LoaderInscribe size="lg" label="Writing" showLabel labelEffect="type" />
      <LoaderBuild size="lg" label="Building" showLabel />
    </div>
  )
}
