import { llmsSmall } from '@/lib/llms'

export const revalidate = false

export async function GET() {
  return new Response(llmsSmall(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
