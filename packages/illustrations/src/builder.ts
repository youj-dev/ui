// The illustration builder, kept in this workspace and not published (the docs site and the MCP import it): its scene format
// (parts, groups, bases; parse, sanitize, encode), its spec, the renderer that
// draws a scene with the kit, the code generator that writes it as a component,
// starter templates and an undo history. The builder's UI is the docs site's.
export * from './builder/model'
export * from './builder/spec'
export * from './builder/render'
export * from './builder/codegen'
export * from './builder/templates'
export * from './builder/history'
