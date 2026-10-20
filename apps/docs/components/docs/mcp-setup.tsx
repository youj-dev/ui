import { highlight } from 'fumadocs-core/highlight'
import { codeHighlight } from '@/lib/code-theme'
import { MCP_EDITORS } from '@/lib/mcp-config'
import { McpSetupView } from './mcp-setup-view'

/**
 * Per-editor setup for the MCP server: the command that writes the config,
 * the editor's own command where it has one, and the config itself,
 * highlighted at build time like every code block on the site.
 */
export async function McpSetup() {
  const editors = await Promise.all(
    MCP_EDITORS.map(async (editor) => ({
      ...editor,
      highlighted: await highlight(editor.config, { lang: editor.lang, ...codeHighlight }),
    })),
  )
  return <McpSetupView editors={editors} />
}
