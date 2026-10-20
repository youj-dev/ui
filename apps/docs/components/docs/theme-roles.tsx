import { ROLES } from '@youj/core/lib/youj/theme'
import { ROLE_DOCS, ROLE_GROUPS } from '@/lib/theme-roles'

/* The theming page's role reference, drawn from core's ROLES (lib/theme-roles)
 * so the table can't drift. The live samples beside it are theme-samples.tsx. */

/** Backticks in a description as code. */
const prose = (text: string) => text.split(/`([^`]+)`/).map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part))

/** Every role core derives, by group, with what it is for (its class is the role after `bg-`, `text-`, `border-` or `ring-`). Plain table markup, in the page's own table style: the page carries it twice (HTML and RSC). */
export function RoleTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>For</th>
        </tr>
      </thead>
      <tbody>
        {ROLE_GROUPS.flatMap((group) => [
          <tr key={group}>
            <th colSpan={2}>{group}</th>
          </tr>,
          ...ROLES.filter((role) => ROLE_DOCS[role].group === group).map((role) => (
            <tr key={role}>
              <td>
                <code>{role}</code>
              </td>
              <td>{prose(ROLE_DOCS[role].use)}</td>
            </tr>
          )),
        ])}
      </tbody>
    </table>
  )
}
