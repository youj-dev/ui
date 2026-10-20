import { codeBody, codePaths } from '@/lib/code-files'

/* Each file a Code tab shows, highlighted and published as JSON on the build
 * (`/code/docs/button/demo.json`, `/code/examples/mail/examples/mail/mail.tsx.json`),
 * so a page ships only its files' names and a tab fetches the one it opens
 * (lib/code-load.ts). Prerendered: nothing runs per request. */

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return codePaths().map((path) => ({ path: [...path.slice(0, -1), `${path.at(-1)}.json`] }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const last = path.at(-1) ?? ''
  const body = last.endsWith('.json') ? await codeBody([...path.slice(0, -1), last.slice(0, -'.json'.length)]) : undefined
  if (!body) return new Response('Not found', { status: 404 })
  return Response.json(body)
}
