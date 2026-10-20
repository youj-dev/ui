import type { ComponentType } from 'react'
import { ArchiveIcon, FileIcon, FileTextIcon, FilmIcon, ImageIcon, MusicIcon, TableIcon } from '@youj/icons'
import {
  IllustrationAnalytics,
  IllustrationCalendar,
  IllustrationCamera,
  IllustrationContract,
  IllustrationDesignTools,
  IllustrationDocuments,
  IllustrationFilmReel,
  IllustrationMountain,
  IllustrationMusic,
  IllustrationPadlock,
  IllustrationPodcast,
  IllustrationPresentation,
  IllustrationStorage,
  IllustrationSunCloud,
  IllustrationVideo,
  IllustrationVideoCall,
  type IllustrationProps,
} from '@youj/illustrations'
import { dateTimeFormat } from '../../../lib/utils'
export type Kind = 'image' | 'video' | 'doc' | 'pdf' | 'sheet' | 'audio' | 'archive'

/** A tile's picture: an isometric scene, imported one by one so only the ones you use ship. */
export type Scene = ComponentType<IllustrationProps>

export interface FileManagerFile {
  id: string
  name: string
  /** The id of the folder it sits in. */
  folder: string
  kind: Kind
  /** In bytes. */
  size: number
  /** When it last changed, in epoch milliseconds. */
  modified: number
  owner: string
  /** The scene that says what's inside. Default: its kind's. */
  scene?: Scene
  /** Draws the content itself instead of a scene, for a file whose content is the point: a logo, a palette. */
  preview?: 'wordmark' | 'wordmark-inverse' | 'swatches'
  /** A clip's running time, shown on its tile. */
  length?: string
}

export interface FileManagerFolder {
  id: string
  name: string
  /** Folders inside it, shown in the tree and as tiles above its files. */
  children?: FileManagerFolder[]
}

export const FOLDERS: FileManagerFolder[] = [
  { id: 'brand', name: 'Brand' },
  {
    id: 'campaigns',
    name: 'Campaigns',
    children: [
      { id: 'autumn', name: 'Autumn 26' },
      { id: 'launch', name: 'Orbit launch' },
    ],
  },
  { id: 'contracts', name: 'Contracts' },
  { id: 'research', name: 'Research' },
]

/** Folder names, each folder's children and the path to it, read off the tree. */
export function folderModel(folders: FileManagerFolder[]) {
  const names: Record<string, string> = {}
  const parent: Record<string, string | undefined> = {}
  const subfolders: Record<string, string[]> = {}
  const walk = (list: FileManagerFolder[], up?: string) =>
    list.forEach((f) => {
      names[f.id] = f.name
      parent[f.id] = up
      if (f.children?.length) {
        subfolders[f.id] = f.children.map((c) => c.id)
        walk(f.children, f.id)
      }
    })
  walk(folders)
  const path = (id: string): string[] => (parent[id] ? [...path(parent[id]!), id] : [id])
  return { names, subfolders, path }
}

const DAY = 86_400_000
export const NOW = Date.UTC(2026, 8, 27, 15)
export const MB = 1024 * 1024

