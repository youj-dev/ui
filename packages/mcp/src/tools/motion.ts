import type { Catalog } from '../catalog'
import { code, motionLines, NotFound } from '../format'
import { Searcher } from '../search'

/* Motion guidance: an interaction in words ("toast enters", "list reorders",
 * "button success") to the Youj piece that already does it, its tokens and
 * its reduced-motion behaviour. The recipes name components; the snippet,
 * tokens and reduced-motion note come from those components' docs, so they
 * can't drift. Only the choice of piece is written here. */

export interface Recipe {
  id: string
  /** The interaction, as someone would ask for it. */
  when: string
  /** More words it goes by. */
  words: string
  /** Registry items, best first. */
  use: string[]
  advice: string
  /** When the component's own usage isn't the right snippet. */
  snippet?: string
}

export const RECIPES: Recipe[] = [
  { id: 'toast', when: 'A toast or notification enters', words: 'toast notification snackbar message appears confirmation saved stack corner', use: ['toast'], advice: 'Call `toast()` from anywhere; the Toaster stacks, spreads on hover and swipes away on the `yj-toast` preset. Don\'t build your own enter animation.' },
  { id: 'list', when: 'Items are added to, removed from or reordered in a list', words: 'list reorder sort insert remove delete add row table shuffle filter layout move', use: ['presence-list'], advice: 'Wrap the list in PresenceList and each row in PresenceItem with a stable key: entering rows rise in, leaving rows collapse, and moves glide on `spring.smooth`, all interruptible. It works on real table rows too.' },
  { id: 'async', when: 'A button runs async work and shows success or error', words: 'button success error pending loading save submit async action done check fail retry', use: ['async-button', 'async-feedback'], advice: 'Give AsyncButton `onAction` a promise: the label morphs to a spinner, then to a drawn check (landing on `spring.settle`, the one overshoot) or a cross with a short shake, announced to screen readers. `successLabel` and `errorLabel` also take functions of the outcome (the error is `unknown`: check it). For work started elsewhere, such as a TanStack Query mutation, pass `status={mutation.status}` and start the work in `onClick`; the labels are then strings. For another control, use AsyncFeedback / useAsyncAction.', snippet: `import { AsyncButton } from '@youj/react'\n\n<AsyncButton onAction={() => save(values)} pendingLabel="Saving…" successLabel={(saved) => \`Saved \${saved.name}\`} errorLabel={(error) => (error instanceof Error ? error.message : 'Couldn’t save')}>\n  Save\n</AsyncButton>\n\n// TanStack Query: the button shows the mutation's status\n<AsyncButton status={mutation.status} onClick={() => mutation.mutate(values)} successLabel="Saved" errorLabel={mutation.error?.message}>\n  Save\n</AsyncButton>` },
  { id: 'dialog', when: 'A dialog or modal opens', words: 'dialog modal popup open overlay lightbox confirm', use: ['dialog', 'alert-dialog'], advice: 'Dialog animates on the `yj-dialog` and `yj-backdrop` presets (scale and fade on `ease.enter`, out faster on `ease.exit`). For a destructive confirmation use AlertDialog.' },
  { id: 'sheet', when: 'A side panel or drawer slides in', words: 'sheet drawer side panel slide slideover edge mobile bottom swipe', use: ['sheet', 'drawer'], advice: 'Sheet slides from an edge on `yj-sheet-*`; Drawer follows the finger and dismisses with a swipe. Both keep focus inside while open.' },
  { id: 'popover', when: 'A popover, menu or tooltip appears', words: 'popover dropdown menu tooltip hover card context floating anchored', use: ['popover', 'dropdown-menu', 'tooltip'], advice: 'These use the `yj-pop` and `yj-tooltip` presets: a short scale from the anchor side. For your own Base UI popup, put `yj-pop` on the popup and spread `useYoujScope()` on its Portal.' },
  { id: 'tabs', when: 'An indicator moves to the selected tab or option', words: 'tabs indicator segmented control selected highlight underline pill toggle group slide', use: ['tabs', 'sliding-indicator', 'toggle-group'], advice: 'Tabs and ToggleGroup already glide their indicator. For any other group, SlidingIndicator follows the item carrying `data-selected`/`aria-selected` on `spring.snappy`.' },
  { id: 'collapse', when: 'A section expands or collapses', words: 'expand collapse accordion disclosure show more details height auto open close section', use: ['accordion', 'collapsible', 'collapse'], advice: 'Accordion and Collapsible ease their height to fit (`yj-collapse`). For content outside Base UI, Collapse animates height:auto and reverses mid-flight without a jump.' },
  { id: 'swap', when: 'Loaded content replaces a skeleton, or one view replaces another in place', words: 'skeleton loaded content swap replace loading state crossfade height change placeholder', use: ['content-swap', 'skeleton'], advice: 'ContentSwap swaps a Skeleton for the content and morphs the height between them, so nothing below jumps.' },
  { id: 'label', when: 'A label or value changes in place', words: 'label text change morph width crossfade status badge value', use: ['morph-label'], advice: 'MorphLabel crossfades the content and morphs the box to the new width on the same spring.' },
  { id: 'reveal', when: 'Content enters on mount or as it scrolls into view', words: 'reveal scroll into view appear fade rise enter entrance section landing on scroll', use: ['reveal', 'stagger'], advice: 'Reveal brings one element in (fade, rise, blur, scale or a clip wipe) on `ease.enter`; wrap a group in Stagger to sequence it on a stagger token.' },
  { id: 'stagger', when: 'A group of items plays in sequence', words: 'stagger sequence cascade grid cards list one after another delay', use: ['stagger'], advice: 'Stagger plays its children on `stagger.tight|base|loose`, from the start, end, center or a seeded random order.' },
  { id: 'counter', when: 'A number changes or counts up', words: 'number counter count up stat kpi metric ticker odometer price change', use: ['counter'], advice: 'Counter counts or rolls to its value, formatted by Intl.NumberFormat, and retargets mid-flight.' },
  { id: 'text', when: 'A headline or text animates in', words: 'text headline title letters words split typewriter scramble decode hero', use: ['text-split', 'scramble-text'], advice: 'TextSplit reveals characters, words or lines in sequence with one accessible copy of the text; ScrambleText decodes through random glyphs.' },
  { id: 'icon-state', when: 'An icon changes state (play/pause, menu/close, copy/copied)', words: 'icon state toggle morph play pause menu close mute copy check like', use: ['icon-swap'], advice: 'Use a state icon (`<PlayIcon active={playing} />`) when one covers the pair, or IconSwap between two icons. suggest_icon_morph finds the best pairing.', snippet: `import { MenuIcon } from '@youj/icons'\n\n<button type="button" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>\n  <MenuIcon active={open} />\n</button>` },
  { id: 'icon-hover', when: 'An icon animates on hover', words: 'icon hover animate button wiggle spin bounce effect lucide', use: ['youj-icon'], advice: 'Youj icons play when their button is hovered or focused, with no wiring. If your app uses Lucide, YoujIcon adds those triggers and animation effects.' },
  { id: 'hover-card', when: 'Cards respond to the pointer', words: 'hover card pointer glow spotlight tilt magnetic follow light 3d', use: ['spotlight-card', 'tilt', 'magnetic'], advice: 'SpotlightCard lights cards from the pointer (a grid shares one light); Tilt leans a surface toward it; Magnetic pulls a control in. All stop under reduced motion.' },
  { id: 'loading', when: 'Something is loading', words: 'loading spinner wait progress busy pending indeterminate placeholder', use: ['spinner', 'skeleton', 'progress'], advice: 'Spinner for short waits, Skeleton in the shape of content still loading, Progress when it can be measured.' },
  { id: 'page', when: 'Routes or views transition', words: 'page route transition navigate view change slide fade curtain', use: ['page-transition'], advice: 'PageTransition fades through, slides by direction, clip-reveals or curtains between routes or views.' },
  { id: 'scroll', when: 'Motion follows the scroll', words: 'scroll progress parallax depth reading bar indicator', use: ['scroll-progress', 'parallax'], advice: 'ScrollProgress shows how far the page has scrolled as a spring-smoothed bar or ring; Parallax maps scroll progress onto transforms.' },
  { id: 'marquee', when: 'Logos or items loop continuously', words: 'marquee logos loop ticker infinite scroll carousel', use: ['marquee'], advice: 'Marquee loops seamlessly and eases to a stop on hover and focus.' },
  { id: 'attention', when: 'One element should draw the eye', words: 'attention highlight glow border shimmer primary cta call to action', use: ['shimmer-border', 'shimmer'], advice: 'A travelling point of accent light on a border. Use it once per screen.' },
  { id: 'background', when: 'An ambient hero background', words: 'background hero ambient gradient aurora shader particles backdrop flow field swarm flock boids', use: ['mesh-gradient', 'aurora', 'particle-constellation', 'flow-field', 'swarm'], advice: 'Shader and canvas backdrops that follow the time scale, pause offscreen and hold a still frame under reduced motion.' },
  { id: 'dock', when: 'A dock that magnifies under the pointer', words: 'dock magnify macos launcher toolbar', use: ['dock'], advice: 'Dock grows icons under the pointer on transforms only.' },
  { id: 'sound', when: 'Interface sounds: a click, a chime, audio feedback', words: 'sound audio click beep chime ding tone feedback haptic tap toggle success error notification mute volume ui sounds', use: ['sound'], advice: 'Install `@youj/sound` and pass a pack to the provider, `<YoujProvider sound={beacon}>` (no `sound` prop, no sound and no sound code downloaded; `sound={false}` silences a subtree; `sound={{ pack, muted, onMutedChange }}` holds the mute, `useSound()` from @youj/core reads and sets it): Button, Switch, Checkbox, Toggle, Tabs, SegmentedControl, Dialog, Sheet, Toaster and the copy buttons already emit cues (`tap`, `select`, `toggleOn`/`toggleOff`, `success`, `error`, `notify`, `open`/`close`, `tick`) as their motion starts. It stays silent under reduced motion (unless `sound={{ whenReduced: true }}`), before the first gesture and in hidden tabs, and nothing downloads until sound is on. In your own component, emit a cue with `useSoundCue()` from @youj/core; never let a sound be the only signal.', snippet: `// A pack is an object of functions: in the Next.js App Router, give it to the provider from a 'use client' file.\n'use client'\n\nimport { YoujProvider } from '@youj/core'\nimport { beacon } from '@youj/sound'\n\n<YoujProvider sound={{ pack: beacon, volume: 0.5 }}>\n  {children}\n</YoujProvider>` },
  { id: 'custom', when: 'Custom motion in your own component', words: 'custom own component animate motion framer tokens duration easing spring css transition', use: [], advice: 'Take timing from the tokens so the provider\'s speed and reduced motion reach it: `useYouj()` in JS, `var(--yj-duration-*)` and `ease-*` in CSS. Never hard-code ms or cubic-beziers.', snippet: `import { motion } from 'motion/react'\nimport { useYouj } from '@youj/core'\n\nexport function Panel({ open }: { open: boolean }) {\n  const k = useYouj()\n  return (\n    <motion.div\n      initial={false}\n      animate={{ opacity: open ? 1 : 0, y: open ? 0 : k.reduced ? 0 : 8 }}\n      transition={k.tween('base', open ? 'enter' : 'exit')}\n    />\n  )\n}\n\n// CSS: transition: opacity var(--yj-duration-fast) var(--ease-standard);` },
]

