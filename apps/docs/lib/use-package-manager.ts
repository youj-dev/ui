'use client'

import type { PackageManager } from '@/lib/package-manager'
import { storedChoice } from '@/lib/stored-choice'

/* The reader's package manager, chosen once for every install field on the
 * site (npm until they choose, on the server too). */
export const usePackageManager = storedChoice<PackageManager>('youj-package-manager', ['npm', 'pnpm', 'yarn', 'bun'])
