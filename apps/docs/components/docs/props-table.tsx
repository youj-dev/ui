import { componentDoc, type ComponentDoc } from '@/lib/props'
import { PropsTableView } from './props-table-view'

/**
 * A component's props, generated at build time from its TypeScript source
 * (scripts/props.ts). Only props the package declares are listed; inherited
 * DOM or motion props are summarized as "extends".
 */
export function PropsTable({ name, omit = [], doc = componentDoc(name) }: { name: string; omit?: string[]; doc?: ComponentDoc }) {
  return <PropsTableView name={name} doc={{ ...doc, props: doc.props.filter((p) => !omit.includes(p.name)) }} />
}
