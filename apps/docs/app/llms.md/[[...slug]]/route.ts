import { notFound } from 'next/navigation'
import { renderPage } from '@/lib/llms'
import { source } from '@/lib/source'

/* One docs page as Markdown. next.config.mjs rewrites /docs/<slug>.md here,
 * as Fumadocs does for its `.mdx` links. Prerendered for every page. */

export const revalidate = false

/* A static export writes each URL as a file, and /llms.md/components can't be a file beside the
 * /llms.md/components/ folder. So there (scripts/build-static.ts) every page's last segment ends in
 * `.md` (llms.md/components.md, llms.md/components/button.md), the files are moved to their public
 * URLs, /docs/<slug>.md, and the index is app/docs.md. */
const STATIC = process.env.YOUJ_STATIC_EXPORT === '1'

export async function GET(_request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const page = source.getPage(STATIC && slug?.length ? [...slug.slice(0, -1), slug.at(-1)!.replace(/\.md$/, '')] : slug)
  if (!page) notFound()
  return new Response(await renderPage(page), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}

export function generateStaticParams() {
  const params = source.generateParams()
  if (!STATIC) return params
  return params.filter((p) => p.slug.length > 0).map((p) => ({ slug: [...p.slug.slice(0, -1), `${p.slug.at(-1)}.md`] }))
}
