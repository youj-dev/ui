import { securityMarkdown } from '@/app/security/policy'

export const revalidate = false

export function GET() {
  return new Response(securityMarkdown(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
