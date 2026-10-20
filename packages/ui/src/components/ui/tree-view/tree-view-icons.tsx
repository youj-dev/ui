import { FileCodeIcon } from '@youj/icons/components/youj/icons/file-code'
import { FileJsonIcon } from '@youj/icons/components/youj/icons/file-json'
import { FileTerminalIcon } from '@youj/icons/components/youj/icons/file-terminal'
import { FileIcon } from '@youj/icons/components/youj/icons/file'
import { FileTextIcon } from '@youj/icons/components/youj/icons/file-text'
import { FolderIcon } from '@youj/icons/components/youj/icons/folder'
import { ImageIcon } from '@youj/icons/components/youj/icons/image'
import { PaletteIcon } from '@youj/icons/components/youj/icons/palette'
import { cn } from '../../../lib/utils'

/* File-explorer icons. Folders are youj's FolderIcon, whose front panel
 * tips open on its hinge while the branch is expanded. Files are tinted by
 * type with the theme's inks, so they hold contrast in both themes. */

const SIZE = 16
const STROKE = 1.75

const byExtension: Record<string, { Icon: typeof FileIcon; tint: string }> = {
  ts: { Icon: FileCodeIcon, tint: 'text-accent-text' },
  tsx: { Icon: FileCodeIcon, tint: 'text-accent-text' },
  js: { Icon: FileCodeIcon, tint: 'text-warning-text' },
  jsx: { Icon: FileCodeIcon, tint: 'text-warning-text' },
  mjs: { Icon: FileCodeIcon, tint: 'text-warning-text' },
  json: { Icon: FileJsonIcon, tint: 'text-warning-text' },
  css: { Icon: PaletteIcon, tint: 'text-danger-text' },
  md: { Icon: FileTextIcon, tint: 'text-fg-muted' },
  mdx: { Icon: FileTextIcon, tint: 'text-fg-muted' },
  txt: { Icon: FileTextIcon, tint: 'text-fg-muted' },
  sh: { Icon: FileTerminalIcon, tint: 'text-success-text' },
  png: { Icon: ImageIcon, tint: 'text-success-text' },
  jpg: { Icon: ImageIcon, tint: 'text-success-text' },
  svg: { Icon: ImageIcon, tint: 'text-success-text' },
  webp: { Icon: ImageIcon, tint: 'text-success-text' },
}

/** The icon for a file name, by extension. Decorative. */
function TreeFileIcon({ name, className }: { name: string; className?: string }) {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : ''
  const { Icon, tint } = byExtension[ext] ?? { Icon: FileIcon, tint: 'text-fg-muted' }
  return <Icon size={SIZE} strokeWidth={STROKE} className={cn('shrink-0', tint, className)} />
}

/** A folder that opens while its branch is expanded. Decorative. */
function TreeFolderIcon({ open, className }: { open: boolean; className?: string }) {
  return <FolderIcon size={SIZE} strokeWidth={STROKE} active={open} className={cn('shrink-0 text-fg-muted', className)} />
}

export { TreeFileIcon, TreeFolderIcon }
