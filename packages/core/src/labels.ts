/* The workspace path for each component's labels (`@youj/core/labels`): a published build rewrites it to
 * `@youj/core/internal`, which exports the same names, so the package has no entry of this name.
 * Each component's own English defaults and the hook that resolves them against
 * the provider's `labels`. Components import only the set they need, so none pays
 * for every string. Apps translate through `<YoujProvider labels>` instead. */
export { useComponentLabels } from './lib/youj/use-component-labels'
export * from './lib/youj/labels-components'
