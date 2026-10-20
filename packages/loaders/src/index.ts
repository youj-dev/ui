// @youj/loaders: loading animations, each a status with one API (size,
// color, accentColor, colors (its colored parts, mono unless asked), speed, label (one or several, taking turns), labelEvery,
// showLabel, labelPosition, labelEffect, paused), drawn from the theme's tokens on
// one shared ticker. This entry is the kit: LoaderRoot, the props and the category data. The drawing engine (field.ts) is internal.
// Each loader is its own entry, `@youj/loaders/<id>` (LoaderVortex from
// '@youj/loaders/vortex'), and installs on its own: `npx youj add loader-<id>`.
// The per-loader entries are generated (scripts/loaders.mjs); to add a loader, see
// components/youj/loaders/LOADERS.md.

export {
  LoaderRoot,
  FIELD_SIZES,
  type LoaderProps,
  type LoaderSize,
  type LoaderSpec,
  type LoaderLabelPosition,
  type LoaderLabelEffect,
} from './components/youj/loaders/kit'
export {
  LOADER_CATEGORIES,
  type LoaderCategory,
  type LoaderColorPart,
  type LoaderToneRole,
  DEFAULT_TONE_ROLES,
  TONE_ROLE_COLORS,
  type LoaderCategoryInfo,
  type LoaderMeta,
  type LoaderTechnique,
} from './components/youj/loaders/categories'
