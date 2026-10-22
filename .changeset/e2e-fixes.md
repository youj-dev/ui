---
'@youj/cli': patch
'@youj/react': patch
---

Fixes from a first-time-user test of the npm packages:
- **CLI:** the Form hint installs `@hookform/resolvers@^5`, because v6 fails `npm install`. `create` installs and imports the Inter and JetBrains Mono its theme names, so a later `init` has nothing to change. `init` leaves a `YoujProvider` rendered through `app/providers.tsx` alone, instead of nesting a second one. `add` ends with the import for each block or component it copied.
- **Billing:** the invoices table scrolls sideways inside its card where it's narrow, instead of its date and period columns running into each other.
