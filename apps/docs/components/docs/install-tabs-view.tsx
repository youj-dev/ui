'use client'

import Link from 'next/link'
import { useState } from 'react'
import { shownExtras, type CopyIn } from '@/lib/copy-in'
import { InstallField, type Install, type InstallMode } from '@/components/landing/install-field'

/** An import line under the field, in the docs' code style; long lines scroll sideways, focusable so the keyboard can too. */
function ImportLine({ code }: { code: string }) {
  return (
    <div tabIndex={0} role="group" aria-label="Import" className="mt-2 overflow-x-auto rounded-sm px-1 code-text leading-7 yj-scrollbar focus-ring">
      <p className="whitespace-nowrap text-fg-muted">{code}</p>
    </div>
  )
}

/** The commands are written once, for pnpm (`pnpm add …`, `pnpm add -D …`, `npx youj …`): the field words them for the reader's manager. */
function installOf(command: string): Install {
  const add = command.match(/^pnpm add(\s+-D)?\s+(.*)$/)
  if (add) return { kind: 'package', packages: add[2]!, dev: !!add[1] }
  return { kind: 'cli', run: command.replace(/^npx youj /, '') }
}

/**
 * One install command (`pnpm add …`) as the install field: the Installation
 * page's, for packages outside a component's own block.
 */
export function PackageInstallView({ command, label = 'Install command' }: { /** Written for pnpm: `pnpm add …` or `npx youj …`. */ command: string; label?: string }) {
  return (
    <div className="not-prose my-6">
      <InstallField install={installOf(command)} label={label} className="w-full" />
    </div>
  )
}

export function InstallTabsView({
  packageCommand,
  packageImport,
  registryCommand,
  registryImport,
  registryDeps,
  copyIn,
}: {
  /** Absent for a copy-in-only item (a block or an example): only the Copy in route shows. */
  packageCommand?: string
  packageImport?: string
  registryCommand: string
  /** A copy-in-only item's import, from the path the CLI writes. */
  registryImport?: string
  registryDeps: string[]
  /** Present when the copy is heavy: what it brings. */
  copyIn?: CopyIn
}) {
  const [picked, setMethod] = useState<InstallMode>('package')
  const method: InstallMode = packageCommand ? picked : 'registry'
  const inPackage = method === 'package' && packageCommand
  const importLine = inPackage ? packageImport : registryImport

  return (
    <div className="not-prose my-6">
      <InstallField
        install={installOf(inPackage ? packageCommand : registryCommand)}
        label={inPackage ? 'Package install' : 'Copy-in install'}
        mode={packageCommand ? { value: method, onChange: setMethod } : undefined}
        className="w-full"
      />
      {importLine && <ImportLine code={importLine} />}
      {inPackage && (
        <p className="mt-2 px-1 text-[12.5px] text-fg-muted">
          For an app already set up with <code className="code-inline">npx youj init</code>, which installs the peers (<code className="code-inline">@youj/core</code>, <code className="code-inline">@youj/motion</code>, <code className="code-inline">motion</code> and Base UI) and wires the provider. New app? Start at <Link href="/docs/installation" className="underline underline-offset-2">Installation</Link>.
        </p>
      )}
      {method === 'registry' && registryDeps.length > 0 && (
        <p className="mt-2 px-1 text-[12.5px] text-fg-muted">
          Also installs{' '}
          {registryDeps.map((dep, i) => (
            <span key={dep}>
              {i > 0 && ', '}
              <code className="code-inline">{dep}</code>
            </span>
          ))}
          .
        </p>
      )}
      {method === 'registry' && copyIn && (
        <p className="mt-2 px-1 text-[12.5px] text-fg-muted">
          The copy is {copyIn.items.length} registry items, about {(Math.round(copyIn.lines / 100) * 100).toLocaleString('en-US')} lines in all
          {copyIn.coreLines > 0 && (
            <>
              , {copyIn.coreLines.toLocaleString('en-US')} of them the shared <code className="code-inline">youj-core</code>
            </>
          )}
          . Beyond the shared ones it brings{' '}
          {shownExtras(copyIn).names.map((dep, i) => (
            <span key={dep}>
              {i > 0 && ', '}
              <code className="code-inline">{dep}</code>
            </span>
          ))}
          {shownExtras(copyIn).more > 0 && ` and ${shownExtras(copyIn).more} more`}
          .
        </p>
      )}
    </div>
  )
}
