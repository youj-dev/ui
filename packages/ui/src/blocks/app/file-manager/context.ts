'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { FileManagerCopy, FileManagerFile } from './data'

/** What every part reads: the strings, the brand, folder names and paths, dates against `now`, and the actions that reach your API. */
export interface FileManagerEnv {
  copy: FileManagerCopy
  brand: { name: string; logo?: ReactNode }
  names: Record<string, string>
  path: (folder: string) => string[]
  /** "Today", "3 days ago" or the date, in the block's locale. */
  modified: (at: number) => string
  shareUrl: (file: FileManagerFile) => string
  copyLink: (file: FileManagerFile) => void
  download: (files: FileManagerFile[]) => Promise<unknown> | unknown
}

export const FileManagerContext = createContext<FileManagerEnv | null>(null)

export const useFileManager = () => useContext(FileManagerContext)!
