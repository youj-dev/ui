import { source } from '@/lib/source'
import { navTree } from '@/lib/tree'

/* The docs tree for the mobile menu, which fetches it the first time it
 * opens (components/site/mobile-menu.tsx), so pages outside the docs don't
 * carry it. The same data the sidebar draws. Prerendered. */

export const dynamic = 'force-static'

export function GET() {
  return Response.json(navTree(source.getPageTree()))
}
