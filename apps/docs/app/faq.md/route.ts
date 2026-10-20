import { faqMarkdown } from '@/lib/llms'

export const revalidate = false

export function GET() {
  return new Response(faqMarkdown(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