export const FILES: FileManagerFile[] = [
  { id: 'f1', name: 'wordmark.svg', folder: 'brand', kind: 'image', size: 0.04 * MB, modified: NOW - 2 * DAY, owner: 'Noor Haddad', preview: 'wordmark' },
  { id: 'f2', name: 'wordmark-inverse.svg', folder: 'brand', kind: 'image', size: 0.04 * MB, modified: NOW - 2 * DAY, owner: 'Noor Haddad', preview: 'wordmark-inverse' },
  { id: 'f3', name: 'Brand guidelines.pdf', folder: 'brand', kind: 'pdf', size: 18.2 * MB, modified: NOW - 9 * DAY, owner: 'Ilse Varga', scene: IllustrationDesignTools },
  { id: 'f4', name: 'Palette.sketchpalette', folder: 'brand', kind: 'archive', size: 0.01 * MB, modified: NOW - 40 * DAY, owner: 'Ilse Varga', preview: 'swatches' },
  { id: 'f5', name: 'Hero, dusk.jpg', folder: 'autumn', kind: 'image', size: 6.8 * MB, modified: NOW - 0.2 * DAY, owner: 'Kai Mendes', scene: IllustrationMountain },
  { id: 'f6', name: 'Hero, morning.jpg', folder: 'autumn', kind: 'image', size: 7.1 * MB, modified: NOW - 0.3 * DAY, owner: 'Kai Mendes', scene: IllustrationSunCloud },
  { id: 'f7', name: 'Cutdown 15s.mp4', folder: 'autumn', kind: 'video', size: 148 * MB, modified: NOW - 1 * DAY, owner: 'Kai Mendes', length: '0:15' },
  { id: 'f8', name: 'Voiceover take 3.wav', folder: 'autumn', kind: 'audio', size: 32.4 * MB, modified: NOW - 1.5 * DAY, owner: 'Ama Owusu', scene: IllustrationPodcast, length: '2:48' },
  { id: 'f9', name: 'Scripts.docx', folder: 'autumn', kind: 'doc', size: 0.3 * MB, modified: NOW - 3 * DAY, owner: 'Ama Owusu' },
  { id: 'f10', name: 'Media plan.xlsx', folder: 'autumn', kind: 'sheet', size: 0.9 * MB, modified: NOW - 4 * DAY, owner: 'Noor Haddad', scene: IllustrationCalendar },
  { id: 'f11', name: 'Storyboard.pdf', folder: 'autumn', kind: 'pdf', size: 24.6 * MB, modified: NOW - 6 * DAY, owner: 'Kai Mendes', scene: IllustrationFilmReel },
  { id: 'f12', name: 'Lookbook.png', folder: 'autumn', kind: 'image', size: 11.3 * MB, modified: NOW - 7 * DAY, owner: 'Ilse Varga', scene: IllustrationCamera },
  { id: 'f13', name: 'Launch deck.pdf', folder: 'launch', kind: 'pdf', size: 9.4 * MB, modified: NOW - 12 * DAY, owner: 'Noor Haddad', scene: IllustrationPresentation },
  { id: 'f14', name: 'MSA 2026.pdf', folder: 'contracts', kind: 'pdf', size: 1.2 * MB, modified: NOW - 30 * DAY, owner: 'Ilse Varga', scene: IllustrationContract },
  { id: 'f15', name: 'NDA template.docx', folder: 'contracts', kind: 'doc', size: 0.1 * MB, modified: NOW - 90 * DAY, owner: 'Ilse Varga', scene: IllustrationPadlock },
  { id: 'f16', name: 'Interviews.zip', folder: 'research', kind: 'archive', size: 412 * MB, modified: NOW - 14 * DAY, owner: 'Ama Owusu', scene: IllustrationVideoCall },
  { id: 'f17', name: 'Survey results.csv', folder: 'research', kind: 'sheet', size: 2.2 * MB, modified: NOW - 15 * DAY, owner: 'Ama Owusu' },
]

export const KIND: Record<Kind, { icon: typeof FileIcon; tone: string; scene: Scene }> = {
  image: { icon: ImageIcon, tone: 'bg-accent-subtle text-accent-text', scene: IllustrationCamera },
  video: { icon: FilmIcon, tone: 'bg-danger-subtle text-danger-text', scene: IllustrationVideo },
  audio: { icon: MusicIcon, tone: 'bg-warning-subtle text-warning-text', scene: IllustrationMusic },
  doc: { icon: FileTextIcon, tone: 'bg-accent-subtle text-accent-text', scene: IllustrationDocuments },
  pdf: { icon: FileTextIcon, tone: 'bg-danger-subtle text-danger-text', scene: IllustrationDocuments },
  sheet: { icon: TableIcon, tone: 'bg-success-subtle text-success-text', scene: IllustrationAnalytics },
  archive: { icon: ArchiveIcon, tone: 'bg-band text-fg-muted', scene: IllustrationStorage },
}

export interface FileManagerStorage {
  label: string
  bytes: number
  /** The meter cells' background class, e.g. 'bg-accent'. */
  tone: string
}

