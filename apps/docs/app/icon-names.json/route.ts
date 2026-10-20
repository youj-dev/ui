import { iconNames } from '@/lib/catalog'

/* The icon set's names for the search palette, which fetches them the first
 * time it opens (components/site/search.tsx), so pages don't each carry the
 * whole list in their payload. Prerendered. */

export const dynamic = 'force-static'

export function GET() {
  return Response.json(iconNames())
}
