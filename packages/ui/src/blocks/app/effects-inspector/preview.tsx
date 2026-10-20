import type { CSSProperties } from 'react'
import { progressiveMask, effectsToCss, type EffectsInspectorCopy, type EffectsValue } from './data'

/* The layer being styled: a button painted from the inspector's values, and
 * the CSS those values come to, which changes as they do. A progressive blur
 * is two copies of the button, the sharp one masked away as the blurred one
 * is masked in. The stage keeps its size whatever the effects do. */

function Preview({ value, copy }: { value: EffectsValue; copy: EffectsInspectorCopy }) {
  const { css, blurred } = effectsToCss(value)
  const { filter, 'mask-image': mask, ...paint } = css
  const style: CSSProperties = { background: paint.background, boxShadow: paint['box-shadow'] }
  const face = (extra: CSSProperties, hidden?: boolean) => (
    <div
      aria-hidden={hidden || undefined}
      className="absolute grid h-11 w-36 place-items-center rounded-lg text-ui font-medium text-on-accent"
      style={{ ...style, ...extra }}
    >
      {copy.button}
    </div>
  )
  const progressive = blurred?.type === 'progressive'
  const lines = Object.entries(css)

  return (
    <div data-slot="effects-preview" className="flex min-w-0 flex-col gap-3">
      <div
        role="img"
        aria-label={copy.preview}
        className="relative grid h-56 place-items-center overflow-hidden rounded-lg bg-band"
      >
        {progressive ? (
          <>
            {face({ maskImage: progressiveMask(blurred.start, blurred.end, true) })}
            {face({ filter, maskImage: mask }, true)}
          </>
        ) : (
          face({ filter })
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-ui-xs font-medium tracking-wide text-fg-muted uppercase">{copy.css}</span>
        <pre
          data-slot="effects-css"
          className="h-32 overflow-auto font-mono text-ui-xs leading-5 whitespace-pre-wrap text-fg-muted yj-scrollbar"
        >
          {lines.length ? lines.map(([name, v]) => `${name}: ${v};`).join('\n') : copy.noStyles}
        </pre>
      </div>
    </div>
  )
}

export { Preview }
