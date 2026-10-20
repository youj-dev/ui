'use client'

import { DiffViewer } from '@youj/react'

const PATCH = `diff --git a/src/lib/format.ts b/src/lib/format.ts
--- a/src/lib/format.ts
+++ b/src/lib/format.ts
@@ -12,7 +12,8 @@ const units = ['B', 'KB', 'MB', 'GB', 'TB']
 export function formatBytes(bytes: number) {
   if (bytes === 0) return '0 B'
-  const i = Math.floor(Math.log(bytes) / Math.log(1024))
-  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i]
+  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
+  const value = bytes / 1024 ** i
+  return \`\${value.toFixed(value < 10 && i > 0 ? 1 : 0)} \${units[i]}\`
 }

 export function formatDuration(ms: number) {
@@ -48,6 +49,6 @@ export function formatRelative(date: Date, now: Date) {
   const seconds = Math.round((date.getTime() - now.getTime()) / 1000)
   const unit = pickUnit(seconds)
-  return rtf.format(seconds / UNIT_SECONDS[unit], unit)
+  return rtf.format(Math.round(seconds / UNIT_SECONDS[unit]), unit)
 }
`

export default function DiffViewerPatch() {
  return (
    <div className="w-full max-w-3xl">
      <DiffViewer patch={PATCH} language="ts" />
    </div>
  )
}
