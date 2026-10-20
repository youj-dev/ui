'use client'

import { LoaderGantry } from '@youj/loaders/gantry'
import { LoaderPrompt } from '@youj/loaders/prompt'
import { LoaderTabstop } from '@youj/loaders/tabstop'

/* Loaders in the theme's colors: a few parts that mean something (a
 * prompt and its check, a button and a tick, a machine and its plot) in
 * the theme's roles, the accent still the brightest mark. `colors="theme"`
 * turns them on, and a list of colors sets them; without it a loader
 * keeps its two colors, the ink and the accent. */

export default function MulticolorLoaders() {
  return (
    <div className="grid gap-x-12 gap-y-8 p-6 text-sm [--yj-anim-paper:var(--color-canvas)] sm:grid-cols-3 sm:p-8">
      <LoaderPrompt size="lg" colors="theme" label="Installing" showLabel />
      <LoaderTabstop size="lg" colors="theme" label="Checking the form" showLabel />
      <LoaderGantry size="lg" colors="theme" label="Laying out" showLabel />
    </div>
  )
}
