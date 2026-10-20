/* Where the project lives and how to reach it: the footer's Project column,
 * About & support, the FAQ and the changelog all link from here. The
 * repository's location is configured in lib/repo.ts. */

import { repo, REPO_URL } from './repo'

export { REPO_URL }

export const project = {
  repo: repo.url,
  issues: repo.issues,
  newIssue: repo.newIssue,
  discussions: repo.discussions,
  releases: repo.releases,
  /** A file in the repository, on GitHub. */
  file: repo.file,
}

/** The header's community buttons (components/site/site-header.tsx): each shows only once it has somewhere to go. */
export const site = {
  links: {
    github: {
      url: repo.url,
      // Shown in the header beside Discord; the URL follows NEXT_PUBLIC_YOUJ_REPO_URL (lib/repo.ts). False hides the button.
      public: true,
      // While true the button only says "Coming soon"; false makes it a link.
      comingSoon: false,
    },
    discord: { url: 'https://discord.gg/FEjHF27Ff', comingSoon: true } as { url: string; comingSoon: boolean } | undefined,
  },
}

export interface CommunityLink {
  id: 'discord' | 'github'
  label: string
  url: string
  /** A button that says "Coming soon" instead of a link. */
  soon?: boolean
}

/** The community buttons that have somewhere to go, in the header's order: Discord, then GitHub. */
export function communityLinks(links = site.links): CommunityLink[] {
  const { discord, github } = links
  return [
    ...(discord ? [{ id: 'discord' as const, label: 'Join the Discord', url: discord.url, ...(discord.comingSoon ? { soon: true } : {}) }] : []),
    ...(github.public ? [{ id: 'github' as const, label: 'GitHub', url: github.url, ...(github.comingSoon ? { soon: true } : {}) }] : []),
  ]
}

/** Where to report a vulnerability without a public issue: GitHub's private advisory form. */
export const privateAdvisory = repo.newAdvisory

/** The private address for vulnerability reports (and conduct reports); SECURITY.md names it too. */
export const securityEmail = 'support@youj.dev'

/** A sponsor link, shown only when the deployment sets one. */
export function sponsorUrl(env: Record<string, string | undefined> = process.env): string | undefined {
  const url = env.NEXT_PUBLIC_SPONSOR_URL?.trim()
  return url && /^https:\/\//.test(url) ? url : undefined
}
