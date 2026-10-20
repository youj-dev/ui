import { roadmapMarkdown } from '@/app/roadmap/roadmap'

export const revalidate = false

export function GET() {
  return new Response(roadmapMarkdown(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
