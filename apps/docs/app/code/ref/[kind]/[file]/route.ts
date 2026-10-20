import { blockRef, blockRefItems } from '@/lib/block-ref'
import { block } from '@/lib/showcase'

/* Each block's install, usage and reference as a block page
 * draws them (`/code/ref/blocks/app-error.json`), so a page carries only its
 * first story's and fetches another's when a reader picks it
 * (components/docs/block-stories-view.tsx). Prerendered: nothing runs per request. */

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return blockRefItems().map((b) => ({ kind: b.kind, file: `${b.slug}.json` }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; file: string }> }) {
  const { kind, file } = await params
  const slug = file.endsWith('.json') ? file.slice(0, -'.json'.length) : ''
  const b = kind === 'blocks' ? block(slug) : undefined
  if (!b) return new Response('Not found', { status: 404 })
  return Response.json(await blockRef(b))
}
