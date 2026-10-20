/* The parts of detect.ts that read no files, so the MCP's Worker (which has no disk) can use them. */

/** The major version a range (or an installed version) names: '^4.1.0' → 4. Null for tags and URLs. */
export function majorOf(range: string | undefined): number | null {
  const m = range?.match(/(?:^|[\s^~>=<v:@])(\d+)(?:\.|$|\s|\.x)/)
  return m ? Number(m[1]) : null
}

/**
 * Why Youj can't run on this React, or null when it can: its peer range is
 * ^19. `version` is the installed version or a package.json range.
 */
export function unsupportedReact(version: string): string | null {
  const major = majorOf(version)
  if (major === null || major >= 19) return null
  return `React ${/^\d+\.\d+\.\d+$/.test(version) ? version : major}: Youj needs React 19`
}

export const TAILWIND_IMPORT = /^[ \t]*@import\s+(['"])tailwindcss\1[^;]*;[ \t]*$/m
