import { changelogFeed } from '@/lib/changelog-feed'

export const revalidate = false

export function GET() {
  return new Response(changelogFeed(), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
