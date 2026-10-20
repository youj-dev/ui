import type { ReactNode } from 'react'

/** A customer in the cloud. */
export interface LogoCloudLogo {
  /** The customer's name: what screen readers hear, and the wordmark's text when there's no `logo`. */
  name: string
  /** The customer's wordmark, an `<img>` or `<svg>` about 1.5rem tall. Without it, `mark` sits beside the name. */
  logo?: ReactNode
  /** A glyph drawn in a 24×24 viewBox (the children of an `<svg>`), filled with the text color. */
  mark?: ReactNode
}

export const LOGOS: LogoCloudLogo[] = [
  { name: 'Lumen', mark: <circle cx="12" cy="12" r="7" /> },
  { name: 'Northstar', mark: <path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6z" /> },
  { name: 'Arcadia', mark: <path d="M4 19 12 5l8 14z" /> },
  { name: 'Helix', mark: <path d="M5 4h4v16H5zM15 4h4v16h-4zM9 10h6v4H9z" /> },
  { name: 'Vertex', mark: <path d="M4 5h16l-8 14z" /> },
  {
    name: 'Orbital',
    mark: (
      <>
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      </>
    ),
  },
  {
    name: 'Tandem',
    mark: (
      <>
        <circle cx="8" cy="12" r="5" />
        <circle cx="16" cy="12" r="5" opacity={0.5} />
      </>
    ),
  },
  { name: 'Mosaic', mark: <path d="M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7z" /> },
  { name: 'Quanta', mark: <rect x="4" y="4" width="16" height="16" rx="4" /> },
  { name: 'Parallel', mark: <path d="M7 4h4l-2 16H5zM15 4h4l-2 16h-4z" /> },
  { name: 'Kestrel', mark: <path d="M3 12 12 4l9 8-9 8z" /> },
  { name: 'Fernhill', mark: <path d="M12 3c5 3 7 8 0 18C5 11 7 6 12 3z" /> },
  { name: 'Marlowe', mark: <path d="M4 18V6l8 8 8-8v12" fill="none" stroke="currentColor" strokeWidth="2.5" /> },
  { name: 'Anvil', mark: <path d="M3 8h18l-4 5H8zM9 13h6v6H9z" /> },
  { name: 'Pinewood', mark: <path d="m12 3 6 8h-3l5 7H4l5-7H6z" /> },
  { name: 'Bluebird', mark: <path d="M3 12c4-6 10-6 18 0-8 6-14 6-18 0z" /> },
]

export const DEFAULT_COPY = {
  title: 'Trusted by 40,000 teams, from two-person startups to the Fortune 500',
  /** The full list of customers, for screen readers. */
  listLabel: 'Customers',
  pause: 'Pause the logos',
  play: 'Play the logos',
}
export type LogoCloudCopy = typeof DEFAULT_COPY