let searcher: Searcher<Recipe> | undefined

export function motionGuidance(catalog: Catalog, interaction: string): string {
  searcher ??= new Searcher(RECIPES.map((r) => ({ item: r, fields: [[r.when, 4], [r.words, 2], [r.advice, 0.5]] as [string, number][] })))
  const matches = searcher.search(interaction, 3)
  if (!matches.length) throw new NotFound(`No recipe for "${interaction}". Describe the moment (what appears, changes or leaves), e.g. "toast enters", "list reorders", "button success".`)
  const [best, ...rest] = matches.filter((m) => m.score >= matches[0]!.score * 0.5).map((m) => m.item)
  const main = best!.use.map((name) => catalog.components.get(name)).filter((c) => !!c)
  const lead = main[0]
  const site = catalog.index.meta.site
  const out = [`# ${best!.when}`, '', best!.advice]
  if (main.length) out.push('', `Use: ${main.map((c) => `**${c.title}** (\`${c.name}\`, ${c.install.copyOnly ? c.install.registryCommand : (c.install.packageImport?.replace(/^import /, '') ?? c.install.packageStylesheet)})`).join(', ')}.`)
  const snippet = best!.snippet ?? lead?.usage
  if (snippet) out.push('', code('tsx', snippet))
  if (lead?.motion?.length) out.push('', `## Tokens (${lead.title})`, '', motionLines(lead.motion))
  out.push('', '## Reduced motion', '', lead?.reduced ?? 'Under reduced motion, `useYouj().reduced` is true: render the end state instantly, with the same information, and stop loops. CSS durations multiply by `--yj-motion` (0 when reduced), so token-based CSS transitions become instant for free.')
  if (lead?.docs) out.push('', `Docs: ${site}/docs/${lead.docs}${main.length > 1 ? ` · more: ${main.slice(1).map((c) => `get_component("${c.name}")`).join(', ')}` : ''}`)
  // The guidelines hold the duration band for every kind of interaction, whichever piece does it.
  const guidelines = catalog.index.docs.find((d) => d.slug === 'motion/principles')
  if (guidelines) out.push('', `Timing by interaction, and when not to animate: ${site}${guidelines.url}`)
  if (rest.length) out.push('', `Related: ${rest.map((r) => r.when).join('; ')}.`)
  return out.join('\n')
}
