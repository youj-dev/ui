/** Marks this file as the core's stand-in for the theme check: `youj add theme check` replaces it, and a later copy of the core leaves the real one alone. */
export const youjStandIn = true

/** The check only feeds YoujProvider's development warning, so the core ships it as an item of its own (youj-theme-check). */
export function warnTheme(_theme: unknown) {}
