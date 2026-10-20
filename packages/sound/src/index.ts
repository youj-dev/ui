// @youj/sound: the packs of interface sounds for Youj. Pass one to
// YoujProvider (`<YoujProvider sound={beacon}>`); components emit cues on
// motion's cue bus and the provider plays them from the pack. The player and
// each pack's audio are chunks of their own, fetched only while sound is on.
export { definePack, type PackDefinition, type SoundSource } from './lib/define-pack'
export type { SoundFile, SoundPack, SoundSources } from './lib/pack'
export { candidates } from './candidates'
export * from './packs'
