// What the source packages (@youj/core, @youj/motion, @youj/icons and
// @youj/illustrations) export and where each name is declared, read with
// the TypeScript compiler from their entry points (scripts/youj-sources.mjs).
// UI source may import them from an entry (`@youj/motion`,
// `@youj/icons`) or a source path (`@youj/icons/components/youj/icons/x`);
// this resolves both to files, each relative to its package's src/, which is
// also where `shadcn add` installs it in an app:
//   - the package build rewrites source paths to the entry that exports them
//     (sourceEntryImports), since a published package only exposes its entries;
//   - the registry build rewrites the imports to the files `shadcn add`
//     installs, and depends on the items that hold them.
import { moduleReferences, sourceEntries, sourceFilesFor, sourceOf } from '../../../scripts/youj-sources.mjs'

export { moduleReferences, sourceOf }

/** @returns {Map<string, Map<string, string>>} entry specifier → exported name → declaring file (relative to its package's src/) */
export const motionEntries = sourceEntries

/**
 * Where each name imported from a source-package specifier is declared.
 * @returns {Map<string, string>} name → file, or throws naming what isn't public
 */
export const motionFilesFor = sourceFilesFor
