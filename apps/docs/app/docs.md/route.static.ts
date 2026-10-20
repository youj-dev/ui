import { GET as markdown } from '../llms.md/[[...slug]]/route'

/* The docs index as Markdown, for the static export only: on Vercel next.config.mjs rewrites
 * /docs.md to /llms.md, which a static export can't write beside its /llms.md/ folder. */

export const revalidate = false

export function GET(request: Request) {
  return markdown(request, { params: Promise.resolve({}) })
}