export const STORAGE: FileManagerStorage[] = [
  { label: 'Media', bytes: 21.4 * 1024 * MB, tone: 'bg-accent' },
  { label: 'Documents', bytes: 6.9 * 1024 * MB, tone: 'bg-success' },
  { label: 'Archives', bytes: 9.9 * 1024 * MB, tone: 'bg-warning' },
]
export const QUOTA = 100 * 1024 * MB

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export const DEFAULT_COPY = {
  /** Read after the product's name in the h1, for screen readers. */
  titleSuffix: ' files',
  search: 'Search this folder',
  searchPlaceholder: (folder: string) => `Search ${folder}`,
  upload: 'Upload',
  folders: 'Folders',
  resizeFolders: 'Resize folders',
  storage: 'Storage',
  storageOf: (quotaGb: string) => `of ${quotaGb} GB`,
  files: 'Files',
  sortBy: 'Sort by',
  sortModified: 'Last modified',
  sortName: 'Name',
  sortSize: 'Size',
  view: 'View',
  grid: 'Grid',
  list: 'List',
  noMatchTitle: 'No files match',
  noMatchDescription: 'Try another name.',
  emptyTitle: (folder: string) => `${folder} is empty`,
  emptyDescription: 'Drop files here, or use Upload.',
  errorTitle: 'Couldn’t load your files',
  retry: 'Try again',
  dropTo: (folder: string) => `Drop to upload to ${folder}`,
  preview: 'Preview',
  select: 'Select',
  deselect: 'Deselect',
  selectFile: (name: string) => `Select ${name}`,
  copyLink: 'Copy link',
  linkCopied: 'Link copied',
  copied: 'Copied',
  delete: 'Delete',
  movedOne: (name: string) => `Moved “${name}” to trash`,
  movedMany: (count: number) => `Moved ${count} files to trash`,
  undo: 'Undo',
  actionFailed: 'Something went wrong',
  selection: 'Selection',
  selected: 'selected',
  download: 'Download',
  downloadSelected: 'Download selected',
  zipped: 'Zipped',
  downloaded: 'Downloaded',
  deleteSelected: 'Delete selected',
  clearSelection: 'Clear selection',
  uploads: 'Uploads',
  uploading: 'Uploading',
  uploadingFile: (name: string) => `Uploading ${name}`,
  uploadFailed: (name: string) => `Couldn’t upload “${name}”`,
  /** Who a file you upload belongs to. */
  you: 'You',
  shareTitle: 'Anyone with the link',
  shareSwitch: 'Share with anyone who has the link',
  location: 'Location',
  modified: 'Modified',
  owner: 'Owner',
  size: 'Size',
  today: 'Today',
  kinds: { image: 'Image', video: 'Video', audio: 'Audio', doc: 'Document', pdf: 'PDF', sheet: 'Spreadsheet', archive: 'Archive' } as Record<Kind, string>,
}

export type FileManagerCopy = typeof DEFAULT_COPY & {
  /** The locale dates and sizes are written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

export function formatSize(bytes: number, locale: string) {
  const [unit, value, digits] =
    bytes >= 1024 * MB ? (['gigabyte', bytes / 1024 / MB, 1] as const) : bytes >= MB ? (['megabyte', bytes / MB, 1] as const) : (['kilobyte', Math.max(1, Math.round(bytes / 1024)), 0] as const)
  return value.toLocaleString(locale, { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: digits })
}
const formats = new Map<string, { ago: Intl.RelativeTimeFormat; date: Intl.DateTimeFormat }>()
/** When a file changed, against `now`: "Today", "3 days ago", then the date. */
export function modified(at: number, now: number, locale: string, today: string) {
  let f = formats.get(locale)
  if (!f) {
    f = {
      ago: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
      date: dateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
    }
    formats.set(locale, f)
  }
  const days = Math.round((at - now) / DAY)
  if (days === 0) return today
  if (days > -30) return f.ago.format(days, 'day')
  return f.date.format(at)
}
export const kindOf = (name: string): Kind => {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'webm'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'aac'].includes(ext)) return 'audio'
  if (ext === 'pdf') return 'pdf'
  if (['csv', 'xlsx', 'numbers'].includes(ext)) return 'sheet'
  if (['zip', 'tar', 'gz'].includes(ext)) return 'archive'
  return 'doc'
}

