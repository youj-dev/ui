'use client'

import { Illustration, LineGrid } from '@youj/illustrations'

/* One scene by id, named for assistive tech. It assembles as it scrolls
 * into view and the rocket bobs over its pad; hover it and it lifts off. */

export default function IllustrationsDemo() {
  return (
    <div className="relative isolate mx-auto w-fit max-w-full p-6 sm:p-8">
      <LineGrid gap={20} />
      <Illustration scene="deploy" explode="hover" unit={28} title="A rocket hovering over its launch pad" />
    </div>
  )
}
