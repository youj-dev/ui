import { InstallField } from '@/components/landing/install-field'
import { MCP_CONNECT } from '@/lib/mcp-config'

/** The command that connects the hosted server, in the install field: its menu picks the AI tool. */
export function McpConnect() {
  return (
    <div className="not-prose my-6">
      <InstallField install={{ kind: 'client', commands: MCP_CONNECT }} label="Connect command" className="w-full" />
    </div>
  )
}
