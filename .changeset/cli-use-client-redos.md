---
'@youj/cli': patch
---

Security: `init` and `add` can no longer hang on a layout file with many leading comments. The check for a `'use client'` directive backtracked exponentially; it now reads the leading comments in one pass. It also no longer mistakes a directive-like string after code for a real directive.
