'use client'

import { ArchiveIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import { useFileManager } from './context'
import { KIND, type FileManagerCopy, type FileManagerFile } from './data'

/** The chip's word: the extension, or the kind's name for one too long to read at a glance. */
function typeOf(file: FileManagerFile, copy: FileManagerCopy) {
  const ext = file.name.slice(file.name.lastIndexOf('.') + 1)
  return ext.length > 4 ? copy.kinds[file.kind] : ext.toUpperCase()
}

/** The logo itself, as the file would show it: on a transparency checkerboard, or reversed out of the ink for the inverse cut. */
function Wordmark({ inverse }: { inverse: boolean }) {
  const { brand } = useFileManager()
  return (
    <div
      className={cn(
        'absolute inset-0 grid place-items-center',
        inverse
          ? 'bg-fg text-canvas'
          : 'bg-[conic-gradient(var(--color-band)_25%,transparent_0_50%,var(--color-band)_0_75%,transparent_0)] bg-size-[14px_14px] text-fg',
      )}
    >
      <span className="flex items-center gap-2">
        {brand.logo ?? (
          <span className={cn('grid size-8 place-items-center rounded-lg', inverse ? 'bg-canvas text-fg' : 'bg-accent text-on-accent')}>
            <ArchiveIcon size={17} />
          </span>
        )}
        <span className="text-2xl font-semibold tracking-tight">{brand.name}</span>
      </span>
    </div>
  )
}

/** A palette file: its colors as chips, the way the palette panel lays them out. */
function Swatches() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex h-2/5 w-3/5 gap-1 rounded-xl bg-surface p-1 shadow-sm ring-1 ring-line">
        {['bg-accent', 'bg-accent', 'bg-accent-line', 'bg-fg-muted', 'bg-fg'].map((tone, i) => (
          <span key={i} className={cn('flex-1 rounded-md', tone)} />
        ))}
      </div>
    </div>
  )
}

/**
 * What a file holds, at a glance: an isometric scene picked for its content
 * (or its kind's, for a file without one), or the content itself for a logo
 * or a palette. `lifted` raises the scene's lit part, as its tile is hovered;
 * `large` is the preview sheet's, at a size where the scene bobs. The chip
 * names the type, or a clip's running time. The scenes assemble once, as
 * they come into view; reduced motion draws them finished and still.
 */
export function Thumb({ file, className, lifted = false, large = false }: { file: FileManagerFile; className?: string; lifted?: boolean; large?: boolean }) {
  const { copy } = useFileManager()
  const Scene = file.scene ?? KIND[file.kind].scene
  return (
    <div aria-hidden className={cn('relative grid place-items-center overflow-hidden bg-transparent [content-visibility:auto]', className)}>
      {file.preview === 'swatches' ? (
        <Swatches />
      ) : file.preview ? (
        <Wordmark inverse={file.preview === 'wordmark-inverse'} />
      ) : (
        <Scene unit={large ? 20 : 12} float={large} explode={lifted ? 0.6 : 0} className="max-h-full" />
      )}
      {!large && (
        <span className="absolute end-2 bottom-2 rounded-sm bg-surface px-1.5 font-mono text-ui-xs text-fg-muted tabular-nums ring-1 ring-line">
          {file.length ?? typeOf(file, copy)}
        </span>
      )}
    </div>
  )
}
