import { cn } from '@/lib/cn'
import type { ComponentDoc } from '@/lib/props'
import { InlineCode } from './inline-code'
import { ScrollFrame } from './scroll-table'

/** PropsTable's table, from a doc already read: no server imports, so a client view (a block page's story reference) can draw it too. */
export function PropsTableView({ name, doc }: { name: string; doc: ComponentDoc }) {
  const props = doc.props

  if (props.length === 0) {
    return (
      <p className="not-prose my-6 rounded-xl border border-line bg-surface px-4 py-3 text-[13.5px] leading-relaxed text-fg-muted">
        <code className="code-inline">{name}</code> adds no props of its own. They pass through to{' '}
        {(doc.extends ?? []).map((base, i) => (
          <span key={base}>
            {i > 0 && ', '}
            <code className="code-inline break-words">{base}</code>
          </span>
        ))}
        .
      </p>
    )
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-line">
      <ScrollFrame label={`${name} props, scrolls sideways`} className="outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
        {/* Below sm the rows stack (site.css, props-table). */}
        <table className="props-table">
          <caption className="sr-only">{name} props</caption>
          <thead className="bg-surface">
            <tr className="border-b border-line">
              <th scope="col" className="type-label w-[32%] px-4 py-2.5 text-start font-medium sm:w-[26%]">
                Prop
              </th>
              <th scope="col" className="type-label px-4 py-2.5 text-start font-medium">
                Type
              </th>
              <th scope="col" className="type-label hidden w-[18%] px-4 py-2.5 text-start font-medium sm:table-cell">
                Default
              </th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop) => (
              <tr key={prop.name} className="props-row">
                <th scope="row" className="props-key">
                  <code className={cn('props-name', prop.deprecated && 'line-through decoration-fg-subtle')}>{prop.name}</code>
                  {prop.required && <span className="props-required">Required</span>}
                  {prop.deprecated && <span className="type-label mt-1 block max-sm:mt-0">Deprecated</span>}
                </th>
                <td className="px-4 py-3">
                  <code className="props-type">{prop.type}</code>
                  {prop.deprecated && (
                    <p className="props-note">
                      <span className="font-medium text-fg">Deprecated.</span> <InlineCode text={prop.deprecated} />
                    </p>
                  )}
                  {prop.values && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {prop.values.map((value) => (
                        <code key={value} className="value-chip">
                          {value}
                        </code>
                      ))}
                    </div>
                  )}
                  {prop.description && (
                    <p className="props-note">
                      <InlineCode text={prop.description} />
                    </p>
                  )}
                  {prop.default !== undefined && (
                    <p className="props-default-inline">
                      default <span className="text-fg">{prop.default}</span>
                    </p>
                  )}
                </td>
                <td className="props-default">
                  {prop.default !== undefined ? (
                    <code className="props-default-value">{prop.default}</code>
                  ) : (
                    <span className="text-fg-subtle" aria-label="none">
                      –
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {doc.extends && (
            <tfoot>
              <tr className="border-t border-line bg-surface">
                <td colSpan={3} className="px-4 py-2.5 text-[12.5px] [overflow-wrap:anywhere] text-fg-muted">
                  Other props pass through: extends{' '}
                  {doc.extends.map((base, i) => (
                    <span key={base}>
                      {i > 0 && ', '}
                      <code className="code-inline">{base}</code>
                    </span>
                  ))}
                  .
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </ScrollFrame>
    </div>
  )
}
