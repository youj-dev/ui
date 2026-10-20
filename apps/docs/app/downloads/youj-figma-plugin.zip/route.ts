import { figmaPluginZip } from '@/lib/figma-kit'

export const dynamic = 'force-static'

export function GET() {
  return new Response(figmaPluginZip() as Uint8Array<ArrayBuffer>, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="youj-figma-plugin.zip"',
    },
  })
}
