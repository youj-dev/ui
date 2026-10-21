/* The build hands control back with setTimeout(0) a few hundred times a run
 * (pause() in src/plugin/steps.ts). Node holds every such timer for at least
 * 1 ms, a third of a second per build that Figma doesn't spend. Here a
 * zero-delay timeout still yields to the event loop, through setImmediate,
 * without the wait. Timeouts with a delay are untouched. */

const { setTimeout: timeout, clearTimeout: clear } = globalThis
const immediates = new WeakSet<object>()

globalThis.setTimeout = ((fn: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => {
  if (ms) return timeout(fn, ms, ...args)
  const id = setImmediate(fn, ...args)
  immediates.add(id)
  return id
}) as typeof setTimeout

globalThis.clearTimeout = ((id: Parameters<typeof clearTimeout>[0]) => {
  if (id && typeof id === 'object' && immediates.has(id)) clearImmediate(id as unknown as NodeJS.Immediate)
  else clear(id)
}) as typeof clearTimeout
