/* The notice `add` writes into an app that gets shadcn-derived code. The licence text is shadcn's, word for word
 * (test/notice.test.ts compares it with the one in shadcn's own package). */

import type { Change, Project } from './project'

export const NOTICE_PATH = 'licenses/shadcn-ui.txt'

export const SHADCN_NOTICE = `Youj's components start from the base-nova sources of shadcn/ui (https://github.com/shadcn-ui/ui),
whose licence follows. Keep this file with the components.

MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

/** Writes the notice into the app once; a file already there is left alone. Returns the change, or none. */
export function writeNotice(project: Project): Change[] {
  if (project.exists(NOTICE_PATH)) return []
  project.write(NOTICE_PATH, SHADCN_NOTICE)
  return project.commit()
}
