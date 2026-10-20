import { basics } from '@/lib/basics'
import heights from '@/lib/stage-heights.json'
import { stageCapped } from '@/lib/preview'
import { PreviewFrame, type PreviewFrameProps } from './preview-frame'

/** Each demo that outgrows a page's `height`, measured by scripts/stage-heights.ts: [phone, from `sm` up]. */
const RESERVE: Record<string, number[] | undefined> = heights

let views: Map<string, string> | undefined

/** The example's full page, `/view/<kind>/<slug>?story=<name>`: the first component whose docs page shows it. */
function viewHref(name: string) {
  if (!views) {
    views = new Map()
    for (const entry of basics()) for (const { id } of entry.demos) if (entry.demo && !views.has(id)) views.set(id, `/view/${entry.kind}/${entry.slug}?story=${id}`)
  }
  return views.get(name)
}

/**
 * A live example from `examples/<name>.tsx` with its source in a Code tab.
 * The source is published at build time as its own file (app/code), which
 * the tab fetches when it opens, so what readers copy is exactly the file
 * that runs and the page carries none of it. Its stage keeps the height the
 * demo measured, so the page doesn't move when it mounts.
 */
/** The examples too large for a docs column (grids, tables, boards, app shells): only these offer the full page and
 * the phone preview. The rest stay in the page, on the desktop, until those cases are tuned. */
const ROOMY = ['data-table/', 'kanban/', 'calendar/', 'sidebar/', 'chart/']

/** What a frame needs to show the example `name`: its file, measured height and full page (one of the ROOMY ones). */
export function previewFor(name: string): Pick<PreviewFrameProps, 'name' | 'file' | 'reserve' | 'view'> {
  const measured = RESERVE[name]
  const reserve = measured && ([measured[0]!, measured[1]!] as [number, number])
  const roomy = ROOMY.some((prefix) => name.startsWith(prefix)) || stageCapped(reserve)
  return { name, file: `${name.replace(/\//g, '-')}.tsx`, reserve, view: roomy ? viewHref(name) : undefined }
}

export function ComponentPreview({ name, ...frame }: { name: string } & Pick<PreviewFrameProps, 'full' | 'height'>) {
  return <PreviewFrame {...previewFor(name)} {...frame} />
}
