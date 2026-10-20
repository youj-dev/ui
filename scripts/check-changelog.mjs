// Release gate (not part of `pnpm verify`, which runs on every change): CHANGELOG.md must have
// a dated heading for the version being released, "## 0.1.0 - 2026-10-14" (RELEASING.md) or
// "## 0.1.0 (2026-10-14)", not "(Unreleased)".
// The Release workflow runs it before publishing.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = join(import.meta.dirname, '..')

/** Whether `changelog` has a heading "## <version> - YYYY-MM-DD" (or with the date in brackets) for this version. */
export function hasDatedHeading(changelog, version) {
  const escaped = version.replaceAll('.', '\\.')
  return new RegExp(`^## ${escaped} (?:- \\d{4}-\\d{2}-\\d{2}|\\(\\d{4}-\\d{2}-\\d{2}\\))\\s*$`, 'm').test(changelog)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { version } = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8'))
  if (!hasDatedHeading(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'), version)) {
    console.error(`CHANGELOG.md has no dated heading for ${version}. Add "## ${version} - YYYY-MM-DD" (replace "(Unreleased)") before releasing.`)
    process.exit(1)
  }
  console.log(`changelog: ok (${version})`)
}
