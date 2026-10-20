/* The brand, in one place. Every name, package and install line the film,
 * the stills, the captions and the manifest show comes from here, so a
 * rename is this file (plus the lockup, which film/brand.tsx imports from
 * the motion package's own logo geometry). Import-free, so the render
 * pipeline can read it too. */

const NAME = 'Youj'
/** The npm scope the packages publish under. */
const SCOPE = '@youj'
/** The setup CLI: `npx youj init` sets an app up, `add` brings in one item. */
const CLI = 'youj'

const PACKAGES = {
  ui: `${SCOPE}/react`,
  motion: `${SCOPE}/motion`,
  icons: `${SCOPE}/icons`,
}

export const BRAND = {
  name: NAME,
  cli: CLI,
  modules: {
    ui: `${NAME} UI`,
    motion: `${NAME} Motion`,
    icons: `${NAME} Icons`,
    themes: 'Themes',
  },
  packages: PACKAGES,
  install: {
    /** Everything: packages, stylesheet, provider and a theme, in one command. */
    all: `npx ${CLI} init`,
    /** Just what you need: one component. */
    one: `npx ${CLI} add button`,
    /** One entrance look: the first of the relay. */
    entrance: `npx ${CLI} add blueprint`,
  },
  tagline: 'Components, motion and icons, designed as one.',
  promise: 'Take all of it, or just what you need.',
}

/** A line set in two parts, split after its last comma: "Take all of it," / "or just what you need." */
export function splitAfterComma(text: string): [string, string] {
  const cut = text.lastIndexOf(', ') + 1
  return [text.slice(0, cut), text.slice(cut + 1)]
}
