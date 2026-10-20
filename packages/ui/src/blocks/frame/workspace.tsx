'use client'

import { SidebarMenu, SidebarMenuItem, useSidebar } from '../../components/ui/sidebar'
import { WorkspaceSwitcher } from '../../components/ui/workspace-switcher'
import { cn } from '../../lib/utils'
import { useFrameCompact, useFrameRail, type FrameTeam } from './shell'

/* The workspace switcher, for a frame sidebar's header: the current team's
 * logo and plan, a searchable list of the others, and "Create workspace".
 * Its chevrons sit on a key cap, as the account's do at the foot
 * (sidebar signature, rule 6). Where the sidebar is narrow
 * (collapsed to icons, or a rail) it's the logo alone, and its list opens to
 * the side instead of below. */

/** The trigger's chevrons on the kit's key cap (shell/signature's KEY_CAP, from the trigger). */
const chevronKey =
  '[&>svg:last-child]:box-content [&>svg:last-child]:size-3 [&>svg:last-child]:rounded-sm [&>svg:last-child]:border [&>svg:last-child]:border-line [&>svg:last-child]:bg-key [&>svg:last-child]:p-0.75 [&>svg:last-child]:shadow-[inset_0_-1px_0_var(--color-line)]'

interface FrameWorkspaceProps {
  teams: FrameTeam[]
  value?: string
  defaultValue?: string
  onValueChange?: (id: string) => void
  /** Adds "Create workspace", with whatever was typed in the search. */
  onCreate?: (name: string) => void
  className?: string
}

function FrameWorkspace({ teams, value, defaultValue, onValueChange, onCreate = () => {}, className }: FrameWorkspaceProps) {
  const compact = useFrameCompact()
  const rail = useFrameRail()
  const { isMobile } = useSidebar()
  return (
    <SidebarMenu data-slot="frame-workspace">
      {/* Centred on a rail; in a sidebar folding to icons it keeps to the icons' column, so the logo doesn't jump while the width moves. */}
      <SidebarMenuItem className={cn(compact && 'flex', rail && 'justify-center')}>
        <WorkspaceSwitcher
          workspaces={teams}
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          onCreate={onCreate}
          compact={compact}
          side={compact && !isMobile ? 'inline-end' : 'bottom'}
          align="start"
          className={cn(compact ? 'size-8 [&_[data-slot=avatar]]:size-7' : ['w-full', chevronKey], className)}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export { FrameWorkspace }
export type { FrameWorkspaceProps }
