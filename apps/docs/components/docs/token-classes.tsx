import { tokenClasses } from '@/lib/token-classes'

/** Every class a theme drives, by group, as plain names to copy (lib/token-classes reads them from the tokens at build time). Static markup: no client code. */
export function TokenClasses() {
  return (
    <ul>
      {tokenClasses().map(({ group, classes }) => (
        <li key={group}>
          <strong>{group}:</strong>{' '}
          {classes.map((name, i) => (
            <span key={name}>
              {i > 0 && ' '}
              <code>{name}</code>
            </span>
          ))}
        </li>
      ))}
    </ul>
  )
}
