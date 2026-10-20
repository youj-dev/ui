/** A script written into the page's HTML, run as it is parsed. `code` goes out as given: escape anything that isn't yours. */
export function InlineScript({ code, type }: { code: string; type?: string }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the one inline-script wrapper; callers pass code of their own
  return <script type={type} dangerouslySetInnerHTML={{ __html: code }} />
}
