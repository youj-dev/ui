/* Idempotency. Everything the plugin makes carries a key in its plugin data,
 * so a second run finds and updates the same page, collection, variable,
 * style or component instead of adding another. Instances elsewhere in the
 * file keep pointing at the same components. */

export const KEY = 'youj'

export const keyOf = (node: { getPluginData(key: string): string }) => node.getPluginData(KEY)

export function tag<T extends { setPluginData(key: string, value: string): void }>(node: T, key: string): T {
  node.setPluginData(KEY, key)
  return node
}

/** A direct child with this key. */
export function childByKey(parent: ChildrenMixin, key: string): SceneNode | undefined {
  return parent.children.find((n) => keyOf(n) === key)
}

/** Any descendant with this key. */
export function findByKey(root: ChildrenMixin, key: string): SceneNode | undefined {
  return root.findOne((n) => keyOf(n) === key) ?? undefined
}

/** Removes every child except the ones kept, so a container can be redrawn in place. */
export function clearChildren(parent: ChildrenMixin, keep: (node: SceneNode) => boolean = () => false) {
  for (const child of [...parent.children]) if (!keep(child)) child.remove()
}
