'use client'

import { LoaderBuild } from '@youj/loaders/build'
import { LoaderSustain } from '@youj/loaders/sustain'
import { LoaderTittle } from '@youj/loaders/tittle'

/* Waits that say more than one thing: each animation turns through its
 * labels, the next taking over at the loop's seam (the second label of the
 * last after two loops), each change carried by its effect. The status says
 * the first, and only now and then a later one. */

export default function RotatingLabels() {
  return (
    <div className="grid gap-x-12 gap-y-8 p-6 text-sm [--yj-anim-paper:var(--color-canvas)] sm:grid-cols-3 sm:p-8">
      <LoaderBuild size="lg" label={['Building', 'Bundling', 'Optimizing images', 'Deploying']} showLabel labelEffect="slide" />
      <LoaderSustain size="lg" label={['Listening', 'Transcribing', 'Summarizing']} showLabel labelEffect="scramble" />
      <LoaderTittle size="lg" label={['Loading', 'Generating results', 'Almost there']} labelEvery={2} showLabel labelEffect="wave" />
    </div>
  )
}
