// The plugin API's types for code that runs outside Figma (tests, the fake, the preview):
// the interfaces without the sandbox's own console and timers, which clash with Node's.
/// <reference path="../node_modules/@figma/plugin-typings/plugin-api.d.ts" />
declare const figma: PluginAPI
